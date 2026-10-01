/** What each overlay is, how it is drawn, and where it comes from. */

export type OverlayApiKind =
  "tif" | "qct" | "dda" | "oz" | "usda_ineligible" | "municipality" | "council_district";

export interface OverlayMeta {
  key: OverlayApiKind;
  /** The source_pulls key, for the vintage and pull date shown in the layer panel. */
  sourceKey: string;
  label: string;
  group: "designation" | "boundary";
  /** CSS variable for the stroke and fill. */
  color: string;
  /** Filled area, or outline only (boundaries that would bury everything else). */
  fill: boolean;
  dash?: string;
  description: string;
  /** Who publishes it. The vintage and pull date come from the API (source_pulls). */
  source: string;
}

export const OVERLAYS: OverlayMeta[] = [
  {
    key: "tif",
    sourceKey: "incog_tif",
    label: "TIF districts",
    group: "designation",
    color: "var(--layer-tif)",
    fill: true,
    description: "Tax increment financing districts",
    source: "Built from Tulsa County Assessor parcel records (via INCOG)",
  },
  {
    key: "qct",
    sourceKey: "hud_qct",
    label: "Qualified Census Tracts",
    group: "designation",
    color: "var(--layer-qct)",
    fill: true,
    description: "HUD tracts that add a 30% basis boost to housing tax credits",
    source: "HUD",
  },
  {
    key: "dda",
    sourceKey: "hud_dda",
    label: "Difficult Development Areas",
    group: "designation",
    color: "var(--layer-dda)",
    fill: true,
    description: "HUD small-area DDAs (by ZIP code)",
    source: "HUD",
  },
  {
    key: "oz",
    sourceKey: "cdfi_oz",
    label: "Opportunity Zones",
    group: "designation",
    color: "var(--layer-oz)",
    fill: true,
    description: "Tracts designated in 2018 (2017 tax law)",
    source: "CDFI Fund, U.S. Treasury",
  },
  {
    key: "usda_ineligible",
    sourceKey: "usda_rural",
    label: "USDA rural programs: not eligible",
    group: "designation",
    color: "var(--layer-usda-out)",
    fill: true,
    dash: "5 4",
    description:
      "Shaded = USDA rural housing programs do not apply. Land outside the shading is rural-eligible.",
    source: "USDA Rural Development",
  },
  {
    key: "municipality",
    sourceKey: "incog_city_limits",
    label: "City limits",
    group: "boundary",
    color: "var(--layer-muni)",
    fill: false,
    dash: "8 5",
    description: "Every municipality in Tulsa County. Land outside them is unincorporated county.",
    source: "INCOG",
  },
  {
    key: "council_district",
    sourceKey: "tulsa_council_districts",
    label: "Council districts (Tulsa)",
    group: "boundary",
    color: "var(--layer-council)",
    fill: false,
    description: "City of Tulsa council districts",
    source: "City of Tulsa GIS",
  },
];

export const OVERLAY_BY_KEY = Object.fromEntries(OVERLAYS.map((o) => [o.key, o])) as Record<
  OverlayApiKind,
  OverlayMeta
>;

/* ---------------- display-only layers (not part of any result) ---------------- */

export type DisplayLayerKey = "floodplain" | "fema" | "zoning";

export interface DisplayLayerMeta {
  key: DisplayLayerKey;
  label: string;
  color: string;
  description: string;
  source: string;
  /** Drawn from the City of Tulsa's published ArcGIS service (saved copy as fallback). */
  gisId?: "fema" | "zoning";
  /** Drawn from FEMA's map tiles. */
  tiles?: boolean;
}

export const DISPLAY_LAYERS: DisplayLayerMeta[] = [
  {
    key: "floodplain",
    label: "City floodplains",
    color: "var(--layer-fema)",
    description: "City of Tulsa regulatory floodplains",
    source: "City of Tulsa GIS",
    gisId: "fema",
  },
  {
    key: "fema",
    label: "FEMA flood hazard",
    color: "var(--layer-fema)",
    description: "National Flood Hazard Layer map tiles",
    source: "FEMA",
    tiles: true,
  },
  {
    key: "zoning",
    label: "Zoning districts",
    color: "var(--layer-nco)",
    description: "Published base zoning for every parcel in the city",
    source: "City of Tulsa GIS",
    gisId: "zoning",
  },
];

export type LayerKey = OverlayApiKind | DisplayLayerKey;
export type LayerState = Record<LayerKey, boolean>;

export const ALL_LAYER_KEYS: LayerKey[] = [
  ...OVERLAYS.map((o) => o.key),
  ...DISPLAY_LAYERS.map((d) => d.key),
];

export const DEFAULT_LAYERS: LayerState = {
  tif: true,
  qct: true,
  dda: false,
  oz: false,
  usda_ineligible: false,
  municipality: false,
  council_district: false,
  floodplain: false,
  fema: false,
  zoning: false,
};

/** ?layers=all, or a comma list like ?layers=tif,qct,municipality. */
export function layersFromParam(param: string | undefined): LayerState {
  if (!param) return { ...DEFAULT_LAYERS };
  if (param === "all")
    return Object.fromEntries(ALL_LAYER_KEYS.map((k) => [k, true])) as LayerState;
  const wanted = new Set(param.split(",").map((p) => p.trim()));
  return Object.fromEntries(ALL_LAYER_KEYS.map((k) => [k, wanted.has(k)])) as LayerState;
}
