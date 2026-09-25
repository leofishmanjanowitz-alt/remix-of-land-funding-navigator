export type ProgramLevel = "Federal" | "State" | "Local";
export type EligibilityStatus = "Eligible" | "Likely eligible" | "Conditional" | "Not eligible";

export interface FundingProgram {
  id: string;
  name: string;
  agency: string;
  level: ProgramLevel;
  status: EligibilityStatus;
  amount: string;
  note: string;
  nextStep: string;
}

export interface Parcel {
  id: string;
  address: string;
  city: string;
  apn: string;
  lotSize: string;
  zoning: string;
  zoningNote: string;
  overlays: string[];
  maxUnits: number;
  designations: string[];
  programs: FundingProgram[];
}

export const PARCELS: Parcel[] = [
  {
    id: "p-1",
    address: "1420 Cherokee Avenue SE",
    city: "Atlanta, GA 30315",
    apn: "14-0044-0009-041-7",
    lotSize: "0.86 acres (37,462 sq ft)",
    zoning: "MR-3 — Multifamily Residential",
    zoningNote: "By-right multifamily up to 3 stories; 40 ft height limit; 1:1 parking.",
    overlays: ["Beltline Overlay District", "Qualified Census Tract"],
    maxUnits: 34,
    designations: ["QCT", "Opportunity Zone", "HUD Difficult Development Area"],
    programs: [
      {
        id: "lihtc-9",
        name: "9% Low-Income Housing Tax Credit",
        agency: "Georgia Dept. of Community Affairs",
        level: "State",
        status: "Eligible",
        amount: "Up to $1.3M annual credit",
        note: "Parcel sits in a Qualified Census Tract, adding a 30% basis boost.",
        nextStep: "Confirm site control before the spring competitive round.",
      },
      {
        id: "home",
        name: "HOME Investment Partnerships",
        agency: "City of Atlanta Dept. of Grants & Community Development",
        level: "Local",
        status: "Eligible",
        amount: "$800K – $1.6M gap financing",
        note: "Requires 20-year affordability at or below 60% AMI.",
        nextStep: "Request a pre-application meeting with the city HOME administrator.",
      },
      {
        id: "cdbg",
        name: "Community Development Block Grant",
        agency: "HUD via City of Atlanta",
        level: "Federal",
        status: "Likely eligible",
        amount: "$250K – $600K",
        note: "Low/moderate income area benefit test met by tract income data.",
        nextStep: "Verify environmental review (24 CFR Part 58) has not been triggered.",
      },
      {
        id: "oz",
        name: "Opportunity Zone Equity",
        agency: "U.S. Treasury designation",
        level: "Federal",
        status: "Eligible",
        amount: "Investor-dependent",
        note: "Designated tract; capital gains deferral available to fund investors.",
        nextStep: "Model an OZ equity tranche against the LIHTC capital stack.",
      },
      {
        id: "htf",
        name: "National Housing Trust Fund",
        agency: "Georgia DCA",
        level: "Federal",
        status: "Conditional",
        amount: "$400K",
        note: "Requires at least 25% of units at or below 30% AMI.",
        nextStep: "Test deep-affordability unit mix against operating pro forma.",
      },
      {
        id: "hometax",
        name: "Historic Rehabilitation Tax Credit",
        agency: "National Park Service",
        level: "Federal",
        status: "Not eligible",
        amount: "—",
        note: "No contributing historic structure on the parcel.",
        nextStep: "No action.",
      },
    ],
  },
  {
    id: "p-2",
    address: "88 Winnebago Street",
    city: "Madison, WI 53704",
    apn: "0710-134-2208-3",
    lotSize: "1.42 acres (61,855 sq ft)",
    zoning: "TSS — Traditional Shopping Street",
    zoningNote: "Mixed use permitted; residential above ground floor commercial.",
    overlays: ["Transit Oriented Development Overlay"],
    maxUnits: 62,
    designations: ["TOD Corridor", "Difficult Development Area"],
    programs: [
      {
        id: "lihtc-4",
        name: "4% LIHTC with Tax-Exempt Bonds",
        agency: "Wisconsin Housing & Economic Development Authority",
        level: "State",
        status: "Eligible",
        amount: "Up to $9.4M bond volume",
        note: "Non-competitive; requires 50% bond financing test.",
        nextStep: "Request volume cap allocation reservation.",
      },
      {
        id: "tif",
        name: "Tax Increment Financing District 44",
        agency: "City of Madison",
        level: "Local",
        status: "Likely eligible",
        amount: "$1.1M projected increment",
        note: "Affordable housing set-aside available within active district.",
        nextStep: "Submit TIF application with 20-year increment projection.",
      },
      {
        id: "ahf",
        name: "Affordable Housing Fund",
        agency: "City of Madison CDBG Office",
        level: "Local",
        status: "Eligible",
        amount: "$500K",
        note: "Priority scoring for transit-served sites.",
        nextStep: "Document bus rapid transit stop within 1/4 mile.",
      },
      {
        id: "fhlb",
        name: "FHLB Affordable Housing Program",
        agency: "Federal Home Loan Bank of Chicago",
        level: "Federal",
        status: "Conditional",
        amount: "$750K subsidy",
        note: "Requires a member financial institution to sponsor the application.",
        nextStep: "Identify a member bank partner before the October round.",
      },
    ],
  },
  {
    id: "p-3",
    address: "2201 Chestnut Street",
    city: "Camden, NJ 08105",
    apn: "0804-01212-0016",
    lotSize: "0.51 acres (22,215 sq ft)",
    zoning: "R-2 — Two Family Residential",
    zoningNote: "Multifamily requires a use variance or redevelopment plan amendment.",
    overlays: ["Municipal Redevelopment Area", "Brownfield Inventory Site"],
    maxUnits: 12,
    designations: ["QCT", "Redevelopment Area", "Brownfield"],
    programs: [
      {
        id: "njhmfa",
        name: "NJHMFA Multifamily Preservation Loan",
        agency: "New Jersey Housing & Mortgage Finance Agency",
        level: "State",
        status: "Eligible",
        amount: "Up to $2.0M",
        note: "Redevelopment area designation satisfies the local support test.",
        nextStep: "Obtain a municipal resolution of support.",
      },
      {
        id: "brownfield",
        name: "Hazardous Discharge Site Remediation Fund",
        agency: "NJ Dept. of Environmental Protection",
        level: "State",
        status: "Eligible",
        amount: "$300K remediation grant",
        note: "Site is on the state brownfield inventory.",
        nextStep: "Commission a Phase II environmental site assessment.",
      },
      {
        id: "cdbg-nj",
        name: "Community Development Block Grant",
        agency: "HUD via Camden County",
        level: "Federal",
        status: "Likely eligible",
        amount: "$220K",
        note: "Area benefit test met; county allocation is oversubscribed.",
        nextStep: "File a county intent-to-apply notice.",
      },
      {
        id: "lihtc-9-nj",
        name: "9% Low-Income Housing Tax Credit",
        agency: "NJHMFA",
        level: "State",
        status: "Conditional",
        amount: "Up to $900K annual credit",
        note: "Current R-2 zoning caps unit count below competitive scoring threshold.",
        nextStep: "Pursue a redevelopment plan amendment to raise density.",
      },
    ],
  },
];

export function findParcel(query: string): Parcel {
  const q = query.trim().toLowerCase();
  const match = PARCELS.find(
    (p) => p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q),
  );
  if (match) return match;
  // Deterministic fallback so any typed address returns a plausible record.
  const index = q.length % PARCELS.length;
  return PARCELS[index]!;
}

export const STATUS_ORDER: EligibilityStatus[] = [
  "Eligible",
  "Likely eligible",
  "Conditional",
  "Not eligible",
];
