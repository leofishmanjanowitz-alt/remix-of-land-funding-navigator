/**
 * Demand signal only. No directory, no matching, no provider listings.
 *
 * Every "would you like assistance with this?" selection is recorded with the
 * program, the assistance type, the parcel, the user, and a timestamp, so the
 * KPI review can answer three questions: what share of sessions ask for help,
 * which programs generate the most requests, and which assistance type
 * dominates.
 */

export type AssistanceTypeId =
  | "application-prep"
  | "technical-assistance"
  | "deal-structuring"
  | "compliance";

export type AssistanceType = {
  id: AssistanceTypeId;
  label: string;
  detail: string;
};

export const ASSISTANCE_TYPES: AssistanceType[] = [
  {
    id: "application-prep",
    label: "Application preparation",
    detail: "Writing and assembling the submission.",
  },
  {
    id: "technical-assistance",
    label: "Technical assistance",
    detail:
      "The underlying professional work — environmental assessment, historic documentation, market study.",
  },
  {
    id: "deal-structuring",
    label: "Deal structuring",
    detail: "Syndication, condominium regimes, layered financing.",
  },
  {
    id: "compliance",
    label: "Compliance and reporting",
    detail: "Ongoing obligations after an award.",
  },
];

export const ASSISTANCE_TYPE_LABEL: Record<AssistanceTypeId, string> =
  Object.fromEntries(ASSISTANCE_TYPES.map((t) => [t.id, t.label])) as Record<
    AssistanceTypeId,
    string
  >;

export type AssistanceRequest = {
  id: string;
  programId: string;
  programName: string;
  type: AssistanceTypeId;
  parcelId: string | null;
  parcelAddress: string | null;
  user: string;
  note?: string;
  /** ISO timestamp. */
  at: string;
  /** Seeded prototype history vs. requests made in this session. */
  source: "seed" | "session";
};

/** Stand-in for the signed-in account in this prototype. */
export const CURRENT_USER = "housing.director@tulsacdc.org";

/** Sessions observed, used for the "share of users who asked for help" KPI. */
export const SESSIONS_OBSERVED = 184;

function seed(
  id: string,
  programId: string,
  programName: string,
  type: AssistanceTypeId,
  parcelAddress: string,
  user: string,
  daysAgo: number,
): AssistanceRequest {
  const at = new Date(Date.UTC(2026, 8, 1) - daysAgo * 86400000).toISOString();
  return {
    id,
    programId,
    programName,
    type,
    parcelId: null,
    parcelAddress,
    user,
    at,
    source: "seed",
  };
}

const SEEDED: AssistanceRequest[] = [
  seed("s1", "htc", "Federal Historic Rehabilitation Tax Credit (20%)", "technical-assistance", "1237 E Archer St", "d.okafor@greenwoodhousing.org", 2),
  seed("s2", "htc", "Federal Historic Rehabilitation Tax Credit (20%)", "application-prep", "1237 E Archer St", "m.reyes@northtulsacdc.org", 5),
  seed("s3", "brownfields", "EPA Brownfields Assessment and Cleanup", "technical-assistance", "1648 N Peoria Ave", "j.whitfield@cityoftulsa.org", 3),
  seed("s4", "brownfields", "EPA Brownfields Assessment and Cleanup", "technical-assistance", "2011 E Pine St", "s.abbott@risehousing.org", 8),
  seed("s5", "brownfields", "EPA Brownfields Assessment and Cleanup", "application-prep", "2011 E Pine St", "s.abbott@risehousing.org", 8),
  seed("s6", "lihtc", "Low-Income Housing Tax Credit (9% and 4%)", "deal-structuring", "1922 S Denver Ave", "t.nguyen@meridiandev.com", 1),
  seed("s7", "lihtc", "Low-Income Housing Tax Credit (9% and 4%)", "application-prep", "1922 S Denver Ave", "t.nguyen@meridiandev.com", 4),
  seed("s8", "lihtc", "Low-Income Housing Tax Credit (9% and 4%)", "deal-structuring", "1374 N Greenwood Ave", "a.bell@communityworks.org", 6),
  seed("s9", "lihtc", "Low-Income Housing Tax Credit (9% and 4%)", "compliance", "1374 N Greenwood Ave", "a.bell@communityworks.org", 12),
  seed("s10", "cdbg", "Community Development Block Grant (CDBG)", "application-prep", "1511 E 11th St", "r.mccall@tulsacdc.org", 7),
  seed("s11", "cdbg", "Community Development Block Grant (CDBG)", "compliance", "1511 E 11th St", "r.mccall@tulsacdc.org", 9),
  seed("s12", "home", "HOME Investment Partnerships Program", "application-prep", "1785 S Elgin Ave", "l.turner@habitatgt.org", 11),
  seed("s13", "home-chdo", "HOME — CHDO Set-Aside", "application-prep", "1785 S Elgin Ave", "l.turner@habitatgt.org", 11),
  seed("s14", "usda515", "USDA Section 515 Rural Rental Housing", "deal-structuring", "3140 E 36th St N", "p.hargrove@ruralok.org", 15),
  seed("s15", "tif", "Tax Increment Financing — Increment District No. 6", "deal-structuring", "1101 S Trenton Ave", "k.dalton@partnertulsa.org", 13),
  seed("s16", "htc", "Federal Historic Rehabilitation Tax Credit (20%)", "application-prep", "1374 N Greenwood Ave", "a.bell@communityworks.org", 18),
];

let requests: AssistanceRequest[] = [...SEEDED];
const listeners = new Set<() => void>();
let seq = 0;

export function listAssistanceRequests(): AssistanceRequest[] {
  return requests;
}

export function recordAssistanceRequest(input: {
  programId: string;
  programName: string;
  type: AssistanceTypeId;
  parcelId?: string | null;
  parcelAddress?: string | null;
  user?: string;
  note?: string;
}): AssistanceRequest {
  seq += 1;
  const record: AssistanceRequest = {
    id: `req-${Date.now()}-${seq}`,
    programId: input.programId,
    programName: input.programName,
    type: input.type,
    parcelId: input.parcelId ?? null,
    parcelAddress: input.parcelAddress ?? null,
    user: input.user ?? CURRENT_USER,
    at: new Date().toISOString(),
    source: "session",
  };
  if (input.note && input.note.trim()) record.note = input.note.trim();
  requests = [record, ...requests];
  listeners.forEach((fn) => fn());
  return record;
}

export function subscribeAssistanceRequests(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* --------------------------------- KPIs ---------------------------------- */

export type AssistanceKpis = {
  total: number;
  uniqueUsers: number;
  sessions: number;
  /** Share of observed sessions that produced at least one request. */
  requestRate: number;
  byProgram: { programId: string; programName: string; count: number }[];
  byType: { type: AssistanceTypeId; label: string; count: number }[];
  recent: AssistanceRequest[];
};

export function assistanceKpis(
  list: AssistanceRequest[] = requests,
): AssistanceKpis {
  const programs = new Map<string, { programName: string; count: number }>();
  const types = new Map<AssistanceTypeId, number>();
  const users = new Set<string>();

  for (const r of list) {
    users.add(r.user);
    const prev = programs.get(r.programId);
    programs.set(r.programId, {
      programName: r.programName,
      count: (prev?.count ?? 0) + 1,
    });
    types.set(r.type, (types.get(r.type) ?? 0) + 1);
  }

  return {
    total: list.length,
    uniqueUsers: users.size,
    sessions: SESSIONS_OBSERVED,
    requestRate: users.size / SESSIONS_OBSERVED,
    byProgram: [...programs.entries()]
      .map(([programId, v]) => ({ programId, programName: v.programName, count: v.count }))
      .sort((a, b) => b.count - a.count),
    byType: ASSISTANCE_TYPES.map((t) => ({
      type: t.id,
      label: t.label,
      count: types.get(t.id) ?? 0,
    })).sort((a, b) => b.count - a.count),
    recent: [...list]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 12),
  };
}

export function formatRequestedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
