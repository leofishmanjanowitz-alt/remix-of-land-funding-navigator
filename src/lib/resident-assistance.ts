/**
 * Assistance available to the people who will live in the building —
 * renters and homebuyers. This is deliberately kept separate from the
 * development capital stack; the two must never be presented as one list.
 *
 * Figures that have not been verified against a current published schedule
 * are written as explicit placeholders. Do not replace them with invented
 * numbers.
 */

import type { Level } from "./jurisdictions";

export const UNVERIFIED = "[amount not verified — confirm with the administering body]";

/* ------------------------------ renter side ------------------------------ */

export type RenterAssistanceType =
  | "rental-subsidy"
  | "deposit"
  | "utility"
  | "supportive-services";

export const RENTER_TYPE_META: Record<
  RenterAssistanceType,
  { label: string; badgeClass: string; glyph: string }
> = {
  "rental-subsidy": {
    label: "Rental subsidy",
    badgeClass: "border-primary bg-primary text-primary-foreground",
    glyph: "●",
  },
  deposit: {
    label: "Security deposit assistance",
    badgeClass: "border-accent bg-accent text-accent-foreground",
    glyph: "◆",
  },
  utility: {
    label: "Utility assistance",
    badgeClass: "border-primary bg-secondary text-primary",
    glyph: "◈",
  },
  "supportive-services": {
    label: "Supportive services",
    badgeClass: "border-border bg-paper-deep text-muted-foreground",
    glyph: "◇",
  },
};

export type RenterProgram = {
  id: string;
  name: string;
  authority: string;
  level: Level;
  type: RenterAssistanceType;
  /** What the household receives. Placeholder text where unverified. */
  amount: string;
  url: string;
  sourceId: string;
  /** One or two plain sentences on what it means for the project. */
  meaning: string;
};

export const RENTER_PROGRAMS: RenterProgram[] = [
  {
    id: "hcv",
    name: "Housing Choice Vouchers (tenant-based)",
    authority: "Tulsa Housing Authority",
    level: "quasi",
    type: "rental-subsidy",
    amount:
      "Household pays roughly 30% of adjusted income; the authority pays the balance up to its payment standard.",
    url: "https://www.tulsahousing.org/",
    sourceId: "ra-hcv",
    meaning:
      "Voucher holders can reach the authority's payment standard rather than the tax credit rent, so units priced at or just below that standard lease deeper without cutting your achievable rent. Confirm the current payment standard by bedroom size before underwriting to it.",
  },
  {
    id: "pbv",
    name: "Project-Based Vouchers",
    authority: "Tulsa Housing Authority",
    level: "quasi",
    type: "rental-subsidy",
    amount:
      "Subsidy attached to specific units under a Housing Assistance Payments contract; share of units per project is capped by rule.",
    url: "https://www.tulsahousing.org/",
    sourceId: "ra-pbv",
    meaning:
      "A PBV contract converts deeply targeted units into contract-rent units, which is usually the difference between a 30% AMI unit that underwrites and one that does not. Contract rent, not the tenant payment, is what your lender will size debt against.",
  },
  {
    id: "esg-rrh",
    name: "Emergency Solutions Grants — rapid re-housing",
    authority: "City of Tulsa / A Way Home for Tulsa Continuum of Care",
    level: "local",
    type: "rental-subsidy",
    amount:
      "Short- and medium-term rental assistance, generally time-limited; local per-household cap is a placeholder until the subrecipient contract is loaded.",
    url: "https://www.hudexchange.info/programs/esg/",
    sourceId: "ra-esg",
    meaning:
      "Rapid re-housing fills rent for a bounded period, so it helps lease-up and reduces early vacancy but should not be capitalized into permanent rents. Treat it as absorption support, not as ongoing income.",
  },
  {
    id: "liheap",
    name: "Low Income Home Energy Assistance Program (LIHEAP)",
    authority: "Oklahoma Department of Human Services",
    level: "state",
    type: "utility",
    amount: `Seasonal heating and cooling benefit paid to the utility. ${UNVERIFIED}`,
    url: "https://oklahoma.gov/okdhs/services/liheap.html",
    sourceId: "ra-liheap",
    meaning:
      "Where residents pay their own utilities, LIHEAP softens the gross-rent squeeze created by the utility allowance. It does not change the allowance itself, so it will not raise the rent you may collect.",
  },
  {
    id: "deposit-local",
    name: "Local security deposit and move-in assistance",
    authority: "Restore Hope Ministries / Tulsa Housing Solutions partners",
    level: "local",
    type: "deposit",
    amount: `One-time deposit and first-month assistance. ${UNVERIFIED}`,
    url: "https://www.restorehope.org/",
    sourceId: "ra-deposit",
    meaning:
      "Deposit assistance removes the single most common lease-up barrier for income-qualified applicants, which shortens absorption. It has no effect on the rent level you can set.",
  },
  {
    id: "supportive",
    name: "Permanent supportive housing services funding",
    authority: "Oklahoma Department of Mental Health and Substance Abuse Services",
    level: "state",
    type: "supportive-services",
    amount: `Service dollars only — no rent subsidy. ${UNVERIFIED}`,
    url: "https://oklahoma.gov/odmhsas.html",
    sourceId: "ra-supportive",
    meaning:
      "Service funding covers case management, not rent, so it makes a supportive housing unit operable but does not add revenue. Pair it with a rental subsidy source or the unit will not carry its operating cost.",
  },
];

export const RENTER_SUMMARY =
  "Resident subsidy sets the gap between what a household can pay and what the unit must earn. Where tenant- or project-based subsidy is available, deeply targeted units can still underwrite at contract rent; where it is not, your achievable rent is capped by the program limit and the utility allowance.";

/* ---------------------------- homebuyer side ----------------------------- */

export type AssistanceForm = "grant" | "forgivable-second" | "repayable-loan";

export const FORM_META: Record<AssistanceForm, { label: string; badgeClass: string }> = {
  grant: { label: "Grant", badgeClass: "border-primary bg-primary text-primary-foreground" },
  "forgivable-second": {
    label: "Forgivable second mortgage",
    badgeClass: "border-accent bg-accent text-accent-foreground",
  },
  "repayable-loan": {
    label: "Repayable loan",
    badgeClass: "border-primary bg-secondary text-primary",
  },
};

export type BuyerProgram = {
  id: string;
  name: string;
  /** Assistance amount or percentage. Placeholder where unverified. */
  amount: string;
  form: AssistanceForm;
  recapture: string;
  sourceId: string;
  meaning: string;
};

export type BuyerProvider = {
  id: string;
  provider: string;
  kind: string;
  level: Level;
  url: string;
  /** "gap" where we have not loaded this provider's schedule yet. */
  coverage: "loaded" | "gap";
  programs: BuyerProgram[];
};

export const BUYER_PROVIDERS: BuyerProvider[] = [
  {
    id: "ohfa",
    provider: "Oklahoma Housing Finance Agency",
    kind: "State housing finance agency",
    level: "quasi",
    url: "https://www.ohfa.org/homebuyers/",
    coverage: "loaded",
    programs: [
      {
        id: "ohfa-advantage",
        name: "OHFA Homebuyer Downpayment Assistance",
        amount: `Percentage of the first mortgage amount. ${UNVERIFIED}`,
        form: "grant",
        recapture: "None on the assistance itself; federal recapture tax may apply to bond-financed first mortgages if the home is sold within nine years.",
        sourceId: "hb-ohfa",
        meaning:
          "Agency assistance is the widest-reaching source in this market, so a for-sale product priced within the agency's purchase price limit reaches the largest buyer pool. Price above that limit and most of these buyers disappear.",
      },
      {
        id: "ohfa-4teachers",
        name: "OHFA targeted-occupation assistance",
        amount: UNVERIFIED,
        form: "grant",
        recapture: "Not verified — confirm the current program term sheet.",
        sourceId: "hb-ohfa",
        meaning:
          "Occupation-targeted tiers matter only if your buyer pipeline includes those workers; they do not change the price point on their own.",
      },
    ],
  },
  {
    id: "county",
    provider: "Tulsa County / City of Tulsa",
    kind: "County and municipal",
    level: "local",
    url: "https://www.cityoftulsa.org/",
    coverage: "loaded",
    programs: [
      {
        id: "tulsa-dpa",
        name: "City of Tulsa HOME homebuyer assistance",
        amount: `Downpayment and closing cost assistance per household. ${UNVERIFIED}`,
        form: "forgivable-second",
        recapture:
          "HOME resale or recapture provisions apply for the full affordability period; the period length scales with the assistance amount.",
        sourceId: "hb-tulsa-home",
        meaning:
          "A forgivable second lets you sell at appraised value while the buyer's effective cost drops, so it raises the price point your product can clear without needing a subsidized sale. Recapture runs with the home, so market the affordability period to buyers early.",
      },
    ],
  },
  {
    id: "banks",
    provider: "Individual banks",
    kind: "Private lenders (FHLB member institutions)",
    level: "quasi",
    url: "https://www.fhlbtopeka.com/products-services/homeownership-set-aside-programs",
    coverage: "loaded",
    programs: [
      {
        id: "fhlb-hsp",
        name: "FHLBank Topeka Homeownership Set-aside Program (member banks)",
        amount: `Per-household set-aside grant through a participating member bank. ${UNVERIFIED}`,
        form: "forgivable-second",
        recapture:
          "Pro-rated repayment if the home is sold or refinanced during the retention period set by the bank's agreement.",
        sourceId: "hb-fhlb",
        meaning:
          "Bank set-aside funds are first-come and exhaust early in the year, so they help a specific sales cohort rather than a whole phase. Line up two or three member banks before you rely on this in a pro forma.",
      },
      {
        id: "bank-cra",
        name: "Individual bank CRA closing-cost programs",
        amount: UNVERIFIED,
        form: "grant",
        recapture: "Varies by institution — not loaded.",
        sourceId: "hb-fhlb",
        meaning:
          "These stack on top of agency assistance and mostly cover closing costs, which shortens the buyer's savings timeline rather than raising the price you can achieve.",
      },
    ],
  },
  {
    id: "cdc",
    provider: "Community development corporations",
    kind: "CDCs and CDFIs",
    level: "local",
    url: "https://www.cityoftulsa.org/",
    coverage: "gap",
    programs: [],
  },
  {
    id: "nonprofit",
    provider: "Nonprofits",
    kind: "Nonprofit homeownership providers",
    level: "local",
    url: "https://www.habitat.org/",
    coverage: "loaded",
    programs: [
      {
        id: "habitat",
        name: "Habitat for Humanity affordable first mortgage",
        amount: `Sweat-equity model with a below-market first mortgage. ${UNVERIFIED}`,
        form: "repayable-loan",
        recapture:
          "Right of first refusal and a shared-appreciation or resale restriction, depending on the affiliate's covenant.",
        sourceId: "hb-nonprofit",
        meaning:
          "Nonprofit buyers purchase at a restricted price, so this only works where your cost basis is already written down by land donation or subsidy. It is not a way to reach market price.",
      },
    ],
  },
];

export const BUYER_SUMMARY =
  "Buyer-side assistance sets the sale price your product can actually clear. Assistance that is forgivable or granted raises the price point a given household can reach; repayable assistance does not, because it counts against the buyer's debt ratio.";

export const RESIDENT_COVERAGE_NOTE =
  "Providers shown without loaded programs are not marked unavailable — their schedules are simply not in the library yet.";
