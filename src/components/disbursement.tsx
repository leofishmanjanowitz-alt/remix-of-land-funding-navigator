import {
  CASH_FLOW_GROUPS,
  CASH_FLOW_ORDER,
  DISBURSEMENTS,
  type CashFlowGroup,
  type DisbursementId,
} from "@/lib/disbursement";

export function DisbursementBadge({
  id,
  className = "",
}: {
  id: DisbursementId;
  className?: string;
}) {
  const d = DISBURSEMENTS[id];
  return (
    <span
      title={d.summary}
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] leading-tight tracking-wide ${d.badgeClass} ${className}`}
    >
      <span aria-hidden className="font-mono text-[10px]">
        {d.glyph}
      </span>
      {d.label}
    </span>
  );
}

export function DisbursementDetail({
  id,
  timing,
  className = "",
}: {
  id: DisbursementId;
  timing: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <DisbursementBadge id={id} />
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{timing}</p>
    </div>
  );
}

/** Working-capital picture for a stack of programs. */
export function CashFlowSummary({
  programs,
  className = "",
}: {
  programs: { id: string; name: string; disbursement: DisbursementId; timing: string }[];
  className?: string;
}) {
  const byGroup = CASH_FLOW_ORDER.map((g) => ({
    group: g,
    items: programs.filter((p) => DISBURSEMENTS[p.disbursement].group === g),
  })).filter((row) => row.items.length > 0);

  const reimbursed = programs.filter(
    (p) => DISBURSEMENTS[p.disbursement].group === "reimbursed",
  );

  return (
    <div className={className}>
      <dl className="border-t border-border">
        {byGroup.map(({ group, items }) => (
          <div key={group} className="grid gap-2 border-b border-border py-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
            <dt>
              <p className="rule-label">{CASH_FLOW_GROUPS[group as CashFlowGroup].label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {CASH_FLOW_GROUPS[group as CashFlowGroup].blurb}
              </p>
            </dt>
            <dd className="space-y-3">
              {items.map((p) => (
                <div key={p.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <DisbursementBadge id={p.disbursement} />
                    <span className="text-sm text-foreground">{p.name}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.timing}</p>
                </div>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
        {reimbursed.length
          ? `Reimbursement sources (${reimbursed
              .map((p) => p.name)
              .join(", ")}) pay nothing at closing. You must carry those costs yourself — through equity, a bridge loan, or a construction line — and wait out the draw review before the money comes back. Size your working capital for the largest gap, not the average one.`
          : "No reimbursement sources are in this stack, so you are not carrying costs waiting on draw reviews. Confirm each commitment letter before assuming funds arrive at closing."}
      </p>
    </div>
  );
}
