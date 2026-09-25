import { useState } from "react";
import {
  ACCESS_MODELS,
  DIMENSION_LABEL,
  RELATIONSHIP_SOURCES,
  TIERS,
  focusOrder,
  focusRationale,
  type AccessAssessment,
  type Tier,
} from "@/lib/accessibility";
import { ORG_TYPE_LABEL, type OrgType } from "@/lib/org-status";
import type { Program } from "@/lib/tulsa-map-data";

const tierClass: Record<Tier, string> = {
  1: "border-primary bg-primary text-primary-foreground",
  2: "border-primary text-primary",
  3: "border-border text-muted-foreground",
};

export function TierBadge({ tier, className = "" }: { tier: Tier; className?: string }) {
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-[11px] leading-tight ${tierClass[tier]} ${className}`}
    >
      Tier {tier} — {TIERS[tier].label}
    </span>
  );
}

export function TierHeading({ tier, count }: { tier: Tier; count: number }) {
  return (
    <div className="border-t-2 border-primary pt-3 pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-serif text-lg leading-snug text-primary">{TIERS[tier].label}</h4>
        <span className="font-mono text-xs text-muted-foreground">
          {count} {count === 1 ? "source" : "sources"}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{TIERS[tier].blurb}</p>
    </div>
  );
}

export function AccessModelLine({
  assessment,
  className = "",
}: {
  assessment: AccessAssessment;
  className?: string;
}) {
  if (!assessment.profile) return null;
  const m = ACCESS_MODELS[assessment.profile.model];
  return (
    <p className={`text-xs leading-relaxed text-muted-foreground ${className}`}>
      <span className="rule-label mr-2">Access model</span>
      {m.label} — {m.blurb}
    </p>
  );
}

export function AccessPath({
  assessment,
  className = "",
}: {
  assessment: AccessAssessment;
  className?: string;
}) {
  if (assessment.tier === 1 || !assessment.path) return null;
  return (
    <div className={`border-l-2 border-accent pl-3 ${className}`}>
      <p className="rule-label">What stands in the way</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{assessment.path}</p>
    </div>
  );
}

export function EffortVsAward({
  assessment,
  className = "",
}: {
  assessment: AccessAssessment;
  className?: string;
}) {
  if (!assessment.effortVsAward) return null;
  return (
    <p className={`border-l-2 border-accent pl-3 text-xs leading-relaxed text-accent ${className}`}>
      <span className="rule-label mr-2">Effort vs. award</span>
      {assessment.effortVsAward}
    </p>
  );
}

export function WhyNotTierOne({
  assessment,
  className = "",
}: {
  assessment: AccessAssessment;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (assessment.tier === 1) return null;
  return (
    <div className={className}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="font-mono text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
      >
        {open ? "Hide the assessment" : "Why is this not tier one?"}
      </button>
      {open && (
        <dl className="mt-2 divide-y divide-border border-y border-border">
          {assessment.readings.map((r) => (
            <div key={r.dimension} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-2.5">
              <dt className="rule-label pt-0.5">
                {DIMENSION_LABEL[r.dimension]}
                {r.constraining && (
                  <span className="mt-1 block font-mono text-[10px] normal-case text-accent">
                    constraint
                  </span>
                )}
              </dt>
              <dd className="text-sm leading-relaxed text-foreground">
                <span className={r.constraining ? "text-accent" : "text-foreground"}>{r.value}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {r.detail}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function AssumedOrgNote({
  org,
  className = "",
}: {
  org: OrgType | null;
  className?: string;
}) {
  return (
    <p
      className={`border border-dashed border-accent px-3 py-2 text-xs leading-relaxed ${
        org ? "text-muted-foreground" : "text-accent"
      } ${className}`}
    >
      {org ? (
        <>
          Tiering is assessed against your organization type:{" "}
          {ORG_TYPE_LABEL[org].toLowerCase()}. Change it above and the tiers re-sort.
        </>
      ) : (
        <>
          No organization type given, so the tiering below assumes the most common case — a
          nonprofit developer. Tell us your organization type above for an accurate assessment;
          organizational gates move sources between tiers.
        </>
      )}
    </p>
  );
}

/** Relationship-dependent capital that has no parcel test at all. */
export function RelationshipSources({ className = "" }: { className?: string }) {
  return (
    <ul className={`border-y border-border ${className}`}>
      {RELATIONSHIP_SOURCES.map((s) => (
        <li key={s.id} className="border-b border-border py-4 last:border-b-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium leading-snug text-foreground">{s.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.agency}</p>
            </div>
            <span className="shrink-0 border border-border px-2 py-0.5 text-[11px] leading-tight text-muted-foreground">
              {ACCESS_MODELS[s.model].label}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.what}</p>
          <div className="mt-2 border-l-2 border-accent pl-3">
            <p className="rule-label">What stands in the way</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{s.path}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** "Where to focus" — the tier-one list, in priority order, for the report. */
export function WhereToFocus({
  items,
  org,
  className = "",
}: {
  items: { item: Program; assessment: AccessAssessment }[];
  org: OrgType | null;
  className?: string;
}) {
  const ordered = focusOrder(items);
  return (
    <div className={className}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Not "what am I eligible for" but "what should I do first." These are the sources your
        organization can realistically pursue on this parcel now — open or competitive application,
        no designation or partnership in the way, and a timeline that fits a normal project
        schedule. They are listed in the order we would work them.
      </p>
      <AssumedOrgNote org={org} className="mt-3" />
      {ordered.length === 0 ? (
        <p className="mt-4 border-l-2 border-accent pl-3 text-sm leading-relaxed text-foreground">
          Nothing on this parcel clears tier one for your organization as it stands today. That is a
          finding, not a gap in the data: every source below needs a designation, a partnership, a
          specialist, or a relationship first. Start with the tier-two entry whose obstacle is
          cheapest to remove.
        </p>
      ) : (
        <ol className="mt-4 border-y border-border">
          {ordered.map(({ item, assessment }, i) => (
            <li key={item.id} className="border-b border-border py-3 last:border-b-0">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs text-accent">{i + 1}.</span>
                <div>
                  <p className="text-sm font-medium leading-snug text-foreground">{item.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {focusRationale(item, assessment)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
