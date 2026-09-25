/**
 * Real published GIS layers for Tulsa.
 *
 * Each layer is fetched live from the publishing agency's ArcGIS REST service.
 * If that request fails (server down, offline, slow network) we fall back to a
 * simplified copy of the same dataset saved in `src/data/`, and the UI says so.
 *
 * The saved copies were taken on the date in SNAPSHOT_DATE below.
 */

import type { LayerId } from "./tulsa-map-data";

export const SNAPSHOT_DATE = "2026-09-18";

export type GisLayerId = Extract<LayerId, "tif" | "fema" | "zoning">;

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties: Record<string, unknown> | null;
  }>;
};

interface GisSource {
  /** ArcGIS feature layer endpoint (no trailing slash). */
  url: string;
  outFields: string;
  /** Douglas-Peucker tolerance in degrees; keeps payloads small. */
  offset: number;
  /** Publishing body, shown in the layer panel. */
  attribution: string;
  /** Popup title for one feature. */
  label: (props: Record<string, unknown>) => string;
  /** Optional second popup line. */
  detail?: (props: Record<string, unknown>) => string | null;
  /** Vite URL of the saved copy, loaded only when the live request fails. */
  cachedUrl: () => Promise<string>;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const GIS_SOURCES: Record<GisLayerId, GisSource> = {
  tif: {
    url: "https://services3.arcgis.com/ratx1xWpTPZDmMzX/arcgis/rest/services/Tulsa_TIF_Districts/FeatureServer/76",
    outFields: "Name,District,Acres",
    offset: 0,
    attribution: "Tulsa tax increment district boundaries (ArcGIS Online)",
    label: (p) => str(p["Name"]) || "TIF district",
    detail: (p) => {
      const d = str(p["District"]);
      const raw = p["Acres"];
      const acres = typeof raw === "number" ? `${Math.round(raw)} acres` : "";
      return [d, acres].filter(Boolean).join(" · ") || null;
    },
    cachedUrl: () => import("@/data/tulsa-tif.geojson.json?url").then((m) => m.default),
  },
  fema: {
    url: "https://services2.arcgis.com/XkZ90iCdbTJ9oNXl/arcgis/rest/services/Floodplains_OpenData/FeatureServer/0",
    outFields: "FLD_TYPE,COMMENT",
    offset: 0.0003,
    attribution: "City of Tulsa regulatory floodplains",
    label: (p) => str(p["FLD_TYPE"]) || "Floodplain",
    detail: (p) => str(p["COMMENT"]) || null,
    cachedUrl: () => import("@/data/tulsa-floodplain.geojson.json?url").then((m) => m.default),
  },
  zoning: {
    url: "https://services2.arcgis.com/XkZ90iCdbTJ9oNXl/arcgis/rest/services/TulsaZoning_OpenData/FeatureServer/0",
    outFields: "ZONE_TYPE,LEGEND",
    offset: 0.0003,
    attribution: "City of Tulsa zoning",
    label: (p) => str(p["ZONE_TYPE"]) || "Zoning",
    detail: (p) => str(p["LEGEND"]) || null,
    cachedUrl: () => import("@/data/tulsa-zoning.geojson.json?url").then((m) => m.default),
  },
};

export const GIS_LAYER_IDS = Object.keys(GIS_SOURCES) as GisLayerId[];

export function isGisLayer(id: LayerId): id is GisLayerId {
  return (GIS_LAYER_IDS as string[]).includes(id);
}

export type GisStatus = "live" | "cached" | "loading" | "error";

export interface GisLayerResult {
  data: GeoJsonFeatureCollection;
  source: "live" | "cached";
}

function isCollection(value: unknown): value is GeoJsonFeatureCollection {
  return (
    !!value &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "FeatureCollection" &&
    Array.isArray((value as { features?: unknown }).features)
  );
}

const PAGE = 1000;

async function fetchLive(src: GisSource, signal?: AbortSignal): Promise<GeoJsonFeatureCollection> {
  const features: GeoJsonFeatureCollection["features"] = [];
  for (let offset = 0; offset < 20000; offset += PAGE) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: src.outFields,
      outSR: "4326",
      f: "geojson",
      geometryPrecision: "5",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE),
    });
    if (src.offset > 0) params.set("maxAllowableOffset", String(src.offset));

    const res = await fetch(
      `${src.url}/query?${params.toString()}`,
      signal ? { signal } : undefined,
    );
    if (!res.ok) throw new Error(`GIS request failed [${res.status}]`);
    const json: unknown = await res.json();
    if (!isCollection(json)) throw new Error("GIS response was not a FeatureCollection");
    features.push(...json.features);
    if (json.features.length < PAGE) break;
  }
  if (features.length === 0) throw new Error("GIS response was empty");
  return { type: "FeatureCollection", features };
}

/** Live data where possible, saved copy otherwise. Never throws. */
export async function fetchGisLayer(id: GisLayerId, signal?: AbortSignal): Promise<GisLayerResult> {
  const src = GIS_SOURCES[id];
  try {
    return { data: await fetchLive(src, signal), source: "live" };
  } catch {
    const url = await src.cachedUrl();
    const res = await fetch(url, signal ? { signal } : undefined);
    const json: unknown = await res.json();
    if (!isCollection(json)) throw new Error("Saved copy of this layer is unreadable");
    return { data: json, source: "cached" };
  }
}
