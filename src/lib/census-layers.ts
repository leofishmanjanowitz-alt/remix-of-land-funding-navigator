/**
 * Category B (census indicators) and Category C (rent limits and payment
 * standards) map layers. Both render as graduated choropleths, so only one
 * may display at a time.
 *
 * All figures are sample data for the prototype. Thresholds are the real
 * statutory ones.
 */

import { FMR, PAYMENT_STANDARD, UNIT_LABEL, type UnitSize } from "./underwriting";

export type Rect = { x: number; y: number; w: number; h: number };

/* ------------------------- category B: census tracts ---------------------- */

export type Tract = {
  geoid: string;
  name: string;
  rect: Rect;
  /** Percent of population below the federal poverty line. */
  poverty: number;
  /** Median family income as a percent of area median family income. */
  mfiPct: number;
  /** Unemployment rate, percent. */
  unemployment: number;
};

export const TRACTS: Tract[] = [
  { geoid: "40143000200", name: "Tract 2.00 — Greenwood / Pearl", rect: { x: 100, y: 60, w: 340, h: 240 }, poverty: 35.2, mfiPct: 54, unemployment: 9.8 },
  { geoid: "40143002500", name: "Tract 25.00 — Downtown core", rect: { x: 440, y: 60, w: 340, h: 240 }, poverty: 21.4, mfiPct: 78, unemployment: 6.1 },
  { geoid: "40143004802", name: "Tract 48.02 — North Peoria", rect: { x: 780, y: 60, w: 340, h: 240 }, poverty: 28.6, mfiPct: 61, unemployment: 8.4 },
  { geoid: "40143007100", name: "Tract 71.00 — Kendall-Whittier", rect: { x: 100, y: 300, w: 340, h: 250 }, poverty: 24.9, mfiPct: 72, unemployment: 7.2 },
  { geoid: "40143005600", name: "Tract 56.00 — Riverview", rect: { x: 440, y: 300, w: 340, h: 250 }, poverty: 12.3, mfiPct: 96, unemployment: 4.3 },
  { geoid: "40143008300", name: "Tract 83.00 — South county fringe", rect: { x: 780, y: 300, w: 340, h: 250 }, poverty: 8.1, mfiPct: 118, unemployment: 3.6 },
  { geoid: "40143006400", name: "Tract 64.00 — West bank", rect: { x: 100, y: 550, w: 510, h: 230 }, poverty: 19.7, mfiPct: 81, unemployment: 6.8 },
  { geoid: "40143009100", name: "Tract 91.00 — Outer east", rect: { x: 610, y: 550, w: 510, h: 230 }, poverty: 26.3, mfiPct: 66, unemployment: 8.9 },
];

export const POVERTY_THRESHOLD = 20;
export const MFI_THRESHOLD = 80;
export const UNEMPLOYMENT_BENCHMARK = 6.6; // 1.5x the national rate, sample figure

/** NMTC low-income community test: poverty ≥ 20% OR MFI ≤ 80% of area median. */
export function nmtcEligible(t: Tract): boolean {
  return t.poverty >= POVERTY_THRESHOLD || t.mfiPct <= MFI_THRESHOLD;
}

export function nmtcTestsMet(t: Tract): string[] {
  const out: string[] = [];
  if (t.poverty >= POVERTY_THRESHOLD) out.push("poverty rate test");
  if (t.mfiPct <= MFI_THRESHOLD) out.push("median family income test");
  return out;
}

export function tractFor(centroid: [number, number]): Tract | null {
  const [x, y] = centroid;
  return (
    TRACTS.find((t) => x >= t.rect.x && x <= t.rect.x + t.rect.w && y >= t.rect.y && y <= t.rect.y + t.rect.h) ??
    null
  );
}

/* -------------------------- choropleth definitions ------------------------ */

export type ChoroplethId =
  | "poverty"
  | "mfi"
  | "unemployment"
  | "nmtc-eligible"
  | "tha-ps"
  | "fmr"
  | "lihtc-rent";

export type ChoroplethCategory = "B" | "C";

export type Choropleth = {
  id: ChoroplethId;
  category: ChoroplethCategory;
  name: string;
  description: string;
  /** Shown in the legend so the threshold is a number, not a color. */
  thresholdNote: string;
  sourceId: string;
};

export const CHOROPLETHS: Choropleth[] = [
  {
    id: "poverty",
    category: "B",
    name: "Poverty rate by tract",
    description: "Share of tract population below the federal poverty line.",
    thresholdNote: `Qualifying threshold: ${POVERTY_THRESHOLD}% or higher`,
    sourceId: "cb-acs-poverty",
  },
  {
    id: "mfi",
    category: "B",
    name: "Median family income as % of AMI",
    description: "Tract median family income measured against the area median.",
    thresholdNote: `Qualifying threshold: ${MFI_THRESHOLD}% or lower`,
    sourceId: "cb-acs-mfi",
  },
  {
    id: "unemployment",
    category: "B",
    name: "Unemployment rate by tract",
    description: "Used for the NMTC targeted-population and distress screens.",
    thresholdNote: `Distress benchmark: ${UNEMPLOYMENT_BENCHMARK}% (1.5× the national rate)`,
    sourceId: "cb-acs-unemp",
  },
  {
    id: "nmtc-eligible",
    category: "B",
    name: "NMTC eligible (either test met)",
    description: "Tracts meeting the poverty test, the income test, or both.",
    thresholdNote: `Eligible where poverty ≥ ${POVERTY_THRESHOLD}% or MFI ≤ ${MFI_THRESHOLD}%`,
    sourceId: "cb-nmtc",
  },
  {
    id: "tha-ps",
    category: "C",
    name: "THA voucher payment standards by ZIP",
    description: "What the housing authority will pay, by ZIP code and bedroom size.",
    thresholdNote: "Shaded by dollar amount for the selected bedroom size",
    sourceId: "ul-tha-ps",
  },
  {
    id: "fmr",
    category: "C",
    name: "HUD Fair Market Rent — Tulsa metro",
    description: "The federal benchmark the payment standard is set against.",
    thresholdNote: "Metro-wide figure; shaded uniformly across the area",
    sourceId: "ul-fmr",
  },
  {
    id: "lihtc-rent",
    category: "C",
    name: "LIHTC maximum rent by AMI band",
    description: "Maximum gross rent at 60% AMI for the selected bedroom size.",
    thresholdNote: "Gross rent — a utility allowance is deducted from this figure",
    sourceId: "ul-mtsp",
  },
];

/* --------------------------- category C: ZIP rents ------------------------ */

export type ZipArea = {
  zip: string;
  rect: Rect;
  /** Payment standard as a percent of the metro FMR, by ZIP. */
  psFactor: number;
};

export const ZIP_AREAS: ZipArea[] = [
  { zip: "74103", rect: { x: 380, y: 60, w: 380, h: 260 }, psFactor: 1.1 },
  { zip: "74106", rect: { x: 60, y: 60, w: 320, h: 260 }, psFactor: 0.92 },
  { zip: "74110", rect: { x: 760, y: 60, w: 380, h: 260 }, psFactor: 0.98 },
  { zip: "74120", rect: { x: 380, y: 320, w: 380, h: 250 }, psFactor: 1.06 },
  { zip: "74127", rect: { x: 60, y: 320, w: 320, h: 250 }, psFactor: 0.95 },
  { zip: "74145", rect: { x: 760, y: 320, w: 380, h: 250 }, psFactor: 1.02 },
  { zip: "74107", rect: { x: 60, y: 570, w: 540, h: 210 }, psFactor: 0.9 },
  { zip: "74129", rect: { x: 600, y: 570, w: 540, h: 210 }, psFactor: 0.97 },
];

export const RENT_EFFECTIVE_YEAR = "FY 2026";
export const RENT_EFFECTIVE_NOTE =
  "FY 2026 schedules — payment standards effective January 1, 2026, FMRs effective October 1, 2025. These republish annually; confirm before underwriting.";

/** LIHTC 60% AMI gross rent by unit size — sample figures. */
export const LIHTC_RENT_60: Record<UnitSize, number> = {
  eff: 985,
  "1br": 1055,
  "2br": 1266,
  "3br": 1463,
  "4br": 1632,
};

export function zipValue(id: ChoroplethId, zip: ZipArea, unit: UnitSize): number {
  if (id === "tha-ps") return Math.round((PAYMENT_STANDARD[unit] * zip.psFactor) / 5) * 5;
  if (id === "fmr") return FMR[unit];
  return LIHTC_RENT_60[unit];
}

export function tractValue(id: ChoroplethId, t: Tract): number {
  if (id === "poverty") return t.poverty;
  if (id === "mfi") return t.mfiPct;
  if (id === "unemployment") return t.unemployment;
  return nmtcEligible(t) ? 1 : 0;
}

export const UNIT_SELECTOR: { id: UnitSize; label: string }[] = (
  ["eff", "1br", "2br", "3br", "4br"] as UnitSize[]
).map((u) => ({ id: u, label: UNIT_LABEL[u] }));

/** Citation ids that belong to the census and rent layer groups. */
export const LAYER_CITATIONS = [
  "cb-acs-poverty",
  "cb-acs-mfi",
  "cb-acs-unemp",
  "cb-nmtc",
  "ul-tha-ps",
  "ul-fmr",
  "ul-mtsp",
];
