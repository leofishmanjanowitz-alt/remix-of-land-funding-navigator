/** What each overlay is, how it is drawn, and where it comes from. */

export type OverlayApiKind =
  "tif" | "qct" | "dda" | "oz" | "usda_ineligible" | "municipality" | "council_district";

export interface OverlayMeta {
  key: OverlayApiKind;
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
    label: "TIF districts",
    group: "designation",
    color: "var(--layer-tif)",
    fill: true,
    description: "Tax increment financing districts",
    source: "Built from Tulsa County Assessor parcel records (via INCOG)",
  },
  {
    key: "qct",
    label: "Qualified Census Tracts",
    group: "designation",
    color: "var(--layer-qct)",
    fill: true,
    description: "HUD tracts that add a 30% basis boost to housing tax credits",
    source: "HUD",
  },
  {
    key: "dda",
    label: "Difficult Development Areas",
    group: "designation",
    color: "var(--layer-dda)",
    fill: true,
    description: "HUD small-area DDAs (by ZIP code)",
    source: "HUD",
  },
  {
    key: "oz",
    label: "Opportunity Zones",
    group: "designation",
    color: "var(--layer-oz)",
    fill: true,
    description: "Tracts designated in 2018 (2017 tax law)",
    source: "CDFI Fund, U.S. Treasury",
  },
  {
    key: "usda_ineligible",
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
