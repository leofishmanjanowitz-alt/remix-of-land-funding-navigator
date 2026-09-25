/**
 * Jurisdiction levels. Every source in the citation registry carries one, and
 * every funding program carries a coverage row saying which levels we have
 * loaded, which have no requirement, and which are simply not loaded yet.
 */

export type Level = "federal" | "state" | "local" | "quasi";

export const LEVELS: Level[] = ["federal", "state", "local", "quasi"];

export const LEVEL_META: Record<Level, { label: string; short: string; blurb: string }> = {
  federal: {
    label: "Federal",
    short: "F",
    blurb: "Statute, Code of Federal Regulations, agency notices and guidance",
  },
  state: {
    label: "State",
    short: "S",
    blurb: "State statute, administrative code, state agency program rules",
  },
  local: {
    label: "Local",
    short: "L",
    blurb: "Municipal code, city and county ordinances, adopted plans",
  },
  quasi: {
    label: "Quasi-governmental",
    short: "Q",
    blurb: "Housing finance agencies, public trusts, authorities, land banks, COGs",
  },
};

/**
 * "loaded"  — we hold a source for this level.
 * "none"    — this level imposes no requirement on the program (verified).
 * "gap"     — a requirement likely exists but is not in the library yet.
 */
export type Coverage = "loaded" | "none" | "gap";

export const COVERAGE_META: Record<Coverage, { label: string; detail: string }> = {
  loaded: { label: "Source loaded", detail: "A citation at this level is in the library." },
  none: {
    label: "No requirement",
    detail: "Reviewed: this level does not govern the program for this parcel.",
  },
  gap: {
    label: "Not loaded yet",
    detail: "A requirement at this level likely exists. It is not in the library yet.",
  },
};

export const PROGRAM_COVERAGE: Record<string, Record<Level, Coverage>> = {
  // Tulsa is a CDBG Entitlement Community, so the state pass-through does not apply.
  brownfields: { federal: "loaded", state: "none", local: "gap", quasi: "loaded" },
  cdbg: { federal: "loaded", state: "none", local: "loaded", quasi: "loaded" },
  home: { federal: "loaded", state: "gap", local: "loaded", quasi: "gap" },
  "home-chdo": { federal: "loaded", state: "none", local: "loaded", quasi: "gap" },
  lihtc: { federal: "loaded", state: "loaded", local: "none", quasi: "loaded" },
  usda515: { federal: "loaded", state: "none", local: "none", quasi: "gap" },
  tif: { federal: "none", state: "loaded", local: "gap", quasi: "loaded" },
  htf: { federal: "none", state: "gap", local: "loaded", quasi: "loaded" },
  htc: { federal: "loaded", state: "loaded", local: "loaded", quasi: "none" },
  nmtc: { federal: "loaded", state: "none", local: "gap", quasi: "gap" },
};

/** Multi-level requirement rows shown inside an expanded program. */
export type StackedRequirement = {
  claim: string;
  sourceIds: string[];
};

export const PROGRAM_REQUIREMENTS: Record<string, StackedRequirement[]> = {
  "home-chdo": [
    {
      claim:
        "The set-aside is created by federal rule, the certification that opens it is conferred by the City of Tulsa as Participating Jurisdiction, and the owner, developer, or sponsor role the CHDO takes in the deal is defined federally and read locally.",
      sourceIds: ["og-chdo-setaside", "og-chdo-pj", "og-chdo-roles", "og-chdo"],
    },
  ],
  cdbg: [
    {
      claim:
        "Before this project can draw CDBG funds, it must meet the low- and moderate-income national objective, be carried through the City of Tulsa's adopted Consolidated Plan and citizen participation process, and — if credits are layered on top — satisfy the state allocating agency's own threshold review.",
      sourceIds: ["pg-cdbg", "cdbg-hud-guidance", "cdbg-tulsa-conplan", "cdbg-ohfa-layering"],
    },
  ],
  lihtc: [
    {
      claim:
        "Credit eligibility is set by federal statute, scored through the state allocating agency's plan, and — for the Oklahoma state credit layered beneath it — conditioned by state statute.",
      sourceIds: ["pg-lihtc", "ch-lihtc", "st-lihtc"],
    },
  ],
  tif: [
    {
      claim:
        "Increment financing is authorized by state statute and administered locally through the increment district's approved project plan.",
      sourceIds: ["pg-tif", "ov-tif"],
    },
  ],
  htc: [
    {
      claim:
        "The rehabilitation credit is established by federal statute and rule, certified through the state preservation office, and — separately — the local overlay governs what the exterior work may look like.",
      sourceIds: ["pg-htc", "st-shpo", "ov-hp"],
    },
  ],
  htf: [
    {
      claim:
        "Trust fund awards are governed by the city's adopted program guidelines and, where housing authority units are involved, by the authority's own occupancy rules.",
      sourceIds: ["pg-htf", "qg-tha"],
    },
  ],
};
