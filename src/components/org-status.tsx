import { CiteStack } from "@/components/citation";
import {
  ORG_TYPES,
  ORG_TYPE_LABEL,
  gatesFor,
  orgFitFor,
  statusGate,
  type OrgFit,
  type OrgType,
  type StatusGate,
} from "@/lib/org-status";

/* --------------------------- organization prompt -------------------------- */

export function OrgProfilePrompt({
  value,
  onChange,
  className = "",
}: {
  value: OrgType | null;
  onChange: (v: OrgType | null) => void;
  className?: string;
}) {
  return (
    <div className={`border border-accent/20 bg-accent/5 px-4 py-4 ${className} rounded-lg`}>
      <p className="rule-label">What kind of organization are you?</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">
        Some funding is unlocked by what an organization is, not by where the parcel is. Tell us the
        organization type and every program below is marked with whether you qualify — and where you
        do not, what partnership or designation would open it.
      </p>
      <div className="mt-3 grid gap-1.5">
        {ORG_TYPES.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(on ? null : o.id)}
              aria-pressed={on}
              className={`border px-3 py-2 text-left transition-colors ${
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-paper hover:border-accent"
              } rounded-md`}
            >
              <span className="block text-sm font-medium leading-snug">{o.label}</span>
              <span
                className={`mt-0.5 block text-xs leading-snug ${on ? "text-primary-foreground/80" : "text-muted-foreground"}`}
              >
                {o.blurb}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        No program is ever hidden because of this answer. Programs you do not currently qualify for
        stay on the list with the path to qualifying.
      </p>
    </div>
  );
}

/* ------------------------------ per-program ------------------------------ */

const FIT_STYLE: Record<OrgFit["level"], string> = {
  qualifies: "border-accent text-accent",
  designation: "border-accent text-accent",
  partner: "border-accent bg-accent text-accent-foreground",
};

export function OrgFitNote({
  programId,
  org,
  className = "",
}: {
  programId: string;
  org: OrgType | null;
  className?: string;
}) {
  const fit = orgFitFor(programId, org);
  if (!org || !fit) return null;
  const gate = fit.gateId ? statusGate(fit.gateId) : null;

  return (
    <div className={`border-l-2 border-border pl-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="rule-label pt-0.5">As a {ORG_TYPE_LABEL[org].toLowerCase()}</p>
        <span
          className={`shrink-0 border px-2 py-0.5 text-[11px] leading-tight ${FIT_STYLE[fit.level]} rounded-md`}
        >
          {fit.label}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">
        {fit.detail}
        {gate && <CiteStack ids={gate.sourceIds} />}
      </p>
    </div>
  );
}

/* ------------------------------ status gates ----------------------------- */

export function StatusGates({ org, className = "" }: { org: OrgType | null; className?: string }) {
  const gates = gatesFor(org);
  return (
    <div className={className}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Designations and entity statuses that open funding independently of the parcel. None of this
        is visible on a map, and missing one is a common reason a project never sees money it could
        have reached.
      </p>
      <ul className="mt-4 border-t border-border">
        {gates.map((g) => (
          <GateRow key={g.id} gate={g} org={org} />
        ))}
      </ul>
      <p className="mt-4 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
        The CHDO reserve is a HOME set-aside. It does not apply to CDBG, and CDBG dollars are not
        part of it.
      </p>
    </div>
  );
}

function GateRow({ gate, org }: { gate: StatusGate; org: OrgType | null }) {
  const open = org ? gate.openTo.includes(org) : null;
  return (
    <li className="border-b border-border py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-foreground">
          {gate.name}
          <CiteStack ids={gate.sourceIds} />
        </p>
        {open !== null && (
          <span
            className={`shrink-0 border px-2 py-0.5 text-[11px] leading-tight ${
              open ? "border-accent text-accent" : "border-border text-muted-foreground"
            } rounded-md`}
          >
            {open ? "Available to you" : "Partnership route"}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{gate.what}</p>

      <p className="rule-label mt-3">Who certifies it</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{gate.certifier}</p>

      <p className="rule-label mt-3">What it unlocks</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{gate.unlocks}</p>

      <p className="rule-label mt-3">What certification involves</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{gate.process}</p>

      {gate.unverified && (
        <p className="mt-3 tabular-nums text-[11px] text-accent">
          Unverified — confirm figures and process against the current regulation.
        </p>
      )}
    </li>
  );
}

/** Compact single-line marker, used where a full note would crowd the row. */
export function OrgFitBadge({ programId, org }: { programId: string; org: OrgType | null }) {
  const fit = orgFitFor(programId, org);
  if (!org || !fit) return null;
  return (
    <span
      className={`border px-1.5 py-0.5 text-[10px] leading-tight ${FIT_STYLE[fit.level]} rounded-md`}
    >
      {fit.label}
    </span>
  );
}
