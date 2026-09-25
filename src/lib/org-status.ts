/**
 * Organizational status gates.
 *
 * Some funding is unlocked by what an organization *is*, not by where the
 * parcel is. None of this is visible on a map, and it is a common reason a
 * developer never sees money they could have reached through a designation or
 * a partnership.
 *
 * Rule for the whole module: never hide a program because the organization
 * does not currently qualify. Show it with the path to qualifying.
 *
 * Figures marked PLACEHOLDER have not been verified against the current
 * regulation. Do not replace them with invented numbers.
 */

/** Percentage of a Participating Jurisdiction's HOME allocation reserved for
 *  CHDO-owned, -developed, or -sponsored housing. Not yet verified. */
export const CHDO_SET_ASIDE_PLACEHOLDER = "[SET-ASIDE % — PLACEHOLDER, VERIFY AT 24 CFR 92.300]";

export type OrgType =
  | "nonprofit"
  | "forprofit"
  | "cdc"
  | "housing-authority"
  | "tribal"
  | "government";

export const ORG_TYPES: { id: OrgType; label: string; blurb: string }[] = [
  {
    id: "nonprofit",
    label: "Nonprofit",
    blurb: "A 501(c)(3) or other tax-exempt organization developing housing.",
  },
  {
    id: "forprofit",
    label: "For-profit developer",
    blurb: "A taxable entity — LLC, LP, or corporation — developing housing.",
  },
  {
    id: "cdc",
    label: "Community development corporation",
    blurb: "A neighborhood-based nonprofit with a defined service area.",
  },
  {
    id: "housing-authority",
    label: "Public housing authority",
    blurb: "A PHA or its affiliated development instrumentality.",
  },
  {
    id: "tribal",
    label: "Tribal entity",
    blurb: "A tribe, or a tribally designated housing entity acting for one.",
  },
  {
    id: "government",
    label: "Local government",
    blurb: "A city, county, or authority housing department.",
  },
];

export const ORG_TYPE_LABEL: Record<OrgType, string> = Object.fromEntries(
  ORG_TYPES.map((o) => [o.id, o.label]),
) as Record<OrgType, string>;

/* ------------------------------ status gates ----------------------------- */

export type StatusGate = {
  id: string;
  name: string;
  /** What the designation is, in plain language. */
  what: string;
  /** The body that certifies or confers it. */
  certifier: string;
  /** What holding it opens that is otherwise closed. */
  unlocks: string;
  /** What getting certified actually involves. */
  process: string;
  /** Org types that can realistically hold it. */
  openTo: OrgType[];
  sourceIds: string[];
  unverified?: boolean;
};

export const STATUS_GATES: StatusGate[] = [
  {
    id: "chdo",
    name: "CHDO — Community Housing Development Organization",
    what: "A HUD-defined nonprofit designation under the HOME program. It is not a grant and not a program of its own: it is a status that a Participating Jurisdiction confers on a qualifying nonprofit.",
    certifier:
      "The local HOME Participating Jurisdiction — for this parcel, the City of Tulsa. HUD defines the standard; the PJ certifies the organization against it.",
    unlocks: `A reserved pool of HOME dollars. A Participating Jurisdiction must set aside a minimum ${CHDO_SET_ASIDE_PLACEHOLDER} of its HOME allocation for housing owned, developed, or sponsored by certified CHDOs. Only designated organizations may compete for that reserve. This set-aside is a feature of HOME. It does not exist in CDBG, and CDBG dollars are not part of it.`,
    process:
      "Application to the PJ evidencing tax-exempt status, a defined service area, at least one third of the governing board drawn from the low-income community served, demonstrated capacity in housing development (often through paid staff or a qualified consultant with a capacity-building plan), and a year or more of serving the community. The PJ re-certifies periodically, usually per funding round.",
    openTo: ["nonprofit", "cdc"],
    sourceIds: ["og-chdo", "og-chdo-setaside", "og-chdo-pj"],
    unverified: true,
  },
  {
    id: "c3",
    name: "501(c)(3) nonprofit status",
    what: "Federal recognition of tax exemption as a charitable organization.",
    certifier: "Internal Revenue Service, on application, after state incorporation.",
    unlocks:
      "The nonprofit eligibility lane in several programs — including the EPA Brownfields path — plus the nonprofit set-aside in the housing credit and standing as the sponsor of record on many local awards.",
    process:
      "Incorporate under state law, adopt conforming bylaws and a purpose clause, then file IRS Form 1023 or 1023-EZ. Determination commonly takes several months; the effective date can relate back to incorporation.",
    openTo: ["nonprofit", "cdc"],
    sourceIds: ["og-501c3"],
  },
  {
    id: "cdfi",
    name: "CDFI certification",
    what: "Certification that an organization is a Community Development Financial Institution: a lender or investor whose primary mission is community development in defined target markets.",
    certifier: "CDFI Fund, U.S. Department of the Treasury.",
    unlocks:
      "Treasury award programs open only to certified institutions, and access to bank capital that counts for the lender's own community reinvestment obligations. Relevant to a developer mainly as a capital partner rather than a status to hold.",
    process:
      "Application demonstrating a primary community-development mission, a predominant financing activity, a defined target market, development services, accountability to that market, and non-government control. Recertification is periodic.",
    openTo: ["nonprofit", "cdc", "tribal"],
    sourceIds: ["og-cdfi"],
  },
  {
    id: "cde",
    name: "CDE — Community Development Entity",
    what: "The entity status required to receive a New Markets Tax Credit allocation and to place that allocation into projects.",
    certifier: "CDFI Fund, U.S. Department of the Treasury.",
    unlocks:
      "New Markets credit allocation. A project sponsor almost never becomes a CDE; the practical path is to bring an allocatee CDE into the deal as the investment conduit.",
    process:
      "Certification requires a primary mission of serving low-income communities and accountability to residents of those communities. Certification alone confers no dollars — allocation is awarded competitively in a separate annual round.",
    openTo: ["nonprofit", "forprofit", "cdc", "government", "tribal"],
    sourceIds: ["og-cde"],
  },
  {
    id: "pha",
    name: "Public Housing Authority status",
    what: "A state-chartered public body that administers federal housing assistance locally.",
    certifier:
      "Created under state law and placed under an Annual Contributions Contract with HUD; here, the Tulsa Housing Authority.",
    unlocks:
      "Voucher administration, project-based voucher awards, Faircloth-authorized replacement units, and RAD conversions. A private developer reaches these through a partnership or a ground lease with the authority, not by becoming one.",
    process:
      "Not obtainable by an applicant. The practical route is a development agreement, joint venture, or project-based voucher award from the existing authority.",
    openTo: ["housing-authority", "government"],
    sourceIds: ["og-pha"],
  },
  {
    id: "tribal",
    name: "Tribal entity status",
    what: "A federally recognized tribe, or a tribally designated housing entity acting on its behalf.",
    certifier:
      "Federal recognition of the tribe; the tribe itself designates the housing entity.",
    unlocks:
      "The Indian Housing Block Grant and related NAHASDA funding, plus tribal set-asides in several state and federal competitions. This funding runs on its own track and is not reachable by a non-tribal developer except as a contractor or joint-venture partner to the tribal entity.",
    process:
      "Not obtainable by an applicant. Non-tribal organizations participate by agreement with the tribe or its housing entity.",
    openTo: ["tribal"],
    sourceIds: ["og-tribal"],
  },
  {
    id: "clg",
    name: "Certified Local Government status",
    what: "A local government certified to participate formally in the federal historic preservation program.",
    certifier:
      "The State Historic Preservation Office, with National Park Service concurrence.",
    unlocks:
      "A share of pass-through preservation grant funds and a formal role in review of historic properties. Held by the jurisdiction, not the developer, but it shapes how a rehabilitation project is reviewed locally.",
    process:
      "The jurisdiction adopts a qualifying preservation ordinance, seats a qualified commission, maintains a survey, and applies to the SHPO.",
    openTo: ["government"],
    sourceIds: ["og-clg"],
  },
  {
    id: "experience",
    name: "Developer qualification and prior-experience thresholds",
    what: "Funder-set minimums on how much comparable housing the development team has already completed and what its balance sheet looks like — commonly a stated number of prior units, years in operation, and net-worth or liquidity floors.",
    certifier:
      "Each funder sets its own, in the qualified allocation plan or the notice of funding availability. There is no single certifying body.",
    unlocks:
      "Standing to apply at all. This is the most common silent disqualifier for a first-time developer, and the most commonly cured one.",
    process:
      "Where the threshold is not met, funders generally accept a co-developer or joint-venture partner who does meet it, with the experienced partner carrying guarantees. Thresholds and the exact figures vary by round.",
    openTo: ["nonprofit", "forprofit", "cdc", "housing-authority", "tribal", "government"],
    sourceIds: ["og-experience"],
    unverified: true,
  },
];

export const ORG_CITATION_IDS = [
  ...STATUS_GATES.flatMap((g) => g.sourceIds),
  "og-chdo-roles",
  "og-chdo-directory",
  "og-chdo-capacity",
];

/* --------------------------- CHDO set-aside route ------------------------- */

/**
 * Three eligibility states for the reserved HOME CHDO pool. Every state has a
 * path: designation held, designation obtainable, or partnership.
 */
export type ChdoRoute = "designated" | "certify" | "partner";

export function chdoRouteFor(org: OrgType | null, designated: boolean): ChdoRoute | null {
  if (!org) return null;
  if (designated) return "designated";
  return org === "nonprofit" || org === "cdc" ? "certify" : "partner";
}

export const CHDO_ROUTE_COPY: Record<
  ChdoRoute,
  { badge: string; headline: string; detail: string }
> = {
  designated: {
    badge: "Designated",
    headline: "The reserved pool is directly available to you",
    detail: `Your organization holds CHDO certification from the City of Tulsa, so you may compete for the reserved HOME set-aside \u2014 a minimum ${CHDO_SET_ASIDE_PLACEHOLDER} of the jurisdiction's HOME allocation that no uncertified applicant may reach. Keep the certification current: the PJ re-certifies, usually each funding round, and a lapse takes you out of the reserve.`,
  },
  certify: {
    badge: "Eligible to become designated",
    headline: "A growth path \u2014 certification opens the reserve",
    detail: `As a nonprofit you can apply for HOME on the open side today, and you can pursue CHDO certification with the City of Tulsa to additionally reach the reserved ${CHDO_SET_ASIDE_PLACEHOLDER} set-aside. Certification is a multi-month process and is not a route to funding on a deal closing this cycle.`,
  },
  partner: {
    badge: "Partnership route",
    headline: "Not designable \u2014 reachable through a certified CHDO",
    detail:
      "A for-profit entity or a government body cannot itself be certified as a CHDO. That does not close the reserved pool to your project: the route is a deal in which a certified CHDO is the owner, the developer, or the sponsor of the housing, with your role set out in writing before application.",
  },
};

/** The three distinct CHDO roles. They are not interchangeable. */
export const CHDO_ROLES: { role: string; what: string; implication: string }[] = [
  {
    role: "Owner",
    what: "The CHDO holds title to the property, alone or as managing member or general partner of the ownership entity.",
    implication:
      "Strongest claim on the reserve and the most control given up by a co-developer. Long-term asset control and residual value sit with the CHDO.",
  },
  {
    role: "Developer",
    what: "The CHDO carries the development responsibility \u2014 it arranges financing, oversees construction, and is accountable for delivery.",
    implication:
      "Control over the process rather than the asset. A for-profit partner can hold an ownership interest, but the CHDO must genuinely run the development, not appear on paper.",
  },
  {
    role: "Sponsor",
    what: "The CHDO develops the housing and transfers it to a defined entity, or supports a subsidiary that owns it, under the program's sponsorship terms.",
    implication:
      "The narrowest and most technical of the three. Sponsorship is defined by regulation and by the PJ's reading of it \u2014 structure it with the PJ before you rely on it, because a structure that fails the sponsorship test loses the reserve.",
  },
];

/** Mock directory of CHDOs certified by the local Participating Jurisdiction. */
export const CHDO_DIRECTORY: {
  name: string;
  focus: string;
  serviceArea: string;
  note: string;
}[] = [
  {
    name: "North Tulsa Housing Collaborative",
    focus: "Single-family infill and homebuyer development",
    serviceArea: "North Tulsa, Council Districts 1 and 3",
    note: "Has taken co-developer roles with for-profit partners on scattered-site infill.",
  },
  {
    name: "Kendall-Whittier Community Housing, Inc.",
    focus: "Small-scale rental rehabilitation, 4 to 24 units",
    serviceArea: "East-central Tulsa neighborhoods",
    note: "Board is neighborhood-seated; prefers projects inside its stated service area.",
  },
  {
    name: "Green Country Homes Development Corp.",
    focus: "New construction rental, sponsor and owner roles",
    serviceArea: "City of Tulsa and adjacent Tulsa County",
    note: "Has previously carried the owner role in tax-credit deals with a for-profit co-developer.",
  },
  {
    name: "Eastside Neighborhood Development Association",
    focus: "Homebuyer units and owner-occupied rehabilitation",
    serviceArea: "Southeast Tulsa",
    note: "Smaller staff; capacity is the constraint, so approach early in the cycle.",
  },
];

export const CHDO_DIRECTORY_CAVEAT =
  "Unverified: this roster is illustrative. The Participating Jurisdiction maintains the authoritative list of currently certified CHDOs \u2014 request it from the City of Tulsa Community Development Department before you rely on any name here.";


export function statusGate(id: string): StatusGate | null {
  return STATUS_GATES.find((g) => g.id === id) ?? null;
}

/* ---------------------------- program org fit ---------------------------- */

export type OrgFitLevel =
  /** The organization type qualifies as it stands. */
  | "qualifies"
  /** Qualifies, but a designation opens materially more. */
  | "designation"
  /** Does not qualify directly; a partnership is the route in. */
  | "partner";

export type OrgFit = {
  level: OrgFitLevel;
  /** Short line shown on the program row. */
  label: string;
  /** The path to qualifying, or the note on what the status adds. */
  detail: string;
  /** Related status gate, when there is one. */
  gateId?: string;
};

type Rule = Partial<Record<OrgType, OrgFit>> & { default: OrgFit };

const q = (detail: string): OrgFit => ({ level: "qualifies", label: "Your org type qualifies", detail });

const PROGRAM_RULES: Record<string, Rule> = {
  home: {
    default: q(
      "HOME funds flow through the City of Tulsa as Participating Jurisdiction and are open to for-profit and nonprofit developers alike. The CHDO reserve, however, is not.",
    ),
    nonprofit: {
      level: "designation",
      label: "CHDO designation unlocks a reserved pool",
      gateId: "chdo",
      detail: `Your organization can apply for HOME on the open side today. Certification as a CHDO by the City of Tulsa additionally opens the reserved HOME set-aside — a minimum ${CHDO_SET_ASIDE_PLACEHOLDER} of the jurisdiction's allocation that only designated organizations may compete for. This reserve is HOME only; it has no CDBG counterpart.`,
    },
    cdc: {
      level: "designation",
      label: "CHDO designation unlocks a reserved pool",
      gateId: "chdo",
      detail: `A neighborhood-based CDC is the profile the CHDO standard was written around — service area, board composition drawn from the community served, and housing capacity. Certification by the City of Tulsa opens the reserved HOME set-aside of at least ${CHDO_SET_ASIDE_PLACEHOLDER}, which is closed to uncertified applicants.`,
    },
    forprofit: {
      level: "partner",
      label: "Reserved CHDO pool needs a nonprofit partner",
      gateId: "chdo",
      detail:
        "You can apply for HOME directly. The CHDO reserve cannot be reached by a for-profit entity in its own name — the route is to be engaged by a certified CHDO that owns, develops, or sponsors the housing, with your role set out in the development agreement. Sponsorship has specific meaning here; structure it with the PJ before you rely on it.",
    },
    tribal: {
      level: "partner",
      label: "Reachable, but tribal funding may fit better",
      detail:
        "A tribal entity can partner into a city HOME award, but NAHASDA funding usually reaches the same units with fewer conditions. Compare the two before committing to the city cycle.",
    },
  },
  "home-chdo": {
    default: {
      level: "partner",
      label: "Reachable only through a certified CHDO",
      gateId: "chdo",
      detail:
        "This reserve is restricted to nonprofits the City of Tulsa has certified. A for-profit or public entity cannot be certified, so the route is a deal in which a certified CHDO is the owner, developer, or sponsor of the housing.",
    },
    nonprofit: {
      level: "designation",
      label: "Certification opens this reserve",
      gateId: "chdo",
      detail:
        "You are in the class of organizations that can be certified. Certification with the PJ is a multi-month process and is not a near-term unlock, so pursue it for the pipeline while partnering for a deal that must close this cycle.",
    },
    cdc: {
      level: "designation",
      label: "Certification opens this reserve",
      gateId: "chdo",
      detail:
        "A neighborhood-based CDC is the profile the standard was written around. Certification by the City of Tulsa opens the reserved pool; expect board composition and capacity documentation to set the timeline.",
    },
    forprofit: {
      level: "partner",
      label: "Partnership route with a certified CHDO",
      gateId: "chdo",
      detail:
        "A for-profit developer cannot hold the designation. Bring in a certified CHDO as owner, developer, or sponsor \u2014 three distinct roles with different control and ownership consequences \u2014 and clear the structure with the PJ before you paper it.",
    },
    government: {
      level: "partner",
      label: "Partnership route with a certified CHDO",
      gateId: "chdo",
      detail:
        "A public body is not certifiable as a CHDO; the PJ is on the other side of this table. Support a certified organization into the reserve rather than seeking the designation.",
    },
    "housing-authority": {
      level: "partner",
      label: "Partnership route with a certified CHDO",
      gateId: "chdo",
      detail:
        "An authority cannot be certified as a CHDO. A nonprofit affiliate or an outside certified CHDO takes the owner, developer, or sponsor role, with the authority contributing site, vouchers, or capital.",
    },
    tribal: {
      level: "partner",
      label: "Partnership route, or compare tribal funding",
      gateId: "chdo",
      detail:
        "A tribal entity generally reaches these units through NAHASDA with fewer conditions. If the city reserve is still the target, a certified CHDO must hold the owner, developer, or sponsor role.",
    },
  },
  cdbg: {
    default: q(
      "The City of Tulsa may subrecipient CDBG to for-profit and nonprofit entities alike; the binding test is the national objective and the eligible activity, not your tax status. Note that CDBG has no CHDO set-aside — that reserve belongs to HOME.",
    ),
    forprofit: {
      level: "qualifies",
      label: "Your org type qualifies",
      detail:
        "For-profit entities can receive CDBG as a subrecipient or through an eligible economic development activity. Expect closer scrutiny of the public benefit and of underwriting than a nonprofit applicant receives.",
    },
  },
  brownfields: {
    default: {
      level: "partner",
      label: "Nonprofit or public applicant required",
      gateId: "c3",
      detail:
        "EPA assessment and cleanup grants are awarded to governmental and nonprofit applicants, not to private site owners. Locally the applicant is generally PartnerTulsa or a qualifying nonprofit, with the site owner participating through an access agreement.",
    },
    nonprofit: q(
      "501(c)(3) status places you inside the eligible applicant class. Site access, liability protections, and the all-appropriate-inquiries record still have to be in order.",
    ),
    cdc: q("A 501(c)(3) CDC is within the eligible applicant class for assessment and cleanup grants."),
    government: q("Local government is a directly eligible applicant."),
    tribal: q("Tribes and tribal entities are directly eligible applicants."),
    forprofit: {
      level: "partner",
      label: "A nonprofit or public partner unlocks this",
      gateId: "c3",
      detail:
        "A for-profit developer cannot hold this grant. This is the clearest case where a partnership converts an ineligible project into a funded one: bring in PartnerTulsa or a qualifying nonprofit as the applicant, and keep site control and an access agreement in place so the assessment work can proceed on your parcel.",
    },
  },
  lihtc: {
    default: q(
      "Housing credits are allocated to the ownership entity regardless of whether its sponsor is nonprofit or for-profit. Developer experience thresholds in the allocation plan bind harder than tax status.",
    ),
    nonprofit: {
      level: "designation",
      label: "Nonprofit set-aside available",
      gateId: "experience",
      detail:
        "Federal law requires a portion of each state's credit ceiling to be reserved for projects with material nonprofit participation, so your status is a scoring and set-aside advantage. Confirm you also clear the allocating agency's experience threshold, or bring a co-developer who does.",
    },
    forprofit: {
      level: "designation",
      label: "Check experience thresholds",
      gateId: "experience",
      detail:
        "No tax-status barrier. The gate that actually stops first-time applicants is the allocation plan's prior-experience and net-worth minimum — cure it with a co-developer carrying the guarantees.",
    },
  },
  nmtc: {
    default: {
      level: "partner",
      label: "Requires an allocatee CDE",
      gateId: "cde",
      detail:
        "New Markets credits cannot be claimed by a project sponsor directly. The credit runs through a Community Development Entity holding an allocation, which invests into your qualified active low-income business. Identify an allocatee CDE early — allocation is scarce and committed well ahead of closing.",
    },
  },
  usda515: {
    default: q(
      "Section 515 borrowers may be nonprofit, for-profit, or public bodies. Rural location and the agency's own underwriting are the binding constraints.",
    ),
  },
  tif: {
    default: q(
      "Increment financing follows the project and the district's approved plan, not the developer's tax status. The city will still test capacity and the financing gap.",
    ),
  },
  htf: {
    default: q(
      "The local trust fund is open to nonprofit and for-profit applicants under the city's adopted guidelines.",
    ),
  },
  htc: {
    default: q(
      "The rehabilitation credit attaches to the taxpayer that owns the building. A nonprofit owner with no tax liability cannot use it directly and typically syndicates through a partnership.",
    ),
    nonprofit: {
      level: "partner",
      label: "Needs a taxable partner to use the credit",
      detail:
        "As a tax-exempt owner you generate the credit but cannot use it. The standard structure places the building in a partnership with a taxable investor, subject to the tax-exempt use property rules — bring tax counsel in before the ownership entity is formed.",
    },
    cdc: {
      level: "partner",
      label: "Needs a taxable partner to use the credit",
      detail:
        "Same structure as any tax-exempt owner: the credit has to be monetized through a partnership with a taxable investor.",
    },
  },
};

const FALLBACK: OrgFit = {
  level: "qualifies",
  label: "No organizational gate loaded",
  detail:
    "No organization-type restriction is loaded for this program. That is not a finding that none exists — verify with the administering body.",
};

export function orgFitFor(programId: string, org: OrgType | null): OrgFit | null {
  if (!org) return null;
  const rule = PROGRAM_RULES[programId];
  if (!rule) return FALLBACK;
  return rule[org] ?? rule.default;
}

/** Gates worth surfacing for a given organization type, most useful first. */
export function gatesFor(org: OrgType | null): StatusGate[] {
  if (!org) return STATUS_GATES;
  return [...STATUS_GATES].sort((a, b) => {
    const aOpen = a.openTo.includes(org) ? 0 : 1;
    const bOpen = b.openTo.includes(org) ? 0 : 1;
    return aOpen - bOpen;
  });
}
