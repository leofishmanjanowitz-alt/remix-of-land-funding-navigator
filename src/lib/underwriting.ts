/**
 * Underwriting limits for the Tulsa, OK HUD Metro FMR Area.
 *
 * Mock figures modeled on the published HUD / PHA schedule structure. Every
 * table carries an effective date and a currency caveat: these are republished
 * annually and must be confirmed against the current schedule before use.
 */

export const AREA = {
  name: "Tulsa, OK HUD Metro FMR Area",
  counties: "Tulsa, Creek, Okmulgee, Osage, Pawnee, Rogers, Wagoner counties",
  fips: "METRO46140M46140",
  /** FY of the income / rent limit schedule. */
  limitYear: 2026,
  limitsEffective: "April 1, 2026",
  fmrEffective: "October 1, 2025 (FY 2026)",
  paymentStandardEffective: "January 1, 2026",
  utilityAllowanceEffective: "January 1, 2026",
  /** HUD area median family income, 4-person. */
  medianFamilyIncome: 89_000,
};

export const CURRENCY_CAVEAT =
  "Published annually and superseded without notice. Confirm every figure against the current schedule before underwriting.";

export type Band = "30" | "50" | "60" | "80";
export const BANDS: Band[] = ["30", "50", "60", "80"];
export const BAND_LABEL: Record<Band, string> = {
  "30": "30% AMI",
  "50": "50% AMI",
  "60": "60% AMI",
  "80": "80% AMI",
};

export const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** HUD family-size adjustment applied to the 4-person limit. */
const SIZE_FACTOR: Record<number, number> = {
  1: 0.7,
  2: 0.8,
  3: 0.9,
  4: 1.0,
  5: 1.08,
  6: 1.16,
  7: 1.24,
  8: 1.32,
};

/** Four-person very low-income (50%) limit for the area, as published. */
const FOUR_PERSON_50 = 44_500;

const BAND_FACTOR: Record<Band, number> = { "30": 0.6, "50": 1, "60": 1.2, "80": 1.6 };

const round50 = (n: number) => Math.round(n / 50) * 50;

export function incomeLimit(band: Band, size: number): number {
  const base = FOUR_PERSON_50 * BAND_FACTOR[band];
  return round50(base * (SIZE_FACTOR[size] ?? 1));
}

export const INCOME_LIMITS: { size: number; values: Record<Band, number> }[] =
  HOUSEHOLD_SIZES.map((size) => ({
    size,
    values: {
      "30": incomeLimit("30", size),
      "50": incomeLimit("50", size),
      "60": incomeLimit("60", size),
      "80": incomeLimit("80", size),
    },
  }));

/* ------------------------------- rent limits ------------------------------ */

export type UnitSize = "eff" | "1br" | "2br" | "3br" | "4br";
export const UNIT_SIZES: UnitSize[] = ["eff", "1br", "2br", "3br", "4br"];
export const UNIT_LABEL: Record<UnitSize, string> = {
  eff: "Efficiency",
  "1br": "1 BR",
  "2br": "2 BR",
  "3br": "3 BR",
  "4br": "4 BR",
};

/** Imputed occupancy: 1.5 persons per bedroom, 1 person for an efficiency. */
const IMPUTED: Record<UnitSize, number> = { eff: 1, "1br": 1.5, "2br": 3, "3br": 4.5, "4br": 6 };

function interpolatedIncome(band: Band, persons: number): number {
  const lo = Math.floor(persons);
  const hi = Math.ceil(persons);
  const a = incomeLimit(band, lo);
  const b = incomeLimit(band, hi);
  return a + (b - a) * (persons - lo);
}

/** Gross rent = 30% of the imputed household income limit, divided by 12. */
export function grossRent(band: Band, unit: UnitSize): number {
  return Math.floor((interpolatedIncome(band, IMPUTED[unit]) * 0.3) / 12);
}

export const RENT_LIMITS: { unit: UnitSize; values: Record<Band, number> }[] = UNIT_SIZES.map(
  (unit) => ({
    unit,
    values: {
      "30": grossRent("30", unit),
      "50": grossRent("50", unit),
      "60": grossRent("60", unit),
      "80": grossRent("80", unit),
    },
  }),
);

export const RENT_NOTE =
  "These are gross rents. The figure includes a tenant-paid utility allowance — subtract the applicable allowance below to get the maximum rent you may collect. Underwriting to the gross figure is the most common rent error we see.";

/* -------------------- payment standards, FMR, utilities ------------------- */

export const FMR: Record<UnitSize, number> = {
  eff: 720,
  "1br": 800,
  "2br": 1_010,
  "3br": 1_340,
  "4br": 1_570,
};

/** Tulsa Housing Authority payment standards, set at 110% of FMR. */
export const PAYMENT_STANDARD: Record<UnitSize, number> = {
  eff: 790,
  "1br": 880,
  "2br": 1_110,
  "3br": 1_475,
  "4br": 1_725,
};

export const UTILITY_ALLOWANCE: Record<UnitSize, number> = {
  eff: 92,
  "1br": 108,
  "2br": 139,
  "3br": 171,
  "4br": 202,
};

export const UTILITY_NOTE =
  "Schedule published by the Tulsa Housing Authority for tenant-paid gas heat, electric cooking, water, and trash. LIHTC projects may use an alternative method under 26 C.F.R. § 1.42-10; OHFA must approve the method before it is used in a rent calculation.";

/* --------------------------- program limit sets --------------------------- */

export type LimitSet = {
  /** Income bands that bind under the program, most restrictive first. */
  incomeBands: Band[];
  /** Plain-language description of the income test. */
  incomeRule: string;
  /** Rent basis, or null when the program sets no rent limit. */
  rentRule: string | null;
  /** Which published table the program reads from. */
  table: string;
  sourceIds: string[];
};

export const PROGRAM_LIMITS: Record<string, LimitSet> = {
  cdbg: {
    incomeBands: ["80"],
    incomeRule:
      "Beneficiaries must be low- and moderate-income — at or below 80% AMI under the Section 8 income limits.",
    rentRule: null,
    table: "HUD Section 8 Income Limits",
    sourceIds: ["ul-section8-il", "pg-cdbg"],
  },
  home: {
    incomeBands: ["50", "60", "80"],
    incomeRule:
      "At least 90% of assisted renters at or below 60% AMI; all units at or below 80% AMI. Twenty percent of units in projects of five or more HOME units must serve households at or below 50% AMI.",
    rentRule:
      "HOME High and Low rents, published separately by HUD. Gross rent includes the utility allowance.",
    table: "HUD HOME Rent Limits",
    sourceIds: ["ul-home-rent", "ch-home"],
  },
  lihtc: {
    incomeBands: ["50", "60"],
    incomeRule:
      "Minimum set-aside elected under 26 U.S.C. § 42(g): 20-50, 40-60, or the average income test. OHFA's plan may require a deeper election to score.",
    rentRule:
      "30% of the imputed income limit for the unit's bedroom count, using the HUD Multifamily Tax Subsidy Project (MTSP) limits. Gross rent includes the utility allowance.",
    table: "HUD MTSP Income and Rent Limits",
    sourceIds: ["ul-mtsp", "pg-lihtc"],
  },
  usda515: {
    incomeBands: ["50", "80"],
    incomeRule:
      "Very low- and low-income households as defined by Rural Development, using the area limits for the county.",
    rentRule:
      "Basic and note rents approved by Rural Development in the annual budget, not a percent-of-AMI calculation.",
    table: "RD Multi-Family Housing income limits",
    sourceIds: ["ul-usda-il", "pg-usda515"],
  },
  tif: {
    incomeBands: [],
    incomeRule:
      "No federal or state income limit attaches to increment financing. The project plan may impose its own affordability condition.",
    rentRule: null,
    table: "None — set by the increment district project plan",
    sourceIds: ["pg-tif"],
  },
  htf: {
    incomeBands: ["80"],
    incomeRule:
      "City guidelines target households at or below 80% AMI, with scoring preference for deeper affordability.",
    rentRule: "Rent capped at 30% of the targeted band, consistent with the HUD schedule.",
    table: "City of Tulsa Housing Trust Fund guidelines",
    sourceIds: ["ul-htf-limits", "pg-htf"],
  },
};

export type BindingResult = {
  /** Most restrictive income band across the selected programs. */
  band: Band | null;
  /** Program ids driving that band. */
  drivenBy: string[];
  /** Programs contributing a rent rule. */
  rentRules: { id: string; rule: string }[];
  note: string;
};

/** The most restrictive limit governs when programs are stacked. */
export function bindingLimit(programIds: string[]): BindingResult {
  const sets = programIds
    .map((id) => [id, PROGRAM_LIMITS[id]] as const)
    .filter((x): x is readonly [string, LimitSet] => Boolean(x[1]));

  let band: Band | null = null;
  const drivenBy: string[] = [];
  for (const [id, set] of sets) {
    const lowest = set.incomeBands[0];
    if (!lowest) continue;
    if (band === null || Number(lowest) < Number(band)) {
      band = lowest;
      drivenBy.length = 0;
      drivenBy.push(id);
    } else if (lowest === band) {
      drivenBy.push(id);
    }
  }

  const rentRules = sets
    .filter(([, s]) => s.rentRule)
    .map(([id, s]) => ({ id, rule: s.rentRule as string }));

  const note =
    sets.length === 0
      ? "Select one or more programs to see which limits bind."
      : band === null
        ? "None of the selected programs imposes an income limit of its own. Any affordability condition would come from the project plan or local agreement."
        : `When these programs are layered, the most restrictive limit applies to the same unit: ${BAND_LABEL[band]}. A unit counted toward more than one program must satisfy every program's test at once, not the average of them.`;

  return { band, drivenBy, rentRules, note };
}

export const UNDERWRITING_CITATIONS = [
  "ul-section8-il",
  "ul-mtsp",
  "ul-home-rent",
  "ul-usda-il",
  "ul-htf-limits",
  "ul-fmr",
  "ul-tha-ps",
  "ul-tha-ua",
];
