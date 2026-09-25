/**
 * Honest, per-program assessment of what the application itself involves.
 *
 * The rating is the headline; the reason is the useful part. Where a no-cost
 * source of help already exists, it is named here so a user never assumes paid
 * help is the only route.
 */

export type ComplexityLevel =
  | "in-house"
  | "specialist-recommended"
  | "specialist-required";

export const COMPLEXITY_LABEL: Record<ComplexityLevel, string> = {
  "in-house": "Manageable in-house",
  "specialist-recommended": "Specialist recommended",
  "specialist-required": "Specialist typically required",
};

export const COMPLEXITY_BLURB: Record<ComplexityLevel, string> = {
  "in-house": "A capable staff person can complete this.",
  "specialist-recommended": "Commonly outsourced; doable in-house with effort.",
  "specialist-required": "Rarely completed without professional help.",
};

export type FreeAlternative = {
  name: string;
  what: string;
  sourceIds: string[];
};

export type ProgramComplexity = {
  level: ComplexityLevel;
  /** Why the rating is what it is — the specific work that drives it. */
  reason: string;
  /** No-cost help that already exists for this program, where it exists. */
  freeAlternatives: FreeAlternative[];
};

const PT_PERMITTING: FreeAlternative = {
  name: "PartnerTulsa permitting assistance",
  what: "Free walk-through of the local submittal, permitting, and review sequence before you pay anyone to assemble it.",
  sourceIds: ["cs-partnertulsa-permit"],
};

const HPN_ACCELERATOR: FreeAlternative = {
  name: "HPN Developer Accelerator",
  what: "No-cost cohort training for emerging developers covering underwriting, application packaging, and deal structure.",
  sourceIds: ["ta-hpn-accelerator"],
};

const TEDC_EDUCATION: FreeAlternative = {
  name: "TEDC education programs",
  what: "Free local workshops on financing and predevelopment for small and nonprofit developers.",
  sourceIds: ["ta-tedc-education"],
};

const SHPO_STAFF: FreeAlternative = {
  name: "Oklahoma SHPO staff support",
  what: "SHPO reviewers will read draft Part 1 and Part 2 material and flag problems before submission, at no charge.",
  sourceIds: ["ta-shpo-staff", "st-shpo"],
};

export const PROGRAM_COMPLEXITY: Record<string, ProgramComplexity> = {
  cdbg: {
    level: "specialist-recommended",
    reason:
      "The application itself is short, but the national objective documentation, environmental review record, and Davis-Bacon and procurement compliance behind it are where applicants lose time. Most first-time applicants get help once, then run it in-house.",
    freeAlternatives: [PT_PERMITTING, TEDC_EDUCATION],
  },
  home: {
    level: "specialist-recommended",
    reason:
      "Written agreements, subsidy layering, and the twenty-year affordability underwriting must all hold together. A staff person with underwriting experience can do it; a first-timer usually should not do it alone.",
    freeAlternatives: [HPN_ACCELERATOR, TEDC_EDUCATION],
  },
  "home-chdo": {
    level: "specialist-recommended",
    reason:
      "The funding application matches general HOME, but the certification packet — board composition evidence, low-income representation, audited capacity documentation — is a distinct body of work reviewed by the Participating Jurisdiction.",
    freeAlternatives: [HPN_ACCELERATOR, TEDC_EDUCATION],
  },
  lihtc: {
    level: "specialist-required",
    reason:
      "The state allocation application is a scored competition with market study, capital needs assessment, and syndication commitments due at submission, and points turn on details that are only obvious to people who read the plan every year. Deals are effectively never awarded without a consultant and syndicator.",
    freeAlternatives: [HPN_ACCELERATOR],
  },
  usda515: {
    level: "specialist-required",
    reason:
      "Section 515 underwriting follows USDA's own handbook forms and a rural-specific appraisal and environmental sequence, and processing runs a year or more. Applicants without prior USDA deals almost always retain someone who has closed one.",
    freeAlternatives: [],
  },
  tif: {
    level: "specialist-recommended",
    reason:
      "The technical filing is modest, but you must show eligible project costs under the approved project plan and a but-for case in a projection the authority will test. That projection is usually built by a financial advisor.",
    freeAlternatives: [PT_PERMITTING],
  },
  htf: {
    level: "in-house",
    reason:
      "A short local application, a project budget, and a sources-and-uses page. Staff who can produce a pro forma can complete this without outside help.",
    freeAlternatives: [PT_PERMITTING, TEDC_EDUCATION],
  },
  brownfields: {
    level: "specialist-required",
    reason:
      "Phase I and Phase II environmental site assessments must be performed by a qualified environmental professional meeting the All Appropriate Inquiries standard. The paperwork around them is manageable; the assessments themselves cannot be self-performed.",
    freeAlternatives: [PT_PERMITTING],
  },
  htc: {
    level: "specialist-required",
    reason:
      "Part 1, Part 2, and Part 3 applications require historic documentation — period photographs, architectural description, and a rehabilitation scope written to the Secretary of the Interior's Standards — reviewed by the State Historic Preservation Office and then the National Park Service. Denials at Part 2 are expensive and common without a preservation consultant.",
    freeAlternatives: [SHPO_STAFF],
  },
  nmtc: {
    level: "specialist-required",
    reason:
      "There is no application you file; allocation sits with Community Development Entities and the benefit reaches a project through a leveraged loan structure with a seven-year compliance period. Structuring counsel and an accountant are not optional.",
    freeAlternatives: [],
  },
  oz: {
    level: "specialist-recommended",
    reason:
      "No application exists — the work is entity structuring and testing to keep the fund compliant, which is a tax counsel exercise rather than a grant writing one.",
    freeAlternatives: [],
  },
};

export function complexityFor(programId: string): ProgramComplexity | null {
  return PROGRAM_COMPLEXITY[programId] ?? null;
}
