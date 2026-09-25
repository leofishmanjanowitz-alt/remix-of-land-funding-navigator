/**
 * Free-tier action plans. One program, end to end, at no cost.
 *
 * These are operational sequences, not program summaries: who runs the program
 * locally, who to call, what you must be, what to do in order, what is fixed on
 * the calendar, how the money arrives, what it pays for, and why applications
 * usually fail.
 *
 * The Brownfields and CDBG plans reflect operator knowledge of how these
 * programs actually run in Tulsa. Staff and schedules change: every element is
 * cited, and unverified elements say so.
 */

import type { DisbursementId } from "./disbursement";
import { CHDO_DIRECTORY, CHDO_DIRECTORY_CAVEAT, CHDO_ROLES, type ChdoRoute } from "./org-status";

export type PlanStep = {
  order: number;
  title: string;
  detail: string;
  duration: string;
  contact?: string;
  sourceIds: string[];
};

export type PlanDate = {
  date: string;
  label: string;
  detail: string;
  ifMissed: string;
  sourceIds: string[];
};

export type PlanContact = {
  /** Resolves to a full contact record (name, email, phone, page, address). */
  contactId?: string;
  body: string;
  person: string;
  role: string;
  method: string;
  note?: string;
  sourceIds: string[];
};

export type ActionPlan = {
  programId: string;
  programName: string;
  /** One line on what this program is best suited for, shown in the selector. */
  bestFor: string;
  /** The specific local body that runs it, not the federal agency. */
  administeredLocallyBy: string;
  administeredNote: string;
  administeredSourceIds: string[];
  contacts: PlanContact[];
  /** Organizational eligibility — what the applicant must be. */
  mustBe: { requirement: string; detail: string; sourceIds: string[] }[];
  steps: PlanStep[];
  dates: PlanDate[];
  disbursement: DisbursementId;
  disbursementPlain: string;
  covers: string[];
  doesNotCover: string[];
  coverageSourceIds: string[];
  failureModes: { reason: string; detail: string }[];
  /** Optional directory of organizations relevant to the plan (e.g. CHDO partners). */
  directory?: {
    title: string;
    intro: string;
    caveat: string;
    sourceIds: string[];
    entries: { name: string; focus: string; serviceArea: string; note: string }[];
  };
  /** Optional roles explainer, for plans where the partner's role is the decision. */
  roles?: {
    title: string;
    intro: string;
    sourceIds: string[];
    items: { role: string; what: string; implication: string }[];
  };
  unverified?: string;
};

export const BEST_FOR: Record<string, string> = {
  brownfields:
    "Best when the site has a former industrial, fuel, or dry-cleaning use and you need testing or soil removal before you can underwrite anything else.",
  cdbg: "Best for infrastructure, acquisition, and rehabilitation in a low- and moderate-income area, on a local annual cycle.",
  home: "Best as gap financing for rental or homebuyer units you can hold affordable for twenty years.",
  lihtc: "Best for rental projects large enough to carry syndication costs — generally 30 units and up.",
  usda515: "Best only if the parcel is inside the USDA rural eligible boundary; nothing else substitutes for that test.",
  tif: "Best for horizontal costs — streets, utilities, grading — on a site inside an active increment district.",
  htf: "Best as fast, flexible local gap money late in the stack when a small shortfall is blocking closing.",
  htc: "Best for rehabilitating a certified historic building where the extra certification work is worth the credit.",
  "home-chdo":
    "Best when a nonprofit holds or can reach CHDO designation \u2014 a reserved share of the same HOME allocation, with a smaller field of applicants competing for it.",
};

const ACTION_PLANS: ActionPlan[] = [
  {
    programId: "brownfields",
    programName: "EPA Brownfields Assessment and Cleanup",
    bestFor: BEST_FOR["brownfields"]!,
    administeredLocallyBy: "PartnerTulsa",
    administeredNote:
      "You do not apply to EPA for this. EPA awards the grant to a local recipient, and in Tulsa the program is run through PartnerTulsa. Your application, your scope of testing, and your reimbursement all go through them. Calling EPA first costs you weeks.",
    administeredSourceIds: ["lo-partnertulsa-bf", "pg-brownfields"],
    contacts: [
      {
        body: "PartnerTulsa",
        contactId: "pt-brownfields",
        person: "Karyn",
        role: "Brownfields program contact — the person who starts the process",
        method: "Call or email PartnerTulsa and ask for Karyn on the Brownfields program.",
        note: "Ask for Karyn by name to begin. Staff change; if she has moved on, ask who now handles Brownfields intake.",
        sourceIds: ["lo-partnertulsa-bf"],
      },
      {
        body: "U.S. Environmental Protection Agency, Region 6",
        contactId: "epa-r6-brownfields",
        person: "Regional Brownfields coordinator (role, not a named individual)",
        role: "Federal program office",
        method: "Contact only after PartnerTulsa, and usually only if they direct you to.",
        sourceIds: ["pg-brownfields"],
      },
    ],
    mustBe: [
      {
        requirement: "A nonprofit, or partnered with one",
        detail:
          "The applicant must be a nonprofit, or must partner with a nonprofit. A for-profit developer is not shut out — but you cannot apply on your own. You structure a partnership with a nonprofit entity that carries the application, and you settle in writing, before you apply, who holds the contracts, who is reimbursed, and who owns the site at each stage.",
        sourceIds: ["lo-partnertulsa-bf", "pg-brownfields"],
      },
      {
        requirement: "Not responsible for the contamination",
        detail:
          "Grant funds cannot be used to clean up contamination the applicant caused. Expect to document how the site got that way and how you acquired it.",
        sourceIds: ["pg-brownfields"],
      },
      {
        requirement: "Able to carry cost before repayment",
        detail:
          "Because this is a reimbursement, the applying entity needs enough working capital or a bridge to pay consultants and haulers before any money comes back.",
        sourceIds: ["lo-partnertulsa-bf"],
      },
    ],
    steps: [
      {
        order: 1,
        title: "Call Karyn at PartnerTulsa to open the file",
        detail:
          "Describe the parcel, the suspected prior use, and what you intend to build. This conversation determines whether the site fits the current grant's scope and which phase of testing you start with.",
        duration: "One call; a week or two to get on the calendar",
        contact: "PartnerTulsa",
        sourceIds: ["lo-partnertulsa-bf"],
      },
      {
        order: 2,
        title: "Confirm or assemble the nonprofit applicant",
        detail:
          "If you are a nonprofit, gather your determination letter, board roster, and last audit. If you are for-profit, identify the nonprofit partner and sign a memorandum of understanding covering roles, reimbursement flow, and site control.",
        duration: "2 to 6 weeks, longer if the partnership is new",
        sourceIds: ["pg-brownfields", "lo-partnertulsa-bf"],
      },
      {
        order: 3,
        title: "Document site control and site history",
        detail:
          "Deed or option, plus whatever you can find on prior uses: Sanborn maps, old permits, tank records, aerial photos. The history drives the testing scope and the cost estimate.",
        duration: "2 to 4 weeks",
        sourceIds: ["pg-brownfields"],
      },
      {
        order: 4,
        title: "Scope Phase I environmental site assessment",
        detail:
          "PartnerTulsa will confirm the consultant procurement path. Do not commission testing outside the approved process — work done before approval is generally not reimbursable.",
        duration: "3 to 6 weeks once authorized",
        contact: "PartnerTulsa",
        sourceIds: ["lo-partnertulsa-bf", "pg-brownfields"],
      },
      {
        order: 5,
        title: "Run Phase II testing if Phase I finds a recognized environmental condition",
        detail:
          "Borings, soil and groundwater sampling, laboratory turnaround. This is where the real cost sits and where the schedule usually slips.",
        duration: "6 to 12 weeks",
        sourceIds: ["pg-brownfields"],
      },
      {
        order: 6,
        title: "Agree the cleanup scope and reimbursement budget in writing",
        detail:
          "Soil removal quantities, disposal facility, hauling, confirmation sampling. Get the eligible line items agreed before mobilizing, not after.",
        duration: "2 to 4 weeks",
        contact: "PartnerTulsa",
        sourceIds: ["lo-partnertulsa-bf"],
      },
      {
        order: 7,
        title: "Perform the work, then submit for reimbursement with full documentation",
        detail:
          "Invoices, proof of payment, laboratory results, disposal manifests. Incomplete documentation is the single most common cause of a delayed or denied repayment.",
        duration: "Repayment typically weeks after a complete submission",
        contact: "PartnerTulsa",
        sourceIds: ["lo-partnertulsa-bf"],
      },
      {
        order: 8,
        title: "Obtain closure documentation and file it with your project record",
        detail:
          "Lenders and later funders will ask for the closure letter or no-further-action determination before they commit construction financing.",
        duration: "Varies with the regulator",
        sourceIds: ["pg-brownfields"],
      },
    ],
    dates: [
      {
        date: "Rolling",
        label: "PartnerTulsa intake",
        detail:
          "Intake is not tied to one annual date, but the local grant has a fixed award period and a finite pot. Sites that come in late in the period may not be reachable.",
        ifMissed:
          "If the current grant period closes or the funds are committed, you wait for the next EPA award cycle — that can be a year or more.",
        sourceIds: ["lo-partnertulsa-bf"],
      },
      {
        date: "Before any site work",
        label: "Written authorization to incur cost",
        detail: "Costs incurred before authorization are generally not reimbursable.",
        ifMissed: "You pay for that work yourself, with no repayment.",
        sourceIds: ["pg-brownfields"],
      },
    ],
    disbursement: "reimbursement",
    disbursementPlain:
      "Reimbursement. Nothing is advanced. You — or your nonprofit partner — pay the consultant, the hauler, and the lab, then submit documentation and are repaid. Plan the cash for that gap before you start, because remediation invoices arrive well before the repayment does.",
    covers: [
      "Phase I environmental site assessment",
      "Phase II testing: borings, sampling, laboratory analysis",
      "Soil removal, hauling, and disposal",
      "Confirmation sampling and closure documentation",
      "Cleanup planning and community engagement tied to the site",
    ],
    doesNotCover: [
      "Land acquisition",
      "Vertical construction of the building",
      "Contamination the applicant caused",
      "Work performed before written authorization",
    ],
    coverageSourceIds: ["pg-brownfields", "lo-partnertulsa-bf"],
    failureModes: [
      {
        reason: "A for-profit applies alone",
        detail:
          "The nonprofit requirement is structural, not a scoring preference. Applications without a nonprofit applicant or partner do not proceed.",
      },
      {
        reason: "Work is commissioned before authorization",
        detail:
          "Developers often order a Phase I to move fast, then discover the cost is not reimbursable.",
      },
      {
        reason: "Underestimating the reimbursement gap",
        detail:
          "The project stalls mid-remediation because nobody budgeted to carry the cost until repayment.",
      },
      {
        reason: "Thin documentation",
        detail:
          "Missing proof of payment or disposal manifests turns a routine draw into months of back-and-forth.",
      },
    ],
    unverified:
      "Unverified: the PartnerTulsa staff contact, the current intake process, and the scope of the active grant. Confirm with PartnerTulsa before relying on any of it.",
  },
  {
    programId: "cdbg",
    programName: "Community Development Block Grant (CDBG)",
    bestFor: BEST_FOR["cdbg"]!,
    administeredLocallyBy: "City of Tulsa Community Development Department",
    administeredNote:
      "Tulsa is an Entitlement Community, so HUD sends the money to the City and the City decides who gets it. You never apply to HUD. Everything that determines whether you are funded — the meeting, the cycle, the review — happens at City Hall.",
    administeredSourceIds: ["rp-conplan", "pg-cdbg", "ch-cdbg"],
    contacts: [
      {
        body: "City of Tulsa Community Development Department",
        contactId: "tulsa-cd-cdbg",
        person: "Community Development program staff (role, not a named individual — staff assignments change)",
        role: "Runs the annual CDBG cycle, the application meeting, and the award recommendation",
        method: "Call the department and ask who is handling the current CDBG application round.",
        note: "This is the first call. Make it before you design anything around CDBG money.",
        sourceIds: ["rp-conplan", "ch-cdbg"],
      },
      {
        body: "City of Tulsa Working in Neighborhoods",
        contactId: "tulsa-win-draws",
        person: "Draw and compliance staff (role)",
        role: "Processes reimbursement draws after award",
        method: "Contact after award, when you set up your draw schedule.",
        sourceIds: ["pg-cdbg"],
      },
    ],
    mustBe: [
      {
        requirement: "An eligible subrecipient or developer under the City's process",
        detail:
          "Most awards go to nonprofits and CDCs; for-profit developers can participate but generally through a defined role in the City's process. Confirm your standing before you build a budget around it.",
        sourceIds: ["pg-cdbg", "rp-conplan"],
      },
      {
        requirement: "Present at the annual meeting",
        detail:
          "Attendance at the City's annual in-person meeting, posted on the City of Tulsa website, is a prerequisite to being approved for the opportunity to apply. This is a gate, not a formality: skip it and there is no application to score.",
        sourceIds: ["lo-cdbg-meeting", "ch-cdbg"],
      },
      {
        requirement: "Able to meet a national objective",
        detail:
          "Your activity has to serve low- and moderate-income people — usually by area benefit inside a qualifying tract, or by limited clientele. Establish which one before writing.",
        sourceIds: ["pg-cdbg"],
      },
    ],
    steps: [
      {
        order: 1,
        title: "Call the City of Tulsa Community Development Department",
        detail:
          "Ask three things: when the annual application meeting is, what this year's funding priorities are, and whether your activity type is in scope. Their answers usually decide whether CDBG is worth pursuing this cycle.",
        duration: "One call, plus a week to get a call back",
        contact: "City of Tulsa Community Development Department",
        sourceIds: ["rp-conplan"],
      },
      {
        order: 2,
        title: "Watch the City website for the annual meeting notice",
        detail:
          "The meeting is posted on the City of Tulsa website. There is no personal invitation and no reliable mailing list — if you are not watching for the notice, you can miss it entirely.",
        duration: "Ongoing until posted",
        sourceIds: ["lo-cdbg-meeting"],
      },
      {
        order: 3,
        title: "Attend the annual in-person meeting and record your attendance",
        detail:
          "Show up in person, sign in, and keep evidence that you signed in. Attendance is what makes you eligible to apply at all.",
        duration: "Half a day",
        contact: "City of Tulsa Community Development Department",
        sourceIds: ["lo-cdbg-meeting", "ch-cdbg"],
      },
      {
        order: 4,
        title: "Establish your national objective for this parcel",
        detail:
          "If the parcel is inside a Qualified Census Tract, area benefit is documented from tract data. If not, plan for an income survey or a limited-clientele justification, which takes real time.",
        duration: "1 to 4 weeks; longer if a survey is needed",
        sourceIds: ["pg-cdbg"],
      },
      {
        order: 5,
        title: "Write the application for a non-specialist reader",
        detail:
          "Applications are reviewed by volunteers who select which projects receive funding. They are neighbors and community members, not underwriters. Lead with what gets built, who it serves, and what it costs. Strip the acronyms. Put the pro forma in an appendix.",
        duration: "3 to 6 weeks",
        sourceIds: ["lo-cdbg-review"],
      },
      {
        order: 6,
        title: "Attend the citizen participation public hearing",
        detail:
          "The Consolidated Plan process requires public hearings. Attending, and being able to say you attended, is routinely asked about.",
        duration: "One evening",
        sourceIds: ["ch-cdbg", "rp-conplan"],
      },
      {
        order: 7,
        title: "Submit by the published deadline, then be available for questions",
        detail:
          "Late submissions are not reviewed. After filing, expect clarification requests from staff on a short turnaround.",
        duration: "Cycle-dependent",
        sourceIds: ["rp-conplan"],
      },
      {
        order: 8,
        title: "If awarded, set up your draw process before construction",
        detail:
          "CDBG pays by reimbursement. Agree the documentation format with Working in Neighborhoods staff before the first invoice, not after.",
        duration: "2 to 4 weeks",
        contact: "City of Tulsa Working in Neighborhoods",
        sourceIds: ["pg-cdbg"],
      },
    ],
    dates: [
      {
        date: "Posted annually",
        label: "Annual in-person application meeting",
        detail:
          "Posted on the City of Tulsa website. Attendance is required to be approved for the opportunity to apply.",
        ifMissed:
          "You cannot apply in that cycle. There is no make-up session, and the next cycle is a year away.",
        sourceIds: ["lo-cdbg-meeting"],
      },
      {
        date: "March 12",
        label: "Public hearing — Consolidated Plan",
        detail: "Citizen participation step in the local process.",
        ifMissed:
          "Reviewers may treat the application as weakly connected to the community process; some ask for the date attended outright.",
        sourceIds: ["ch-cdbg"],
      },
      {
        date: "April 30",
        label: "Application deadline",
        detail: "Annual local cycle for CDBG and HOME.",
        ifMissed: "Late submissions are not reviewed. The project waits a full year.",
        sourceIds: ["rp-conplan"],
      },
    ],
    disbursement: "reimbursement",
    disbursementPlain:
      "Reimbursement. You spend first and submit draw requests to the City's Working in Neighborhoods office, and payment typically follows 30 to 60 days later. Line up a construction lender or working capital that can live with that lag.",
    covers: [
      "Acquisition of real property for an eligible activity",
      "Public infrastructure serving the site",
      "Housing rehabilitation",
      "Clearance and demolition",
      "Certain public services, within the statutory cap",
    ],
    doesNotCover: [
      "New housing construction by the City itself, outside limited exceptions",
      "General operating expenses of your organization",
      "Costs incurred before the environmental review clears",
      "Activities that do not meet a national objective",
    ],
    coverageSourceIds: ["pg-cdbg", "rp-conplan"],
    failureModes: [
      {
        reason: "Missing the annual meeting",
        detail:
          "The most common and the most avoidable. Applicants assume the meeting is informational and skip it, then find they are not eligible to apply.",
      },
      {
        reason: "Writing for a technical reviewer",
        detail:
          "Volunteers score these applications. Dense regulatory language and unexplained acronyms read as evasive and score poorly.",
      },
      {
        reason: "No documented national objective",
        detail:
          "Applications that assert a benefit without tract data or a survey get sent back or set aside.",
      },
      {
        reason: "Choice-limiting actions before environmental clearance",
        detail:
          "Acquiring or disturbing the site too early can disqualify the activity from federal funds entirely.",
      },
      {
        reason: "Cash flow planned as though the grant pays up front",
        detail: "It does not. Reimbursement lag is the routine cause of mid-project distress.",
      },
    ],
    unverified:
      "Unverified: the current meeting schedule, whether attendance is enforced as a strict prerequisite in every cycle, and the composition of the review body. Confirm with the City of Tulsa Community Development Department.",
  },
  {
    programId: "home-chdo-designated",
    programName: "HOME — CHDO Set-Aside (you are designated)",
    bestFor:
      "Best when you already hold CHDO certification and want the reserved, less competitive share of the city's HOME allocation.",
    administeredLocallyBy: "City of Tulsa Community Development Department",
    administeredNote:
      "HUD creates the reserve; the City of Tulsa, as Participating Jurisdiction, certifies CHDOs and awards from it. You apply to the city on the same annual cycle as general HOME, but into the reserved pool, where the field is limited to certified organizations.",
    administeredSourceIds: ["og-chdo-pj", "og-chdo-setaside"],
    contacts: [
      {
        body: "City of Tulsa Community Development Department",
        contactId: "tulsa-cd-home",
        person: "HOME program coordinator (role, not a named individual)",
        role: "Runs the HOME cycle and the CHDO reserve",
        method: "Ask for the HOME program coordinator and say you are applying as a certified CHDO.",
        note: "Confirm your certification is current for this round before you build the application.",
        sourceIds: ["og-chdo-pj"],
      },
    ],
    mustBe: [
      {
        requirement: "Currently certified, not previously certified",
        detail:
          "The PJ re-certifies, generally per funding round. A lapsed certification takes you out of the reserve even if the underlying organization has not changed.",
        sourceIds: ["og-chdo-pj", "og-chdo"],
      },
      {
        requirement: "Acting as owner, developer, or sponsor",
        detail:
          "The housing must be owned, developed, or sponsored by the CHDO. A fee-for-service or consulting role does not qualify the project for the reserve.",
        sourceIds: ["og-chdo-roles", "og-chdo-setaside"],
      },
    ],
    steps: [
      {
        order: 1,
        title: "Confirm certification is current for this funding round",
        detail:
          "Ask the PJ in writing whether your certification covers the round you intend to apply in, and what re-certification documents they want.",
        duration: "1 to 2 weeks",
        contact: "City of Tulsa Community Development Department",
        sourceIds: ["og-chdo-pj"],
      },
      {
        order: 2,
        title: "Fix your role in the deal — owner, developer, or sponsor",
        detail:
          "Decide which of the three roles you will hold and paper it. The role determines control, residual ownership, and how the PJ tests the project against the reserve.",
        duration: "2 to 4 weeks with counsel",
        sourceIds: ["og-chdo-roles"],
      },
      {
        order: 3,
        title: "Build the application into the reserved pool",
        detail:
          "Same application as general HOME, flagged for the CHDO set-aside, with certification evidence, board roster, capacity documentation, and the affordability structure attached.",
        duration: "4 to 8 weeks",
        sourceIds: ["og-chdo-setaside", "pg-home"],
      },
      {
        order: 4,
        title: "Model the 20-year affordability period into the pro forma",
        detail:
          "The reserve does not soften HOME's terms. Rent and income restrictions, resale or recapture, and annual monitoring apply exactly as they do on the open side.",
        duration: "1 to 2 weeks",
        sourceIds: ["pg-home"],
      },
    ],
    dates: [
      {
        date: "April 30",
        label: "Annual HOME and CDBG application deadline",
        detail: "The reserve is awarded on the same local cycle as general HOME.",
        ifMissed: "The reserved dollars are committed to other certified organizations for the year.",
        sourceIds: ["rp-conplan"],
      },
    ],
    disbursement: "forgivable-loan",
    disbursementPlain:
      "Forgivable loan. Committed at closing, drawn against invoices during construction, and forgiven at the end of the affordability period if the units stay compliant.",
    covers: [
      "Acquisition, new construction, and rehabilitation of affordable housing",
      "Certain CHDO project soft costs recognized by the PJ",
      "Homebuyer development where resale or recapture is imposed",
    ],
    doesNotCover: [
      "General organizational operating costs outside recognized CHDO operating assistance",
      "Projects where the CHDO is only a paid consultant",
      "Units that cannot hold the full affordability period",
    ],
    coverageSourceIds: ["pg-home", "og-chdo-setaside"],
    failureModes: [
      {
        reason: "Certification lapsed between rounds",
        detail: "Organizations assume designation is permanent. The PJ treats it as periodic.",
      },
      {
        reason: "Role fails the owner/developer/sponsor test",
        detail:
          "A structure where a for-profit co-developer actually runs the deal reads as a pass-through and can be moved out of the reserve.",
      },
      {
        reason: "Capacity documentation is stale",
        detail: "Staff turnover since the last certification undercuts the capacity showing.",
      },
    ],
    roles: {
      title: "Your role in the deal",
      intro:
        "Owner, developer, and sponsor are distinct roles under the program, not synonyms. Each carries different control and ownership consequences.",
      sourceIds: ["og-chdo-roles"],
      items: CHDO_ROLES,
    },
    unverified:
      "Unverified: the current set-aside percentage, the City of Tulsa re-certification schedule, and the exact application flag for the reserve. Confirm with the Community Development Department.",
  },
  {
    programId: "home-chdo-certify",
    programName: "HOME — CHDO Set-Aside: certification route",
    bestFor:
      "Best when you are a nonprofit building a pipeline and want standing access to a reserved, less competitive pool — not when you need money on a deal closing this year.",
    administeredLocallyBy: "City of Tulsa Community Development Department",
    administeredNote:
      "HUD writes the standard; the City of Tulsa certifies against it. There is no application to HUD. Everything in this plan happens with the PJ.",
    administeredSourceIds: ["og-chdo-pj", "og-chdo"],
    contacts: [
      {
        body: "City of Tulsa Community Development Department",
        contactId: "tulsa-cd-chdo",
        person: "CHDO certification contact (role, not a named individual)",
        role: "Receives and reviews certification applications",
        method:
          "Call the department and ask who handles CHDO certification, then request the current application packet and the round calendar.",
        note: "Ask in the first call how long recent certifications have taken end to end.",
        sourceIds: ["og-chdo-pj"],
      },
    ],
    mustBe: [
      {
        requirement: "A 501(c)(3) or otherwise qualifying tax-exempt nonprofit",
        detail:
          "You need the determination letter and conforming organizational documents. A for-profit affiliate cannot be certified.",
        sourceIds: ["og-501c3", "og-chdo"],
      },
      {
        requirement: "Board composition drawn from the community served",
        detail:
          "At least one third of the governing board must represent the low-income community, and no more than a limited share may be appointed by a public body. Board recruitment is usually the longest item on this list.",
        sourceIds: ["og-chdo-capacity", "og-chdo"],
      },
      {
        requirement: "Demonstrated capacity in housing development",
        detail:
          "Paid staff with development experience, or a qualified consultant paired with a written capacity-building plan the PJ accepts. Volunteer intent does not satisfy this.",
        sourceIds: ["og-chdo-capacity"],
      },
      {
        requirement: "A defined service area and a year of serving it",
        detail:
          "The PJ wants evidence that the organization has operated in the community it claims, not that it was formed to chase a round.",
        sourceIds: ["og-chdo", "og-chdo-pj"],
      },
    ],
    steps: [
      {
        order: 1,
        title: "Request the PJ's certification packet and calendar",
        detail:
          "Get the current checklist in writing before drafting anything. Requirements are read locally and change between rounds.",
        duration: "1 to 2 weeks",
        contact: "City of Tulsa Community Development Department",
        sourceIds: ["og-chdo-pj"],
      },
      {
        order: 2,
        title: "Audit your board against the composition test",
        detail:
          "Map every seat: who represents the low-income community served, who was appointed by a public body, and what the bylaws actually require. Fixing this usually means recruiting and seating new members.",
        duration: "2 to 4 months, driven by your board meeting cycle",
        sourceIds: ["og-chdo-capacity", "og-chdo"],
      },
      {
        order: 3,
        title: "Amend bylaws and articles to conform",
        detail:
          "Purpose clause, service area, board composition, and the low-income input process usually need explicit language. Board adoption is a formal vote.",
        duration: "1 to 2 months including legal review",
        sourceIds: ["og-chdo", "og-chdo-pj"],
      },
      {
        order: 4,
        title: "Document capacity",
        detail:
          "Staff resumes, completed project list, or a consultant agreement plus a capacity-building plan naming who is being trained and by when.",
        duration: "3 to 6 weeks",
        sourceIds: ["og-chdo-capacity"],
      },
      {
        order: 5,
        title: "Assemble financial documentation",
        detail:
          "Recent audit or reviewed financial statements, current operating budget, and financial accountability standards the PJ can point to.",
        duration: "2 to 6 weeks, longer if an audit must be commissioned",
        sourceIds: ["og-chdo-pj"],
      },
      {
        order: 6,
        title: "Submit and answer the PJ's review questions",
        detail:
          "Expect at least one round of follow-up. Answer in the PJ's own vocabulary and cite the regulation paragraph each document satisfies.",
        duration: "1 to 3 months to a certification decision",
        contact: "City of Tulsa Community Development Department",
        sourceIds: ["og-chdo-pj"],
      },
      {
        order: 7,
        title: "In parallel, pursue a partnership for the deal in front of you",
        detail:
          "Certification will not arrive in time for a near-term closing. If this parcel needs the reserve now, run the partnership route alongside certification rather than waiting.",
        duration: "Concurrent",
        sourceIds: ["og-chdo-directory", "og-chdo-roles"],
      },
    ],
    dates: [
      {
        date: "Multi-month process",
        label: "Plan on six to twelve months from first call to certification",
        detail:
          "Board recruitment and bylaw amendment, not the PJ's review, are what set the length. This is a pipeline decision, not a financing decision.",
        ifMissed:
          "Nothing is forfeited, but a deal that needed the reserve this cycle proceeds without it — which is why the partnership route runs in parallel.",
        sourceIds: ["og-chdo-pj"],
      },
      {
        date: "April 30",
        label: "Annual HOME application deadline",
        detail: "Certification must be in hand before this date to apply into the reserve this cycle.",
        ifMissed: "You apply on the open HOME side this year and into the reserve the next.",
        sourceIds: ["rp-conplan"],
      },
    ],
    disbursement: "forgivable-loan",
    disbursementPlain:
      "Certification itself carries no money. What it opens is HOME, which arrives as a forgivable loan: committed at closing, drawn against invoices, forgiven after the affordability period.",
    covers: [
      "Standing to compete for the reserved CHDO share of the city's HOME allocation",
      "Eligibility for CHDO operating assistance where the PJ offers it",
      "Recognition as owner, developer, or sponsor on HOME-assisted housing",
    ],
    doesNotCover: [
      "Any award on its own — certification is status, not funding",
      "A near-term closing; the timeline does not support it",
      "CDBG. The set-aside is a HOME feature and has no CDBG counterpart.",
    ],
    coverageSourceIds: ["og-chdo-setaside", "og-chdo", "pg-home"],
    failureModes: [
      {
        reason: "Treating designation as a quick unlock",
        detail:
          "The most damaging error. Organizations delay a deal expecting certification in weeks, then lose the round and the site control.",
      },
      {
        reason: "Board composition asserted rather than documented",
        detail:
          "The PJ wants named seats tied to the community served, not a statement that the board is representative.",
      },
      {
        reason: "Capacity resting on a consultant with no transfer plan",
        detail:
          "A consultant is accepted as a bridge, not as the answer. Without a capacity-building plan the file stalls.",
      },
      {
        reason: "Confusing the reserve with CDBG",
        detail:
          "Applications sometimes arrive asking for a CHDO set-aside of CDBG. There is none; the reserve is HOME only.",
      },
    ],
    unverified:
      "Unverified: the City of Tulsa certification packet contents, the current review timeline, and the set-aside percentage. Confirm with the Community Development Department.",
  },
  {
    programId: "home-chdo-partner",
    programName: "HOME — CHDO Set-Aside: partnership route",
    bestFor:
      "Best when you are a for-profit developer or a public body and want the reserved pool on a live deal, through a certified CHDO rather than a designation you cannot hold.",
    administeredLocallyBy: "City of Tulsa Community Development Department",
    administeredNote:
      "The PJ certifies CHDOs, maintains the list of who is certified, and decides whether your structure genuinely places the CHDO in an owner, developer, or sponsor role. Bring the structure to them before you paper it, not after.",
    administeredSourceIds: ["og-chdo-pj", "og-chdo-roles"],
    contacts: [
      {
        body: "City of Tulsa Community Development Department",
        contactId: "tulsa-cd-home",
        person: "HOME program coordinator (role, not a named individual)",
        role: "Holds the certified CHDO list and reviews proposed structures",
        method:
          "Request the current roster of certified CHDOs and ask what structures the PJ has accepted in recent rounds.",
        note: "The roster is the practical starting point — it is maintained by the PJ and is not published reliably anywhere else.",
        sourceIds: ["og-chdo-directory", "og-chdo-pj"],
      },
    ],
    mustBe: [
      {
        requirement: "Not the CHDO — and honest about that",
        detail:
          "A for-profit entity or a government body cannot be certified. The reserve is still reachable, but only through a certified organization that genuinely holds one of the three roles.",
        sourceIds: ["og-chdo", "og-chdo-roles"],
      },
      {
        requirement: "Able to give up real control in one of three ways",
        detail:
          "Owner, developer, and sponsor are distinct, and each concedes something different. A structure that leaves the CHDO with a fee and no substantive role will not survive PJ review.",
        sourceIds: ["og-chdo-roles"],
      },
      {
        requirement: "Holding site control the partner can rely on",
        detail:
          "Bring the parcel, the schedule, and clean site control. That is what makes you worth partnering with to an organization whose constraint is capacity, not mission.",
        sourceIds: ["og-chdo-pj"],
      },
    ],
    steps: [
      {
        order: 1,
        title: "Get the PJ's current certified CHDO roster",
        detail:
          "Ask the Community Development Department for the list of organizations currently certified. Certification lapses, so a name from a prior year proves nothing.",
        duration: "1 to 2 weeks",
        contact: "City of Tulsa Community Development Department",
        sourceIds: ["og-chdo-directory", "og-chdo-pj"],
      },
      {
        order: 2,
        title: "Shortlist by service area and building type",
        detail:
          "Most CHDOs have a stated service area and a housing type they actually deliver. Match the parcel to that before you call, or the first conversation ends there.",
        duration: "1 week",
        sourceIds: ["og-chdo-directory"],
      },
      {
        order: 3,
        title: "Decide which role the CHDO will hold",
        detail:
          "Owner, developer, or sponsor. Decide before the first meeting what you are prepared to concede, because the answer sets everything downstream — control, residual ownership, and guarantees.",
        duration: "1 to 2 weeks with counsel",
        sourceIds: ["og-chdo-roles"],
      },
      {
        order: 4,
        title: "Meet the shortlisted organizations",
        detail:
          "Lead with what you bring — site, schedule, capital, guarantees — and be direct about the role you are offering. Capacity is their scarce resource; respect it.",
        duration: "3 to 6 weeks",
        sourceIds: ["og-chdo-directory"],
      },
      {
        order: 5,
        title: "Take the proposed structure to the PJ before signing",
        detail:
          "Ask the PJ whether the structure satisfies the owner, developer, or sponsor test as they read it. A structure corrected now costs a meeting; corrected later it costs the award.",
        duration: "2 to 4 weeks",
        contact: "City of Tulsa Community Development Department",
        sourceIds: ["og-chdo-roles", "og-chdo-pj"],
      },
      {
        order: 6,
        title: "Paper the joint venture and the development agreement",
        detail:
          "Roles, fee split, decision rights, guarantees, who signs the HOME documents, and what happens at the end of the affordability period. Write the exit before you write the pro forma.",
        duration: "1 to 3 months",
        sourceIds: ["og-chdo-roles"],
      },
      {
        order: 7,
        title: "Apply into the reserve with the CHDO as applicant",
        detail:
          "The certified organization applies. Your role appears in the development agreement and the organizational chart the PJ reviews.",
        duration: "4 to 8 weeks",
        sourceIds: ["og-chdo-setaside", "pg-home"],
      },
    ],
    dates: [
      {
        date: "April 30",
        label: "Annual HOME application deadline",
        detail:
          "The partner must be identified and the structure settled well before this date — expect the PJ conversation to take weeks.",
        ifMissed: "The reserved dollars are committed for the year and the deal waits a cycle.",
        sourceIds: ["rp-conplan"],
      },
    ],
    disbursement: "forgivable-loan",
    disbursementPlain:
      "Forgivable loan, committed to the CHDO-led ownership structure and drawn against invoices. How proceeds and fees move between you and the CHDO is set by your development agreement, not by the program.",
    covers: [
      "Acquisition, construction, and rehabilitation within a CHDO-led structure",
      "Developer fee split as agreed and as the PJ accepts it",
    ],
    doesNotCover: [
      "An award to your entity in its own name",
      "Structures where the CHDO's role is nominal",
      "CDBG activities — the reserve is HOME only",
    ],
    coverageSourceIds: ["og-chdo-setaside", "pg-home"],
    failureModes: [
      {
        reason: "A CHDO partner recruited for its name",
        detail:
          "The single most common failure. If the CHDO is not genuinely the owner, developer, or sponsor, the PJ moves the application out of the reserve.",
      },
      {
        reason: "Structure papered before the PJ saw it",
        detail:
          "Rewriting executed documents under deadline is how deals miss the round.",
      },
      {
        reason: "Partner chosen from a stale list",
        detail: "Certification lapses between rounds. Confirm current status with the PJ in writing.",
      },
      {
        reason: "No end-of-compliance plan",
        detail:
          "Neither side thinks about who holds the asset in year 21 until it is a dispute.",
      },
    ],
    directory: {
      title: "CHDOs certified by the Participating Jurisdiction",
      intro:
        "The City of Tulsa maintains this list as the HOME Participating Jurisdiction. It is the practical starting point for finding a partner — there is no reliable statewide directory.",
      caveat: CHDO_DIRECTORY_CAVEAT,
      sourceIds: ["og-chdo-directory", "og-chdo-pj"],
      entries: CHDO_DIRECTORY,
    },
    roles: {
      title: "What the CHDO's role would be",
      intro:
        "Owner, developer, and sponsor are distinct roles under the program, with different implications for control and ownership. Choose deliberately; the PJ will test whether the role is real.",
      sourceIds: ["og-chdo-roles"],
      items: CHDO_ROLES,
    },
    unverified:
      "Unverified: the certified CHDO roster shown here is illustrative, and the PJ's current reading of acceptable structures has not been confirmed. Request both from the City of Tulsa Community Development Department.",
  },
];

export const ACTION_PLAN_BY_PROGRAM: Record<string, ActionPlan> = Object.fromEntries(
  ACTION_PLANS.map((p) => [p.programId, p]),
);

export function actionPlanFor(programId: string): ActionPlan | null {
  return ACTION_PLAN_BY_PROGRAM[programId] ?? null;
}

/** The CHDO set-aside has one plan per eligibility state. Every state has one. */
export function chdoPlanFor(route: ChdoRoute): ActionPlan | null {
  const id =
    route === "designated"
      ? "home-chdo-designated"
      : route === "certify"
        ? "home-chdo-certify"
        : "home-chdo-partner";
  return ACTION_PLAN_BY_PROGRAM[id] ?? null;
}

export function planCitationIds(plan: ActionPlan): string[] {
  return [
    ...plan.administeredSourceIds,
    ...plan.contacts.flatMap((c) => c.sourceIds),
    ...plan.mustBe.flatMap((m) => m.sourceIds),
    ...plan.steps.flatMap((s) => s.sourceIds),
    ...plan.dates.flatMap((d) => d.sourceIds),
    ...plan.coverageSourceIds,
    ...(plan.directory?.sourceIds ?? []),
    ...(plan.roles?.sourceIds ?? []),
  ];
}

export const ALL_PLAN_CITATION_IDS = Array.from(
  new Set(ACTION_PLANS.flatMap(planCitationIds)),
);
