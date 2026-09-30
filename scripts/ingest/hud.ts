/**
 * HUD Qualified Census Tracts and Difficult Development Areas -> overlay_qct, overlay_dda.
 *
 * HUD publishes one ArcGIS service per designation year. This picks the newest
 * year available and records it as the pull's vintage.
 */
import {
  clearStaging,
  layerInfo,
  log,
  pool,
  queryAll,
  rawDir,
  replaceCurrent,
  saveRaw,
  stageFeatures,
  transaction,
  type Feature,
} from "./lib.ts";

const HUD = "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services";
const PUBLISHER = "U.S. Department of Housing and Urban Development (HUD eGIS)";
const LICENSE = "U.S. federal government work; public domain.";

/** Newest `<prefix>_<year>` service in HUD's catalog. */
async function newestService(prefix: string): Promise<{ name: string; vintage: string }> {
  const res = await fetch(`${HUD}?f=json`, { signal: AbortSignal.timeout(60_000) });
  const catalog = (await res.json()) as { services: { name: string; type: string }[] };
  const pattern = new RegExp(`^${prefix}_(\\d{4})$`, "i");
  const dated = catalog.services
    .filter((s) => s.type === "FeatureServer")
    .map((s) => ({ name: s.name, year: pattern.exec(s.name)?.[1] }))
    .filter((s): s is { name: string; year: string } => !!s.year)
    .sort((a, b) => b.year.localeCompare(a.year));
  const newest = dated[0];
  if (!newest) throw new Error(`No dated HUD service found for ${prefix}`);
  return { name: newest.name, vintage: newest.year };
}

/** Bounding box of the loaded parcels, padded slightly. */
async function parcelExtent(): Promise<[number, number, number, number]> {
  const r = await pool.query<{ xmin: number; ymin: number; xmax: number; ymax: number }>(
    `SELECT ST_XMin(e) xmin, ST_YMin(e) ymin, ST_XMax(e) xmax, ST_YMax(e) ymax
       FROM (SELECT ST_Extent(geom) e FROM parcels) s`,
  );
  const b = r.rows[0];
  if (!b || b.xmin == null)
    throw new Error("No parcels loaded. Run `npm run ingest:parcels` first.");
  return [b.xmin - 0.01, b.ymin - 0.01, b.xmax + 0.01, b.ymax + 0.01];
}

async function stage(
  sourceKey: string,
  url: string,
  opts: { where?: string; bbox?: [number, number, number, number] },
) {
  const dir = await rawDir(sourceKey);
  await clearStaging(sourceKey);
  return queryAll(url, {
    ...opts,
    onPage: async (features: Feature[], page) => {
      await saveRaw(dir, `page-${String(page).padStart(4, "0")}.geojson`, {
        type: "FeatureCollection",
        features,
      });
      await stageFeatures(sourceKey, features);
    },
  });
}

/* ------------------------------- QCT ------------------------------- */
{
  const key = "hud_qct";
  const svc = await newestService("QUALIFIED_CENSUS_TRACTS");
  const url = `${HUD}/${svc.name}/FeatureServer/0`;
  const info = await layerInfo(url);
  // Tulsa County, Oklahoma = state FIPS 40, county FIPS 143.
  const where = "STATE='40' AND COUNTY='143'";
  const fetched = await stage(key, url, { where });
  log(key, `vintage ${svc.vintage}: fetched ${fetched} tracts`);
  const { count } = await transaction((client) =>
    replaceCurrent(
      client,
      {
        sourceKey: key,
        datasetName: `Qualified Census Tracts ${svc.vintage}`,
        publisher: PUBLISHER,
        sourceUrl: url,
        vintage: svc.vintage,
        sourceLastEdit: info.dataLastEdit,
        licenseNote: LICENSE,
        params: { where },
      },
      ["overlay_qct"],
      async (pullId) => {
        const res = await client.query(
          `INSERT INTO overlay_qct (pull_id, geoid, name, vintage, geom)
           SELECT $1, attrs ->> 'GEOID', CASE WHEN attrs ->> 'NAME' ILIKE 'census tract%' THEN attrs ->> 'NAME' ELSE 'Census Tract ' || (attrs ->> 'NAME') END, $2, staging.as_multipolygon(geom)
             FROM staging.features
            WHERE source_key = $3 AND staging.as_multipolygon(geom) IS NOT NULL`,
          [pullId, svc.vintage, key],
        );
        return res.rowCount ?? 0;
      },
    ),
  );
  log(key, `loaded ${count} rows into overlay_qct`);
}

/* ------------------------------- DDA ------------------------------- */
{
  const key = "hud_dda";
  const svc = await newestService("Difficult_Development_Areas");
  const url = `${HUD}/${svc.name}/FeatureServer/0`;
  const info = await layerInfo(url);
  const bbox = await parcelExtent();
  const fetched = await stage(key, url, { bbox });
  log(key, `vintage ${svc.vintage}: fetched ${fetched} areas touching the parcel extent`);
  const { count } = await transaction((client) =>
    replaceCurrent(
      client,
      {
        sourceKey: key,
        datasetName: `Difficult Development Areas ${svc.vintage}`,
        publisher: PUBLISHER,
        sourceUrl: url,
        vintage: svc.vintage,
        sourceLastEdit: info.dataLastEdit,
        licenseNote: LICENSE,
        params: { bbox },
        notes: "Only areas that intersect at least one loaded parcel are kept.",
      },
      ["overlay_dda"],
      async (pullId) => {
        const res = await client.query(
          `INSERT INTO overlay_dda (pull_id, code, dda_type, name, vintage, geom)
           SELECT $1, COALESCE(NULLIF(f.attrs ->> 'ZCTA5', ''), f.attrs ->> 'DDA_CODE'),
                  f.attrs ->> 'DDA_TYPE', f.attrs ->> 'DDA_NAME', $2, g.geom
             FROM staging.features f
             CROSS JOIN LATERAL (SELECT staging.as_multipolygon(f.geom) AS geom) g
            WHERE f.source_key = $3 AND g.geom IS NOT NULL
              AND EXISTS (SELECT 1 FROM parcels p WHERE ST_Intersects(p.geom, g.geom))`,
          [pullId, svc.vintage, key],
        );
        return res.rowCount ?? 0;
      },
    ),
  );
  log(key, `loaded ${count} rows into overlay_dda`);
}

await pool.end();
