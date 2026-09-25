import { useEffect, useMemo, useState } from "react";
import { buildParcelReport } from "@/lib/parcel-report";
import type { Parcel, ProgramStatus } from "@/lib/tulsa-map-data";
import type { Task } from "@/lib/tasks";
import {
  Cite,
  CiteStack,
  CitationScope,
  CoverageBar,
  CoverageLegend,
  LevelFilterControl,
  LevelFilterScope,
  ReferenceList,
  type LevelFilterValue,
} from "@/components/citation";
import { CashFlowSummary, DisbursementDetail } from "@/components/disbursement";
import { ContactBlock, ContactDisclaimer } from "@/components/contact-block";
import { contactById } from "@/lib/contacts";
import { ComplexityNote } from "@/components/complexity";
import { ReportAssistanceInterest } from "@/components/report-assistance";
import { PROGRAM_COVERAGE, PROGRAM_REQUIREMENTS } from "@/lib/jurisdictions";
import { zoningSourceIds } from "@/lib/citations";
import { UnderwritingLimits } from "@/components/underwriting";
import { UNDERWRITING_CITATIONS } from "@/lib/underwriting";
import { CostSavers } from "@/components/cost-savers";
import { COST_SAVER_CITATION_IDS } from "@/lib/cost-savers";
import { OrgFitNote, StatusGates } from "@/components/org-status";
import { ORG_CITATION_IDS, ORG_TYPE_LABEL, type OrgType } from "@/lib/org-status";
import { groupByTier } from "@/lib/accessibility";
import {
  AccessModelLine,
  AccessPath,
  EffortVsAward,
  RelationshipSources,
  TierHeading,
  WhereToFocus,
  WhyNotTierOne,
} from "@/components/accessibility";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function statusClass(status: ProgramStatus) {
  if (status === "Likely eligible") return "border-primary bg-primary text-primary-foreground";
  if (status === "May be eligible") return "border-accent text-accent";
  return "border-border text-muted-foreground";
}

export function ReportPreview({
  parcel,
  tasks,
  orgType = null,
  open,
  onClose,
}: {
  parcel: Parcel | null;
  tasks: Task[];
  orgType?: OrgType | null;
  open: boolean;
  onClose: () => void;
}) {
  const [levelFilter, setLevelFilter] = useState<LevelFilterValue>("all");
  const report = useMemo(() => (parcel ? buildParcelReport(parcel, tasks) : null), [parcel, tasks]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !report) return null;

  const tierGroups = groupByTier(report.programs, orgType);

  const { parcel: p, zoningSummary: z } = report;
  const zc = zoningSourceIds(p.zoning);
  const reportCitationIds = [
    ...report.citationIds,
    ...report.programs.flatMap((prog) =>
      (PROGRAM_REQUIREMENTS[prog.id] ?? []).flatMap((r) => r.sourceIds),
    ),
    ...UNDERWRITING_CITATIONS,
    ...COST_SAVER_CITATION_IDS,
    ...ORG_CITATION_IDS,
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-foreground/40 px-4 py-8">
      <div className="relative w-full max-w-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border border-border bg-paper px-5 py-3 rounded-lg">
          <span className="rule-label">Report preview — {p.address}</span>
          <button
            onClick={onClose}
            className="border border-border px-3 py-1 tabular-nums text-xs text-muted-foreground hover:border-accent hover:text-accent rounded-md"
          >
            Close
          </button>
        </div>

        <CitationScope ids={reportCitationIds}>
          <LevelFilterScope value={levelFilter}>
            <div className="border border-t-0 border-border bg-paper">
              {/* ---------------- page 1: free ---------------- */}
              <div className="px-8 py-10 sm:px-12">
                <p className="rule-label">Parcel funding assessment</p>
                <h2 className="mt-3 font-heading font-bold text-3xl leading-tight text-foreground">
                  {p.address}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tulsa, Oklahoma · Prepared {report.preparedOn} · Collective Impact
                </p>

                <ReportSection title="1. Parcel summary">
                  <dl className="divide-y divide-border border-y border-border">
                    <Row label="Address" value={p.address} citeId="assessor-record" />
                    <Row label="Parcel ID" value={p.parcelId} mono citeId="assessor-record" />
                    <Row
                      label="Acreage"
                      value={`${p.acreage.toFixed(2)} acres`}
                      citeId="assessor-record"
                    />
                    <Row label="Zoning" value={z.label} citeId={zc.district} />
                    <Row
                      label="Assessed value"
                      value={currency.format(p.assessedValue)}
                      mono
                      citeId="assessor-value"
                    />
                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2.5">
                      <dt className="rule-label pt-0.5">Overlays</dt>
                      <dd className="text-sm leading-relaxed text-foreground">
                        {report.overlays.length ? (
                          report.overlays.map((o, i) => (
                            <span key={o.id}>
                              {i > 0 && "; "}
                              {o.short} — {o.name}
                              <Cite id={`ov-${o.id}`} />
                            </span>
                          ))
                        ) : (
                          <>None of the mapped overlays intersect this parcel.</>
                        )}
                      </dd>
                    </div>
                    <Row label="Permitted" value={z.permitted.join(", ")} citeId={zc.uses} />
                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2.5">
                      <dt className="rule-label pt-0.5">Height / lot</dt>
                      <dd className="text-sm leading-relaxed text-foreground">
                        {z.maxHeight}
                        <Cite id={zc.height} /> · {z.minLot}
                        <Cite id={zc.lot} />
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
                    Zoning figures are preliminary. Confirm dimensional standards and platting
                    requirements with the City of Tulsa Planning Office before relying on them.
                  </p>
                </ReportSection>

                <ReportSection title="2. Where to focus">
                  <WhereToFocus items={tierGroups[0]!.items} org={orgType} />
                </ReportSection>

                <ReportSection title="3. Funding sources by how reachable they are">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Eligibility says the parcel qualifies. These tiers say whether your organization
                    can realistically get the money, in what timeframe, and at what effort. Nothing
                    has been removed — hard-to-reach sources sit lower with the reason attached.
                  </p>
                  <LevelFilterControl
                    value={levelFilter}
                    onChange={setLevelFilter}
                    className="mb-4 mt-4"
                  />
                  <CoverageLegend className="mb-4" />
                  {tierGroups.map((group) => (
                    <div key={group.tier} className="mb-6">
                      <TierHeading tier={group.tier} count={group.items.length} />
                      {group.items.length === 0 && (
                        <p className="border-y border-border py-3 text-sm leading-relaxed text-muted-foreground">
                          Nothing on this parcel falls in this tier for your organization.
                        </p>
                      )}
                      <ul>
                        {group.items.map(({ item: prog, assessment }) => {
                          const coverage = PROGRAM_COVERAGE[prog.id];
                          const requirements = PROGRAM_REQUIREMENTS[prog.id] ?? [];
                          return (
                            <li key={prog.id} className="border-b border-border py-4">
                              <div className="grid grid-cols-[minmax(0,1fr)_13rem] gap-4">
                                <div>
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">
                                        {prog.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{prog.agency}</p>
                                    </div>
                                    <span
                                      className={`shrink-0 border px-2 py-0.5 text-[11px] leading-tight ${statusClass(prog.status)} rounded-md`}
                                    >
                                      {prog.status}
                                    </span>
                                  </div>
                                  <AccessModelLine assessment={assessment} className="mt-2" />
                                  <AccessPath assessment={assessment} className="mt-3" />
                                  <WhyNotTierOne assessment={assessment} className="mt-3" />
                                  <EffortVsAward assessment={assessment} className="mt-3" />
                                  {coverage && <CoverageBar coverage={coverage} className="mt-3" />}
                                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {prog.reason}
                                    <Cite id={prog.sourceId} />
                                  </p>
                                  {requirements.map((r) => (
                                    <div
                                      key={r.claim}
                                      className="mt-3 border-l-2 border-primary pl-3"
                                    >
                                      <p className="rule-label">Governed at multiple levels</p>
                                      <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                                        {r.claim}
                                        <CiteStack ids={r.sourceIds} />
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <DisbursementDetail id={prog.disbursement} timing={prog.timing} />
                              </div>
                              <ComplexityNote programId={prog.id} className="mt-3" />
                              <div className="mt-3">
                                <OrgFitNote programId={prog.id} org={orgType} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {group.tier === 3 && <RelationshipSources className="mt-4" />}
                    </div>
                  ))}
                </ReportSection>
              </div>

              {/* ---------------- locked remainder ---------------- */}
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none select-none px-8 pb-16 blur-[5px] sm:px-12"
                >
                  <ReportSection title="4. Organizational status gates">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {orgType
                        ? `Marked against your organization type: ${ORG_TYPE_LABEL[orgType].toLowerCase()}.`
                        : "No organization type selected, so every designation is shown in full."}
                    </p>
                    <StatusGates org={orgType} className="mt-4" />
                  </ReportSection>

                  <ReportSection title="5. Cost and time savers">
                    <CostSavers parcel={p} />
                  </ReportSection>

                  <ReportSection title="6. Underwriting limits">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      The income, rent, voucher, and utility figures a lender will ask for, for this
                      parcel's metropolitan area — with the binding limit called out when programs
                      are layered.
                    </p>
                    <UnderwritingLimits programs={report.programs} className="mt-4" />
                  </ReportSection>

                  <ReportSection title="7. Cash flow summary">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Eligibility says whether a source is open to you. This says when its money is
                      in your account.
                    </p>
                    <CashFlowSummary programs={report.programs} className="mt-4" />
                  </ReportSection>

                  <ReportSection title="8. Sequenced next steps">
                    <ol className="border-t border-border">
                      {report.steps.map((s) => (
                        <li key={s.order} className="border-b border-border py-4">
                          <div className="flex gap-4">
                            <span className="tabular-nums text-xs text-accent">
                              {String(s.order).padStart(2, "0")}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{s.title}</p>
                              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                {s.detail}
                                {s.sourceId && <Cite id={s.sourceId} />}
                              </p>
                              <p className="mt-1 tabular-nums text-[11px] text-muted-foreground">
                                {s.owner} · {s.timing}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </ReportSection>

                  <ReportSection title="9. Who to contact">
                    <ul className="space-y-3">
                      {report.contacts.map((c) => {
                        const record = c.contactId ? contactById(c.contactId) : null;
                        return (
                          <li key={c.department}>
                            {record ? (
                              <ContactBlock contact={record}>{c.note}</ContactBlock>
                            ) : (
                              <div className="border border-border px-3 py-2 rounded-lg">
                                <p className="text-sm font-medium text-foreground">
                                  {c.department}
                                </p>
                                <p className="text-xs text-muted-foreground">{c.role}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
                              </div>
                            )}
                            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                              <span className="rule-label mr-2">Role</span>
                              {c.role}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                    <ContactDisclaimer className="mt-3" />
                  </ReportSection>

                  <ReportSection title="10. Key dates and deadlines">
                    <dl className="divide-y divide-border border-y border-border">
                      {report.dates.map((d) => (
                        <div
                          key={d.label}
                          className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3"
                        >
                          <dt className="tabular-nums text-xs text-accent">{d.date}</dt>
                          <dd>
                            <p className="text-sm text-foreground">{d.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {d.detail}
                              {d.sourceId && <Cite id={d.sourceId} />}
                            </p>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </ReportSection>

                  <ReportSection title="11. Citations">
                    <ReferenceList title="Full reference list" />
                  </ReportSection>
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-paper/40 via-paper/90 to-paper" />

                <Paywall />
              </div>

              <ReportAssistanceInterest
                programs={report.programs.filter((p) => p.status !== "Not eligible")}
                parcelId={parcel?.parcelId ?? null}
                parcelAddress={parcel?.address ?? null}
                className="mt-10"
              />
            </div>
          </LevelFilterScope>
        </CitationScope>
      </div>
    </div>
  );
}

function Paywall() {
  return (
    <div className="absolute inset-x-0 bottom-0 top-16 flex items-start justify-center px-6 pb-10">
      <div className="w-full max-w-2xl border border-border shadow-panel bg-paper p-6 sm:p-8 rounded-2xl">
        <p className="rule-label">Continue reading</p>
        <h3 className="mt-2 font-heading font-bold text-2xl leading-snug text-foreground">
          Action plans for the remaining programs, the stacking analysis, and the saved parcel
          dashboard.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your free action plan covers one program end to end, and the tasks it generated are
          already on your list. A subscription opens the action plans for every other eligible
          program on this parcel, the stacking analysis showing how those programs combine, and the
          dashboard that keeps each parcel you research.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1.15fr_1fr]">
          <div className="border border-accent/20 bg-accent/5 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="rule-label">Monthly subscription</span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">
                Recommended
              </span>
            </div>
            <p className="mt-3 tabular-nums text-lg text-primary-deep">
              [PRICE PLACEHOLDER] / month
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground">
              <li className="flex gap-2">
                <span className="text-primary-deep">▪</span> Action plans for every eligible program
              </li>
              <li className="flex gap-2">
                <span className="text-primary-deep">▪</span> Stacking analysis and saved parcel
                dashboard
              </li>
              <li className="flex gap-2">
                <span className="text-primary-deep">▪</span> Unlimited chat questions
              </li>
            </ul>
            <button className="mt-5 w-full border border-primary bg-primary px-4 py-3 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary-hover rounded-md">
              Start subscription
            </button>
          </div>

          <div className="border border-border bg-paper p-5 rounded-2xl">
            <span className="rule-label">One-time report</span>
            <p className="mt-3 tabular-nums text-lg text-foreground">[PRICE PLACEHOLDER] once</p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">▫</span> This parcel only
              </li>
              <li className="flex gap-2">
                <span className="text-accent">▫</span> Downloadable PDF
              </li>
              <li className="flex gap-2">
                <span className="text-accent">▫</span> No account required
              </li>
            </ul>
            <button className="mt-5 w-full border border-accent px-4 py-3 text-sm font-medium tracking-wide text-accent transition-colors hover:bg-secondary rounded-md">
              Buy this report
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Prototype — pricing is a placeholder and no payment is processed.
        </p>
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h3 className="rule-label border-b border-border pb-2">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  citeId,
}: {
  label: string;
  value: string;
  mono?: boolean;
  citeId?: string;
}) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2.5">
      <dt className="rule-label pt-0.5">{label}</dt>
      <dd className={`text-sm leading-relaxed text-foreground ${mono ? "tabular-nums" : ""}`}>
        {value}
        {citeId && <Cite id={citeId} />}
      </dd>
    </div>
  );
}
