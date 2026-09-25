/**
 * Contact registry.
 *
 * Every administering body named anywhere in the product resolves to a contact
 * record here. A plan that says "contact the Community Development Department"
 * is not actionable; a name, an email, and a phone number are.
 *
 * Two kinds of record, and the interface must never blur them:
 *   - "named": we know the specific staff person handling the program.
 *   - "role":  we know the department and the role, but not the person. The
 *              fields carry the role, never a fabricated individual.
 *
 * Prototype note: contacts below are mock data for demonstration. Where a real
 * individual is not known, the record is deliberately role-level so the
 * difference between the two states is visible.
 */

export type ContactKind = "named" | "role";

export type ContactRecord = {
  id: string;
  kind: ContactKind;
  /** Person's name, or the role title when kind is "role". */
  name: string;
  /** Job title. For role records, the department function. */
  title: string;
  body: string;
  email?: string;
  emailIsShared?: boolean;
  phone?: string;
  phoneExt?: string;
  phoneIsMainLine?: boolean;
  /** The specific program page, not the organization homepage. */
  website?: string;
  websiteLabel?: string;
  /** Only where in-person attendance is required. */
  address?: string;
  addressWhy?: string;
  /** ISO date the information was last confirmed. */
  lastVerified: string;
  verifiedBy?: string;
};

export const CONTACT_DISCLAIMER =
  "Contact details in this prototype are mock data. Where a specific staff person is not known, the record shows the role and department instead of a name.";

const CONTACTS: ContactRecord[] = [
  {
    id: "pt-brownfields",
    kind: "named",
    name: "Karyn Ivey",
    title: "Brownfields Program Manager",
    body: "PartnerTulsa",
    email: "kivey@partnertulsa.org",
    phone: "918-585-8332",
    phoneExt: "214",
    website: "https://www.partnertulsa.org/brownfields",
    websiteLabel: "PartnerTulsa — Brownfields program page",
    address: "907 S Detroit Ave, Suite 1004, Tulsa, OK 74120",
    addressWhy: "Site scoping meetings are held in person before an assessment is authorized.",
    lastVerified: "2026-07-14",
    verifiedBy: "Confirmed by phone with the program office",
  },
  {
    id: "epa-r6-brownfields",
    kind: "role",
    name: "Regional Brownfields Coordinator",
    title: "Brownfields and Land Revitalization Branch, Region 6",
    body: "U.S. Environmental Protection Agency",
    email: "r6brownfields@epa.gov",
    emailIsShared: true,
    phone: "214-665-6444",
    phoneIsMainLine: true,
    website: "https://www.epa.gov/brownfields/brownfields-contacts-region-6",
    websiteLabel: "EPA Region 6 — Brownfields contacts",
    lastVerified: "2026-06-02",
    verifiedBy: "Checked against the published regional contact page",
  },
  {
    id: "tulsa-cd-cdbg",
    kind: "named",
    name: "Marcus Delaney",
    title: "Grants Administrator, CDBG",
    body: "City of Tulsa Community Development Department",
    email: "mdelaney@cityoftulsa.org",
    phone: "918-576-5552",
    website: "https://www.cityoftulsa.org/government/departments/community-development/cdbg/",
    websiteLabel: "City of Tulsa — CDBG program page",
    address: "175 E 2nd St, 4th Floor, Tulsa, OK 74103",
    addressWhy: "The annual application meeting is in person and attendance is a condition of applying.",
    lastVerified: "2026-08-19",
    verifiedBy: "Confirmed at the most recent application meeting",
  },
  {
    id: "tulsa-win-draws",
    kind: "role",
    name: "Draw and Compliance Staff",
    title: "Reimbursement processing after award",
    body: "City of Tulsa Working in Neighborhoods",
    email: "workinginneighborhoods@cityoftulsa.org",
    emailIsShared: true,
    phone: "918-596-2100",
    phoneIsMainLine: true,
    website: "https://www.cityoftulsa.org/government/departments/working-in-neighborhoods/",
    websiteLabel: "City of Tulsa — Working in Neighborhoods",
    lastVerified: "2026-05-28",
    verifiedBy: "Department main line confirmed; no individual assigned publicly",
  },
  {
    id: "tulsa-cd-home",
    kind: "role",
    name: "HOME Program Coordinator",
    title: "HOME allocation and CHDO reserve",
    body: "City of Tulsa Community Development Department",
    email: "communitydevelopment@cityoftulsa.org",
    emailIsShared: true,
    phone: "918-576-5552",
    phoneIsMainLine: true,
    website: "https://www.cityoftulsa.org/government/departments/community-development/",
    websiteLabel: "City of Tulsa — Community Development",
    lastVerified: "2026-08-19",
    verifiedBy: "Department confirmed the role exists; the assignment was not named",
  },
  {
    id: "tulsa-cd-chdo",
    kind: "role",
    name: "CHDO Certification Reviewer",
    title: "Receives and reviews CHDO certification applications",
    body: "City of Tulsa Community Development Department",
    email: "communitydevelopment@cityoftulsa.org",
    emailIsShared: true,
    phone: "918-576-5552",
    phoneIsMainLine: true,
    website: "https://www.cityoftulsa.org/government/departments/community-development/",
    websiteLabel: "City of Tulsa — Community Development",
    address: "175 E 2nd St, 4th Floor, Tulsa, OK 74103",
    addressWhy: "Certification files are reviewed in a scheduled in-person intake session.",
    lastVerified: "2026-04-30",
    verifiedBy: "Role confirmed by the department; reviewer rotates by round",
  },
  {
    id: "incog-planning",
    kind: "role",
    name: "Current Planning Staff",
    title: "Zoning verification, platting, board of adjustment",
    body: "City of Tulsa Planning Office (INCOG)",
    email: "planning@incog.org",
    emailIsShared: true,
    phone: "918-584-7526",
    phoneIsMainLine: true,
    website: "https://www.incog.org/planning/",
    websiteLabel: "INCOG — Planning services",
    lastVerified: "2026-06-11",
  },
  {
    id: "ohfa-lihtc",
    kind: "role",
    name: "Affordable Housing Program Staff",
    title: "LIHTC allocation and state HOME funds",
    body: "Oklahoma Housing Finance Agency",
    email: "housingdevelopment@ohfa.org",
    emailIsShared: true,
    phone: "405-419-8261",
    phoneIsMainLine: true,
    website: "https://www.ohfa.org/developers/",
    websiteLabel: "OHFA — Developer programs and QAP",
    lastVerified: "2026-07-01",
  },
  {
    id: "tahtf",
    kind: "role",
    name: "Housing Trust Fund Staff",
    title: "Local gap financing intake",
    body: "Tulsa Affordable Housing Trust Fund",
    email: "info@partnertulsa.org",
    emailIsShared: true,
    phone: "918-585-8332",
    phoneIsMainLine: true,
    website: "https://www.partnertulsa.org/housing",
    websiteLabel: "PartnerTulsa — Housing programs",
    lastVerified: "2026-07-14",
  },
  {
    id: "tda",
    kind: "role",
    name: "Redevelopment Staff",
    title: "Tax increment districts and land disposition",
    body: "Tulsa Development Authority",
    email: "info@partnertulsa.org",
    emailIsShared: true,
    phone: "918-585-8332",
    phoneIsMainLine: true,
    website: "https://www.partnertulsa.org/tda",
    websiteLabel: "Tulsa Development Authority",
    lastVerified: "2026-06-24",
  },
  {
    id: "tha",
    kind: "role",
    name: "Housing Choice Voucher Program Staff",
    title: "Payment standards and project-based vouchers",
    body: "Tulsa Housing Authority",
    email: "info@tulsahousing.org",
    emailIsShared: true,
    phone: "918-581-5700",
    phoneIsMainLine: true,
    website: "https://www.tulsahousing.org/landlords/",
    websiteLabel: "THA — Landlord and developer programs",
    lastVerified: "2026-05-12",
  },
  {
    id: "usda-rd-ok",
    kind: "role",
    name: "Multi-Family Housing Program Director",
    title: "Section 515 and rural housing programs",
    body: "USDA Rural Development, Oklahoma State Office",
    email: "ok.rd@usda.gov",
    emailIsShared: true,
    phone: "405-742-1000",
    phoneIsMainLine: true,
    website: "https://www.rd.usda.gov/ok",
    websiteLabel: "USDA Rural Development — Oklahoma",
    lastVerified: "2026-03-18",
  },
];

export const CONTACT_BY_ID: Record<string, ContactRecord> = Object.fromEntries(
  CONTACTS.map((c) => [c.id, c]),
);

export function contactById(id: string): ContactRecord | null {
  return CONTACT_BY_ID[id] ?? null;
}

/** Administering body (as displayed on a program row) → contact record. */
export const PROGRAM_CONTACT_ID: Record<string, string> = {
  cdbg: "tulsa-cd-cdbg",
  home: "tulsa-cd-home",
  "home-chdo": "tulsa-cd-chdo",
  lihtc: "ohfa-lihtc",
  usda515: "usda-rd-ok",
  tif: "tda",
  htf: "tahtf",
  htc: "ohfa-lihtc",
  brownfields: "pt-brownfields",
  vouchers: "tha",
  zoning: "incog-planning",
};

export function contactForProgram(programId: string): ContactRecord | null {
  const id = PROGRAM_CONTACT_ID[programId];
  return id ? contactById(id) : null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatVerified(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Months since last verification — used to warn on stale named contacts. */
export function monthsSince(iso: string, now: Date = new Date()): number {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return 0;
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
}

export function isStale(c: ContactRecord, now: Date = new Date()): boolean {
  // A named contact decays fastest: staff turnover makes it wrong, not just old.
  return monthsSince(c.lastVerified, now) >= (c.kind === "named" ? 6 : 12);
}
