/**
 * Shared helpers for the ingest scripts.
 *
 * Every ingest: download from the public source -> keep a raw copy under
 * data/raw/<source>/<date>/ -> load staging.features -> normalize into the
 * public tables and record a source_pulls row, all in one transaction so the
 * app never sees a half-loaded source.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type pg from "pg";
import { pool, transaction } from "../db/client.ts";

export { pool, transaction };

export const RAW_ROOT = path.resolve(import.meta.dirname, "../../data/raw");

export type Feature = {
  type: "Feature";
  geometry: unknown;
  properties: Record<string, unknown> | null;
};

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function rawDir(sourceKey: string): Promise<string> {
  const dir = path.join(RAW_ROOT, sourceKey, today());
  await mkdir(dir, { recursive: true });
  return dir;
}

async function getJson(url: string, attempt = 1): Promise<unknown> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { error?: { message?: string; code?: number } };
    if (json && typeof json === "object" && json.error) {
      throw new Error(`service error ${json.error.code ?? ""} ${json.error.message ?? ""}`);
    }
    return json;
  } catch (error) {
    if (attempt >= 4)
      throw new Error(`GET ${url} failed after ${attempt} attempts: ${String(error)}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
    return getJson(url, attempt + 1);
  }
}

export type LayerInfo = {
  name: string;
  maxRecordCount: number;
  /** The layer's own last data edit, when the service publishes one. */
  dataLastEdit: Date | null;
  description: string;
  copyright: string;
};

/** Metadata for an ArcGIS feature layer (url ends in /FeatureServer/<n> or /MapServer/<n>). */
export async function layerInfo(layerUrl: string): Promise<LayerInfo> {
  const j = (await getJson(`${layerUrl}?f=json`)) as {
    name?: string;
    maxRecordCount?: number;
    description?: string;
    copyrightText?: string;
    editingInfo?: { dataLastEditDate?: number; lastEditDate?: number };
  };
  const ms = j.editingInfo?.dataLastEditDate ?? j.editingInfo?.lastEditDate;
  return {
    name: j.name ?? "",
    maxRecordCount: j.maxRecordCount ?? 1000,
    dataLastEdit: typeof ms === "number" ? new Date(ms) : null,
    description: (j.description ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    copyright: j.copyrightText ?? "",
  };
}

export async function layerCount(layerUrl: string, where = "1=1"): Promise<number> {
  const qs = new URLSearchParams({ where, returnCountOnly: "true", f: "json" });
  const j = (await getJson(`${layerUrl}/query?${qs}`)) as { count: number };
  return j.count;
}

export type QueryOptions = {
  where?: string;
  outFields?: string;
  pageSize?: number;
  /** Envelope filter in EPSG:4326: [minLng, minLat, maxLng, maxLat]. */
  bbox?: [number, number, number, number];
  /** Field to page by; must be unique and indexed. */
  orderBy?: string;
  /** Called with each page as it arrives. */
  onPage: (features: Feature[], page: number) => Promise<void>;
};

/** Pages through an ArcGIS layer as GeoJSON in EPSG:4326. Returns the feature count. */
export async function queryAll(layerUrl: string, opts: QueryOptions): Promise<number> {
  const pageSize = opts.pageSize ?? 1000;
  let total = 0;
  for (let page = 0; ; page++) {
    const qs = new URLSearchParams({
      where: opts.where ?? "1=1",
      outFields: opts.outFields ?? "*",
      outSR: "4326",
      f: "geojson",
      geometryPrecision: "7",
      orderByFields: opts.orderBy ?? "OBJECTID",
      resultOffset: String(page * pageSize),
      resultRecordCount: String(pageSize),
    });
    if (opts.bbox) {
      qs.set("geometry", opts.bbox.join(","));
      qs.set("geometryType", "esriGeometryEnvelope");
      qs.set("inSR", "4326");
      qs.set("spatialRel", "esriSpatialRelIntersects");
    }
    const j = (await getJson(`${layerUrl}/query?${qs}`)) as {
      features?: Feature[];
      properties?: { exceededTransferLimit?: boolean };
      exceededTransferLimit?: boolean;
    };
    const features = j.features ?? [];
    if (features.length > 0) await opts.onPage(features, page);
    total += features.length;
    const more =
      j.properties?.exceededTransferLimit ??
      j.exceededTransferLimit ??
      features.length === pageSize;
    if (features.length === 0 || !more) break;
  }
  return total;
}

export async function saveRaw(dir: string, name: string, data: unknown): Promise<void> {
  await writeFile(path.join(dir, name), JSON.stringify(data));
}

export async function clearStaging(sourceKey: string): Promise<void> {
  await pool.query("DELETE FROM staging.features WHERE source_key = $1", [sourceKey]);
}

/** Loads one page of GeoJSON features into staging.features. */
export async function stageFeatures(sourceKey: string, features: Feature[]): Promise<void> {
  await pool.query(
    `INSERT INTO staging.features (source_key, attrs, geom)
     SELECT $1, COALESCE(f -> 'properties', '{}'::jsonb),
            CASE WHEN f -> 'geometry' IS NULL OR f ->> 'geometry' IS NULL THEN NULL
                 ELSE ST_SetSRID(ST_GeomFromGeoJSON(f ->> 'geometry'), 4326) END
     FROM jsonb_array_elements($2::jsonb) AS f`,
    [sourceKey, JSON.stringify(features)],
  );
}

export type PullMeta = {
  sourceKey: string;
  datasetName: string;
  publisher: string;
  sourceUrl: string;
  vintage?: string | null;
  sourceLastEdit?: Date | null;
  licenseNote?: string | null;
  params?: Record<string, unknown>;
  notes?: string | null;
};

/**
 * Records a pull and swaps it in as the current one for its source.
 * `load` inserts the new rows (tagged with the new pull id) and returns how many.
 * Rows from that source's older pulls are then removed from `tables`.
 */
export async function replaceCurrent(
  client: pg.PoolClient,
  meta: PullMeta,
  tables: string[],
  load: (pullId: number) => Promise<number>,
): Promise<{ pullId: number; count: number }> {
  const inserted = await client.query<{ id: number }>(
    `INSERT INTO source_pulls
       (source_key, dataset_name, publisher, source_url, vintage, source_last_edit, license_note, params, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      meta.sourceKey,
      meta.datasetName,
      meta.publisher,
      meta.sourceUrl,
      meta.vintage ?? null,
      meta.sourceLastEdit ?? null,
      meta.licenseNote ?? null,
      JSON.stringify(meta.params ?? {}),
      meta.notes ?? null,
    ],
  );
  const pullId = inserted.rows[0]!.id;
  const count = await load(pullId);
  if (count === 0)
    throw new Error(`${meta.sourceKey}: load produced 0 rows; keeping the previous pull`);

  for (const table of tables) {
    await client.query(
      `DELETE FROM ${table}
        WHERE pull_id IN (SELECT id FROM source_pulls WHERE source_key = $1 AND id <> $2)`,
      [meta.sourceKey, pullId],
    );
  }
  await client.query("UPDATE source_pulls SET is_current = false WHERE source_key = $1", [
    meta.sourceKey,
  ]);
  await client.query("UPDATE source_pulls SET is_current = true, record_count = $2 WHERE id = $1", [
    pullId,
    count,
  ]);
  return { pullId, count };
}

export function log(sourceKey: string, message: string): void {
  console.log(`[${sourceKey}] ${message}`);
}
