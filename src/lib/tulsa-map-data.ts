/**
 * Mock parcel + overlay data for the Tulsa, Oklahoma map surface.
 * Coordinate space matches the map SVG viewBox: 0 0 1200 800.
 * Everything here is fabricated sample data for the prototype.
 */

import type { DisbursementId } from "./disbursement";

export type LayerId =
  | "tif"
  | "tif-36th"
  | "qct"
  | "dda"
  | "usda"
  | "fema"
  | "oz"
  | "nmtc"
  | "district1"
  | "htf"
  | "nio"
  | "nco"
  | "hp"
  | "zoning";

/** A = funding eligibility geographies, D = City of Tulsa zoning overlays. */
export type BoundaryCategory = "A" | "D";

export interface MapLayer {
  id: LayerId;
  name: string;
  short: string;
  category: BoundaryCategory;
  /** Overlay that eases housing development; flagged in the parcel panel. */
  favorable?: boolean;
  /** CSS color token reference used for fill and stroke. */
  color: string;
  /** True when the boundary is drawn from published city/county GIS data. */
  real?: boolean;
  rect: { x: number; y: number; w: number; h: number };
  description: string;
}

export const LAYERS: MapLayer[] = [
  {
    id: "tif",
    category: "A",
    real: true,
    name: "TIF districts",
    short: "TIF",
    color: "var(--layer-tif)",
    rect: { x: 380, y: 180, w: 340, h: 260 },
    description: "Published tax increment district boundaries across the city",
  },
  {
    id: "dda",
    category: "A",
    name: "Difficult Development Area",
    short: "DDA",
    color: "var(--layer-dda)",
    rect: { x: 130, y: 110, w: 330, h: 250 },
    description: "HUD Small-Area DDA — high construction cost relative to AMI",
  },
  {
    id: "nmtc",
    category: "A",
    name: "NMTC eligible tract",
    short: "NMTC",
    color: "var(--layer-nmtc)",
    rect: { x: 120, y: 250, w: 540, h: 390 },
    description: "Low-income community under the New Markets Tax Credit tests",
  },
  {
    id: "district1",
    category: "A",
    name: "City of Tulsa District 1",
    short: "D1",
    color: "var(--layer-district1)",
    rect: { x: 70, y: 70, w: 430, h: 310 },
    description: "Council District 1 — local homebuyer assistance eligibility",
  },
  {
    id: "qct",
    category: "A",
    name: "Qualified Census Tract",
    short: "QCT",
    color: "var(--layer-qct)",
    rect: { x: 150, y: 300, w: 420, h: 320 },
    description: "HUD QCT 48.02 — north and west of the river",
  },
  {
    id: "usda",
    category: "A",
    name: "USDA rural eligible area",
    short: "USDA",
    color: "var(--layer-usda)",
    rect: { x: 820, y: 420, w: 340, h: 330 },
    description: "USDA Rural Development eligible area — outer county",
  },
  {
    id: "fema",
    category: "A",
    real: true,
    name: "Floodplains",
    short: "FEMA",
    color: "var(--layer-fema)",
    rect: { x: 60, y: 560, w: 700, h: 190 },
    description: "City of Tulsa regulatory floodplains, plus FEMA's flood hazard tiles",
  },
  {
    id: "oz",
    category: "A",
    name: "Opportunity Zone",
    short: "OZ",
    color: "var(--layer-oz)",
    rect: { x: 300, y: 100, w: 480, h: 240 },
    description: "Qualified Opportunity Zone 40143000200",
  },
  {
    id: "htf",
    category: "A",
    name: "Local housing trust fund area",
    short: "HTF",
    color: "var(--layer-htf)",
    rect: { x: 620, y: 250, w: 320, h: 300 },
    description: "Tulsa Affordable Housing Trust Fund priority area",
  },
  {
    id: "nio",
    category: "D",
    favorable: true,
    name: "Neighborhood Infill Overlay (NIO)",
    short: "NIO",
    color: "var(--layer-nio)",
    rect: { x: 240, y: 370, w: 350, h: 230 },
    description: "Eases lot size, setback, and building type rules to allow more housing",
  },
  {
    id: "nco",
    category: "D",
    name: "Neighborhood Character Overlay (NCO)",
    short: "NCO",
    color: "var(--layer-nco)",
    rect: { x: 640, y: 510, w: 310, h: 210 },
    description: "Protects an established neighborhood pattern and scale",
  },
  {
    id: "zoning",
    category: "D",
    real: true,
    name: "Zoning districts",
    short: "ZONE",
    color: "var(--layer-nco)",
    rect: { x: 0, y: 0, w: 0, h: 0 },
    description: "Published base zoning for every parcel in the city",
  },
  {
    id: "hp",
    category: "D",
    name: "Historic Preservation (HP) Overlay",
    short: "HP",
    color: "var(--layer-hp)",
    rect: { x: 460, y: 110, w: 230, h: 190 },
    description: "Exterior changes reviewed by the Tulsa Preservation Commission",
  },
];

export type ZoningCode = "RS-3" | "RS-5" | "RM-1" | "RM-2" | "MX1-P" | "MX2-U" | "CH" | "AG";

interface ZoningProfile {
  label: string;
  permitted: string[];
  conditional: string[];
  maxHeight: string;
  minLot: string;
}

export const ZONING: Record<ZoningCode, ZoningProfile> = {
  "RS-3": {
    label: "RS-3 — Residential Single-Family",
    permitted: ["Single family detached", "Accessory dwelling unit"],
    conditional: ["Duplex (special exception)"],
    maxHeight: "35 ft",
    minLot: "6,900 sq ft",
  },
  "RS-5": {
    label: "RS-5 — Residential Single-Family Compact",
    permitted: ["Single family detached", "Accessory dwelling unit", "Cottage court"],
    conditional: ["Duplex (special exception)"],
    maxHeight: "35 ft",
    minLot: "4,000 sq ft",
  },
  "RM-1": {
    label: "RM-1 — Residential Multifamily Low",
    permitted: ["Single family detached", "Duplex", "Townhouse", "Cottage court"],
    conditional: ["Multifamily up to 12 units (site plan review)"],
    maxHeight: "35 ft",
    minLot: "3,000 sq ft per unit",
  },
  "RM-2": {
    label: "RM-2 — Residential Multifamily Medium",
    permitted: ["Duplex", "Townhouse", "Cottage court", "Multifamily"],
    conditional: ["Mixed-use residential over ground-floor retail"],
    maxHeight: "45 ft",
    minLot: "1,500 sq ft per unit",
  },
  "MX1-P": {
    label: "MX1-P — Mixed-Use Neighborhood, Pedestrian",
    permitted: ["Townhouse", "Multifamily", "Live-work unit"],
    conditional: ["Single room occupancy"],
    maxHeight: "45 ft",
    minLot: "No minimum",
  },
  "MX2-U": {
    label: "MX2-U — Mixed-Use Urban",
    permitted: ["Multifamily", "Mixed-use residential", "Live-work unit"],
    conditional: ["Supportive housing with services"],
    maxHeight: "75 ft",
    minLot: "No minimum",
  },
  CH: {
    label: "CH — Commercial Highway",
    permitted: ["Mixed-use residential above commercial"],
    conditional: ["Multifamily (planned unit development)"],
    maxHeight: "60 ft",
    minLot: "No minimum",
  },
  AG: {
    label: "AG — Agriculture",
    permitted: ["Single family detached", "Farmstead dwelling"],
    conditional: ["Cottage court (rural cluster plan)"],
    maxHeight: "35 ft",
    minLot: "2 acres",
  },
};

export type ProgramStatus = "Likely eligible" | "May be eligible" | "Not eligible";

export interface Program {
  id: string;
  name: string;
  agency: string;
  status: ProgramStatus;
  reason: string;
  /** Id into the citation registry (src/lib/citations.ts). */
  sourceId: string;
  /** How the money reaches the developer. */
  disbursement: DisbursementId;
  /** Plain-language timing detail shown beneath the badge. */
  timing: string;
}

export interface Parcel {
  id: string;
  parcelId: string;
  address: string;
  acreage: number;
  zoning: ZoningCode;
  assessedValue: number;
  /** Polygon points in map coordinate space. */
  points: [number, number][];
  centroid: [number, number];
  layers: LayerId[];
}

const STREETS = [
  "N Peoria Ave",
  "E Archer St",
  "S Denver Ave",
  "E Pine St",
  "N Greenwood Ave",
  "E 11th St",
  "S Elgin Ave",
  "W 23rd St",
  "N Utica Ave",
  "E Admiral Blvd",
  "S Lewis Ave",
  "E Latimer St",
  "N Cincinnati Ave",
  "E 36th St N",
  "S Trenton Ave",
  "W Easton St",
  "N Madison Ave",
  "E Apache St",
  "S Xanthus Ave",
  "E Independence St",
];

const ZONES: ZoningCode[] = [
  "MX2-U",
  "RM-2",
  "RS-5",
  "RM-1",
  "MX1-P",
  "RS-3",
  "RM-2",
  "CH",
  "RS-5",
  "RM-1",
  "MX1-P",
  "RS-3",
  "RM-2",
  "AG",
  "RS-5",
  "MX2-U",
  "RM-1",
  "RS-3",
  "AG",
  "RM-2",
];

// Deterministic pseudo-random generator so the map is stable across renders.
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inRect(x: number, y: number, r: { x: number; y: number; w: number; h: number }) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function buildParcels(): Parcel[] {
  const rand = mulberry(20260831);
  const parcels: Parcel[] = [];
  const cols = 5;
  const rows = 4;
  const cellW = 1000 / cols;
  const cellH = 620 / rows;

  for (let i = 0; i < 20; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = 100 + col * cellW + 18 + rand() * 22;
    const baseY = 90 + row * cellH + 16 + rand() * 22;
    const w = cellW - 60 - rand() * 24;
    const h = cellH - 55 - rand() * 22;
    const j = () => (rand() - 0.5) * 12;

    const points: [number, number][] = [
      [baseX + j(), baseY + j()],
      [baseX + w + j(), baseY + j()],
      [baseX + w + j(), baseY + h + j()],
      [baseX + j(), baseY + h + j()],
    ];
    const cx = points.reduce((s, p) => s + p[0], 0) / 4;
    const cy = points.reduce((s, p) => s + p[1], 0) / 4;

    const layers = LAYERS.filter((l) => inRect(cx, cy, l.rect)).map((l) => l.id);
    const acreage = Math.round(((w * h) / 6400) * 100) / 100;

    parcels.push({
      id: `parcel-${i + 1}`,
      parcelId: `${63000 + i * 137}-${14 + (i % 9)}-${String(i * 7 + 3).padStart(2, "0")}-${
        1000 + i * 41
      }`,
      address: `${1100 + i * 137} ${STREETS[i]}`,
      acreage,
      zoning: ZONES[i]!,
      assessedValue: 38000 + Math.round(rand() * 420) * 1000,
      points,
      centroid: [cx, cy],
      layers,
    });
  }
  return parcels;
}

export const PARCELS: Parcel[] = buildParcels();

export function programsFor(parcel: Parcel): Program[] {
  const has = (id: LayerId) => parcel.layers.includes(id);
  const inTif = has("tif") || has("tif-36th");
  const flood = has("fema");
  const zone = parcel.zoning;
  const multifamilyOk = ["RM-1", "RM-2", "MX1-P", "MX2-U"].includes(zone);

  return [
    {
      id: "cdbg",
      name: "Community Development Block Grant (CDBG)",
      agency: "City of Tulsa Working in Neighborhoods / HUD",
      status: has("qct") ? "Likely eligible" : "May be eligible",
      reason: has("qct")
        ? "The parcel sits inside a Qualified Census Tract, so the low- and moderate-income area benefit test is met on tract data alone. No household-level income survey is required."
        : "The parcel is outside a Qualified Census Tract. CDBG can still be used, but the city must document area benefit through an income survey or limited-clientele test.",
      sourceId: "pg-cdbg",
      disbursement: "reimbursement",
      timing:
        "Reimbursement — you fund construction costs first and submit draw requests to the City's Working in Neighborhoods office. Expect 30 to 60 days between submission and payment.",
    },
    {
      id: "home",
      name: "HOME Investment Partnerships Program",
      agency: "City of Tulsa Community Development Dept.",
      status: flood
        ? "May be eligible"
        : multifamilyOk
          ? "Likely eligible"
          : "May be eligible",
      reason: flood
        ? "HOME funds may be used here, but the parcel lies in a FEMA Special Flood Hazard Area, which triggers floodplain management review and flood insurance requirements before commitment."
        : multifamilyOk
          ? "Zoning permits the unit counts HOME rental projects typically need, and the site is within the participating jurisdiction. Affordability period of 20 years would apply."
          : "The site is within the participating jurisdiction, but current single-family zoning limits the project size that HOME rental funds typically underwrite.",
      sourceId: "pg-home",
      disbursement: "forgivable-loan",
      timing:
        "Forgivable loan — committed at closing and drawn against invoices during construction. The balance is forgiven at the end of the 20-year affordability period if the units stay compliant.",
    },
    {
      id: "home-chdo",
      name: "HOME — CHDO Set-Aside",
      agency: "City of Tulsa Community Development Dept. (Participating Jurisdiction) / HUD",
      status: flood ? "May be eligible" : "Likely eligible",
      reason:
        "A reserved portion of the same HOME allocation, restricted to housing owned, developed, or sponsored by a nonprofit the City of Tulsa has certified as a Community Housing Development Organization. The parcel test is identical to general HOME; what changes is who may apply. Because the pool is reserved, it is less competitive than open HOME — that is the practical argument for pursuing or partnering into designation.",
      sourceId: "pg-home",
      disbursement: "forgivable-loan",
      timing:
        "Forgivable loan — same terms as general HOME: committed at closing, drawn against invoices, forgiven after the affordability period. The set-aside changes the applicant, not the money's shape.",
    },
    {
      id: "lihtc",
      name: "Low-Income Housing Tax Credit (9% and 4%)",
      agency: "Oklahoma Housing Finance Agency",
      status: has("qct") && multifamilyOk ? "Likely eligible" : multifamilyOk ? "May be eligible" : "Not eligible",
      reason:
        has("qct") && multifamilyOk
          ? "Qualified Census Tract location grants a 30% eligible basis boost, and zoning supports the density needed to compete in the state allocation round."
          : multifamilyOk
            ? "Zoning supports a multifamily development, but without a QCT or DDA designation the project receives no basis boost and scores lower in the competitive round."
            : "Current zoning does not permit multifamily by right or by special exception at the scale a credit deal requires. A rezoning would be needed first.",
      sourceId: "pg-lihtc",
      disbursement: "tax-credit-equity",
      timing:
        "Tax credit equity — the credit is syndicated to an investor and paid in installments: roughly 15% at closing, 60% across construction milestones, and the balance at 8609 issuance and stabilization.",
    },
    {
      id: "usda515",
      name: "USDA Section 515 Rural Rental Housing",
      agency: "USDA Rural Development, Oklahoma State Office",
      status: has("usda") ? "Likely eligible" : "Not eligible",
      reason: has("usda")
        ? "The parcel falls inside the USDA rural eligible area boundary, meeting the place-based test for Section 515 direct loans."
        : "The parcel is inside the urbanized area boundary and therefore fails the rural area definition used for Section 515.",
      sourceId: "pg-usda515",
      disbursement: "loan",
      timing:
        "Loan — a 50-year direct mortgage closed before construction and advanced through monthly inspection-based draws. Underwriting to loan closing typically runs 9 to 14 months.",
    },
    {
      id: "tif",
      name: "Tax Increment Financing — Increment District No. 6",
      agency: "Tulsa Development Authority",
      status: inTif ? "Likely eligible" : "Not eligible",
      reason: inTif
        ? "The parcel is inside the active increment district. Project costs eligible under the approved project plan may be reimbursed from captured increment."
        : "The parcel lies outside every active increment district boundary. A new district or a boundary amendment would be required.",
      sourceId: "pg-tif",
      disbursement: "tax-increment",
      timing:
        "Tax increment — nothing arrives during construction. Eligible costs are repaid from captured increment after the project is on the tax roll, typically over 10 to 20 years.",
    },
    {
      id: "htf",
      name: "Tulsa Affordable Housing Trust Fund",
      agency: "City of Tulsa / Tulsa Housing Authority",
      status: has("htf") ? "Likely eligible" : has("qct") ? "May be eligible" : "Not eligible",
      reason: has("htf")
        ? "The parcel is inside the trust fund priority area, which receives first-tier scoring for gap financing awards in the annual funding cycle."
        : has("qct")
          ? "Outside the priority area, but Qualified Census Tract location still qualifies the project for second-tier scoring if units serve households at or below 60% AMI."
          : "The parcel is outside both the trust fund priority area and any qualifying income geography used for scoring.",
      sourceId: "pg-htf",
      disbursement: "cash-up-front",
      timing:
        "Cash up front — trust fund gap awards are wired at or before closing once the award agreement is signed, usually 45 to 60 days after the funding cycle closes.",
    },
    {
      id: "brownfields",
      name: "EPA Brownfields Assessment and Cleanup",
      agency: "PartnerTulsa (locally administered) / U.S. EPA",
      status: "May be eligible",
      reason:
        "Brownfields assessment and cleanup dollars for this parcel are administered locally through PartnerTulsa rather than applied for directly from EPA. Eligibility turns on suspected contamination and on the applicant being \u2014 or partnering with \u2014 a nonprofit.",
      sourceId: "pg-brownfields",
      disbursement: "reimbursement",
      timing:
        "Reimbursement \u2014 you pay the environmental consultant and the hauler first, then submit documentation and are repaid. Budget for carrying those costs for weeks, not days.",
    },
    ...(has("hp")
      ? [
          {
            id: "htc",
            name: "Federal Historic Rehabilitation Tax Credit (20%)",
            agency: "National Park Service / Oklahoma SHPO / IRS",
            status: "May be eligible" as ProgramStatus,
            reason:
              "The parcel sits inside a local Historic Preservation overlay. That is a city design-review district, not a federal listing: the credit requires the building to be a certified historic structure and the rehabilitation to be certified through the State Historic Preservation Office and the National Park Service. Overlay status alone confers no credit eligibility.",
            sourceId: "pg-htc",
            disbursement: "tax-credit-equity" as DisbursementId,
            timing:
              "Tax credit equity — syndicated like LIHTC and paid in on a schedule, with the final installment held until the Part 3 certification is issued after completion.",
          },
        ]
      : []),
  ];
}

export function findParcelByQuery(query: string): Parcel | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const digits = q.replace(/\D/g, "");
  return (
    PARCELS.find((p) => p.address.toLowerCase() === q) ??
    PARCELS.find((p) => p.parcelId.replace(/\D/g, "") === digits && digits.length > 4) ??
    PARCELS.find((p) => p.address.toLowerCase().includes(q)) ??
    PARCELS.find((p) => {
      const num = q.match(/^\d+/)?.[0];
      return num ? p.address.startsWith(num) : false;
    }) ??
    null
  );
}

/** Very small keyword responder for the "ask a question" half of the combined input. */
export function answerQuestion(query: string, parcel: Parcel | null): string | null {
  const q = query.toLowerCase();
  if (!/[?]|^(what|which|can|is|does|how|why|are|do)\b/.test(q)) return null;
  const name = parcel ? parcel.address : "the selected parcel";
  if (q.includes("lihtc") || q.includes("tax credit"))
    return `LIHTC eligibility at ${name} turns on two things: whether the tract carries a basis boost, and whether zoning allows the density a credit deal needs. See the Eligible funding list for the current read.`;
  if (q.includes("flood") || q.includes("fema"))
    return `Floodplain status is drawn from the FEMA layer. Turn on "FEMA floodplain" in the layer control to see whether ${name} intersects the Special Flood Hazard Area.`;
  if (q.includes("usda") || q.includes("rural"))
    return `USDA Section 515 is place-based. ${name} qualifies only if it falls inside the USDA rural eligible boundary shown in the layer control.`;
  if (q.includes("zoning") || q.includes("build") || q.includes("units"))
    return `The "What you can build here" section lists the housing types permitted under the parcel's current zoning code. It is a preliminary read and should be confirmed with the jurisdiction.`;
  if (q.includes("tif") || q.includes("increment"))
    return `TIF reimbursement requires the parcel to sit inside an active increment district. Increment District No. 6 covers the downtown and Pearl area on this map.`;
  return `Select a parcel and review the Eligible funding list — each program row expands to show the rule behind its status, with a citation.`;
}
