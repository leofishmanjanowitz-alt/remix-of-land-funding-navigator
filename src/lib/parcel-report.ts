import { zoningSourceIds } from "./citations";
import {
  LAYERS,
  ZONING,
  programsFor,
  type Parcel,
  type Program,
} from "./tulsa-map-data";
import type { Task } from "./tasks";

export type ReportStep = {
  order: number;
  title: string;
  detail: string;
  owner: string;
  timing: string;
  sourceId?: string;
};

export type ReportContact = {
  contactId?: string;
  department: string;
  role: string;
  note: string;
};

export type ReportDate = {
  date: string;
  label: string;
  detail: string;
  sourceId?: string;
};

export type ParcelReport = {
  parcel: Parcel;
  preparedOn: string;
  programs: Program[];
  overlays: { id: string; short: string; name: string }[];
  zoningSummary: {
    label: string;
    permitted: string[];
    conditional: string[];
    maxHeight: string;
    minLot: string;
  };
  steps: ReportStep[];
  contacts: ReportContact[];
  dates: ReportDate[];
  /** Citation registry ids, in the order they appear in the document. */
  citationIds: string[];
};

export function buildParcelReport(parcel: Parcel, tasks: Task[]): ParcelReport {
  const programs = programsFor(parcel);
  const zoning = ZONING[parcel.zoning];
  const z = zoningSourceIds(parcel.zoning);
  const eligible = programs.filter((p) => p.status !== "Not eligible");

  const steps: ReportStep[] = [
    {
      order: 1,
      title: "Confirm zoning and dimensional standards with the Planning Office",
      detail: `Verify that ${zoning.label} permits the intended unit count on ${parcel.acreage.toFixed(2)} acres, and check platting, parking, and overlay requirements before site control.`,
      owner: "Project lead",
      timing: "Weeks 1–2",
      sourceId: z.uses,
    },
    {
      order: 2,
      title: "Confirm site control and title",
      detail: "Obtain a purchase agreement or option, a current title commitment, and a boundary survey. Most funders require evidence of site control at application.",
      owner: "Project lead / counsel",
      timing: "Weeks 1–4",
    },
    {
      order: 3,
      title: "Request a pre-application meeting with the City of Tulsa Community Development Department",
      detail: "CDBG and HOME funds for this parcel are awarded locally as an Entitlement Community allocation, not directly by HUD. The pre-application conversation determines which annual cycle you can realistically enter.",
      owner: "Project lead",
      timing: "Weeks 2–4",
      sourceId: "ch-cdbg",
    },
    {
      order: 4,
      title: "Attend the citizen participation public hearing",
      detail: "Attendance at a public hearing tied to the Consolidated Plan is a required step before an application will be accepted. Record the date attended; some reviewers ask for it.",
      owner: "Project lead",
      timing: "Before application",
      sourceId: "rp-conplan",
    },
    {
      order: 5,
      title: "Assemble the funding stack in priority order",
      detail: eligible.length
        ? `Lead with ${eligible[0]?.name}. Layer the remaining programs (${eligible.slice(1).map((p) => p.name).join(", ") || "none identified"}) once the lead source is committed, and confirm each program's affordability period before signing.`
        : "No layered public sources were identified for this parcel. Reassess after a zoning change or after overlay boundaries are redrawn.",
      owner: "Finance lead",
      timing: "Months 2–4",
    },
    {
      order: 6,
      title: "Complete environmental review requirements",
      detail: "Federal sources trigger environmental review. Do not incur choice-limiting costs on the site before the responsible entity issues its clearance.",
      owner: "Project lead / consultant",
      timing: "Months 3–5",
      sourceId: "rp-part58",
    },
    {
      order: 7,
      title: "Submit applications against the published cycle deadlines",
      detail: "Track each program's deadline separately. Local cycles and state allocation rounds do not align, and a missed local cycle typically delays a project a full year.",
      owner: "Finance lead",
      timing: "Per cycle",
      sourceId: "rp-qap-cycle",
    },
  ];

  const contacts: ReportContact[] = [
    {
      contactId: "tulsa-cd-cdbg",
      department: "City of Tulsa Community Development Department",
      role: "CDBG and HOME administration; Consolidated Plan",
      note: "First call. Confirms cycle timing and local priorities for this council district.",
    },
    {
      contactId: "incog-planning",
      department: "City of Tulsa Planning Office (INCOG)",
      role: "Zoning verification, platting, board of adjustment",
      note: `Confirms what ${zoning.label} allows before design work begins.`,
    },
    {
      contactId: "ohfa-lihtc",
      department: "Oklahoma Housing Finance Agency",
      role: "LIHTC allocation and state HOME funds",
      note: "Review the current Qualified Allocation Plan before assuming competitiveness.",
    },
    {
      contactId: "tahtf",
      department: "Tulsa Affordable Housing Trust Fund",
      role: "Local gap financing",
      note: "Small awards, flexible terms. Often the fastest source to commit.",
    },
    {
      contactId: "usda-rd-ok",
      department: "USDA Rural Development — Oklahoma State Office",
      role: "Section 515 and related rural programs",
      note: "Relevant only if the parcel is inside a designated rural eligible area.",
    },
    {
      contactId: "tda",
      department: "City of Tulsa Economic Development",
      role: "Tax increment district administration",
      note: "Applies where the parcel sits inside an active increment district.",
    },
  ];

  const dates: ReportDate[] = [
    { date: "March 12", label: "Public hearing — Consolidated Plan", detail: "Required citizen participation step before a local application is accepted.", sourceId: "ch-cdbg" },
    { date: "April 30", label: "Tulsa CDBG / HOME application deadline", detail: "Annual local cycle. Late submissions are not reviewed.", sourceId: "rp-conplan" },
    { date: "June 15", label: "Housing Trust Fund gap financing round", detail: "Rolling review closes for the fiscal year.", sourceId: "ch-htf" },
    { date: "August 1", label: "OHFA 9% LIHTC application round", detail: "Confirm against the current Qualified Allocation Plan.", sourceId: "rp-qap-cycle" },
    { date: "October 3", label: "Environmental review clearance target", detail: "Work backward from this date to avoid choice-limiting actions.", sourceId: "rp-part58" },
  ];

  const citationIds = [
    "assessor-record",
    "assessor-value",
    ...LAYERS.filter((l) => parcel.layers.includes(l.id)).map((l) => `ov-${l.id}`),
    z.district,
    z.uses,
    z.height,
    z.lot,
    ...programs.map((p) => p.sourceId),
    "ch-cdbg",
    "rp-conplan",
    "rp-part58",
    "rp-qap-cycle",
    "ch-htf",
  ];

  const openTasks = tasks.filter((t) => !t.completed);
  if (openTasks.length) {
    steps.push({
      order: steps.length + 1,
      title: "Close out items already on your task list",
      detail: openTasks.map((t) => t.title).join("; ") + ".",
      owner: "Project lead",
      timing: "As scheduled",
    });
  }

  return {
    parcel,
    preparedOn: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    programs,
    overlays: LAYERS.filter((l) => parcel.layers.includes(l.id)).map((l) => ({
      id: l.id,
      short: l.short,
      name: l.name,
    })),
    zoningSummary: {
      label: zoning.label,
      permitted: zoning.permitted,
      conditional: zoning.conditional,
      maxHeight: zoning.maxHeight,
      minLot: zoning.minLot,
    },
    steps,
    contacts,
    dates,
    citationIds,
  };
}
