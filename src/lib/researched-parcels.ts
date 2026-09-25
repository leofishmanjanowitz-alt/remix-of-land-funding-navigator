import { PARCELS, programsFor, type Parcel } from "./tulsa-map-data";

export type ResearchedParcel = {
  parcel: Parcel;
  /** ISO date the parcel was last opened by the subscriber. */
  lastReviewed: string;
  note: string;
  openTasks: number;
  eligibleCount: number;
  maybeCount: number;
  /** Program ids with a "Likely eligible" or "May be eligible" status. */
  programIds: string[];
  programNames: string[];
};

const RESEARCH_NOTES: Record<number, { lastReviewed: string; note: string; openTasks: number }> = {
  0: {
    lastReviewed: "2026-08-28",
    note: "Site control letter drafted; awaiting seller response.",
    openTasks: 4,
  },
  2: {
    lastReviewed: "2026-08-26",
    note: "Pre-application meeting held with Tulsa Planning.",
    openTasks: 2,
  },
  4: { lastReviewed: "2026-08-21", note: "Flood elevation certificate ordered.", openTasks: 3 },
  6: { lastReviewed: "2026-08-19", note: "Shortlisted for the 2027 9% credit round.", openTasks: 5 },
  9: { lastReviewed: "2026-08-14", note: "Zoning change would be required before closing.", openTasks: 1 },
  11: { lastReviewed: "2026-08-09", note: "Held for a scattered-site duplex pilot.", openTasks: 0 },
  14: { lastReviewed: "2026-07-31", note: "Rural set-aside candidate; verify service area.", openTasks: 2 },
  17: { lastReviewed: "2026-07-24", note: "Owner unresponsive; revisit in Q4.", openTasks: 1 },
};

function build(): ResearchedParcel[] {
  return Object.entries(RESEARCH_NOTES).flatMap(([index, meta]) => {
    const parcel = PARCELS[Number(index)];
    if (!parcel) return [];
    const programs = programsFor(parcel);
    const usable = programs.filter((p) => p.status !== "Not eligible");
    return [
      {
        parcel,
        lastReviewed: meta.lastReviewed,
        note: meta.note,
        openTasks: meta.openTasks,
        eligibleCount: programs.filter((p) => p.status === "Likely eligible").length,
        maybeCount: programs.filter((p) => p.status === "May be eligible").length,
        programIds: usable.map((p) => p.id),
        programNames: usable.map((p) => p.name),
      },
    ];
  });
}

export const RESEARCHED_PARCELS: ResearchedParcel[] = build();

export const PROGRAM_FILTERS: { id: string; label: string }[] = [
  { id: "cdbg", label: "CDBG" },
  { id: "home", label: "HOME" },
  { id: "lihtc", label: "LIHTC" },
  { id: "usda515", label: "USDA 515" },
  { id: "tif", label: "TIF" },
  { id: "htf", label: "Housing Trust Fund" },
];

export type SortKey = "recent" | "eligible" | "tasks" | "address" | "value";

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recent", label: "Most recently reviewed" },
  { id: "eligible", label: "Most eligible programs" },
  { id: "tasks", label: "Most open tasks" },
  { id: "address", label: "Address (A–Z)" },
  { id: "value", label: "Assessed value (high–low)" },
];

export function sortResearched(rows: ResearchedParcel[], key: SortKey): ResearchedParcel[] {
  const out = [...rows];
  switch (key) {
    case "eligible":
      return out.sort((a, b) => b.eligibleCount - a.eligibleCount);
    case "tasks":
      return out.sort((a, b) => b.openTasks - a.openTasks);
    case "address":
      return out.sort((a, b) => a.parcel.address.localeCompare(b.parcel.address));
    case "value":
      return out.sort((a, b) => b.parcel.assessedValue - a.parcel.assessedValue);
    default:
      return out.sort((a, b) => b.lastReviewed.localeCompare(a.lastReviewed));
  }
}

export function formatReviewed(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
