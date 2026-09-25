/**
 * How and when money from a funding program actually reaches the developer.
 * Every program carries one of these. Timing copy is mock but realistic.
 */

export type DisbursementId =
  | "cash-up-front"
  | "reimbursement"
  | "tax-credit-equity"
  | "tax-increment"
  | "loan"
  | "forgivable-loan"
  | "tenant-based"
  | "unit-based"
  | "technical-assistance";

export type CashFlowGroup = "up-front" | "reimbursed" | "over-time" | "no-capital";

export type DisbursementMeta = {
  id: DisbursementId;
  label: string;
  /** Short definition of the mechanism. */
  summary: string;
  group: CashFlowGroup;
  /** Tailwind classes for the badge. Distinct per mechanism. */
  badgeClass: string;
  /** Small leading glyph, so the badge reads at a glance without color alone. */
  glyph: string;
};

export const DISBURSEMENTS: Record<DisbursementId, DisbursementMeta> = {
  "cash-up-front": {
    id: "cash-up-front",
    label: "Cash up front",
    summary: "Funds advanced at or before closing.",
    group: "up-front",
    badgeClass: "border-primary bg-primary text-primary-foreground",
    glyph: "▲",
  },
  reimbursement: {
    id: "reimbursement",
    label: "Reimbursement",
    summary: "Spend first, document, then get repaid.",
    group: "reimbursed",
    badgeClass: "border-accent bg-accent text-accent-foreground",
    glyph: "▼",
  },
  "tax-credit-equity": {
    id: "tax-credit-equity",
    label: "Tax credit equity",
    summary:
      "Credit syndicated to an investor; equity arrives on a pay-in schedule tied to construction milestones.",
    group: "over-time",
    badgeClass: "border-primary bg-secondary text-primary",
    glyph: "◧",
  },
  "tax-increment": {
    id: "tax-increment",
    label: "Tax increment",
    summary: "Repaid over years from incremental tax revenue.",
    group: "over-time",
    badgeClass: "border-accent bg-paper text-accent",
    glyph: "◷",
  },
  loan: {
    id: "loan",
    label: "Loan",
    summary: "Repayable debt.",
    group: "up-front",
    badgeClass: "border-foreground bg-paper text-foreground",
    glyph: "＄",
  },
  "forgivable-loan": {
    id: "forgivable-loan",
    label: "Forgivable loan",
    summary: "Debt forgiven if conditions are met.",
    group: "up-front",
    badgeClass: "border-primary bg-paper text-primary",
    glyph: "◇",
  },
  "tenant-based": {
    id: "tenant-based",
    label: "Tenant-based payment",
    summary: "Follows the household, paid monthly.",
    group: "over-time",
    badgeClass: "border-border bg-secondary text-muted-foreground",
    glyph: "◌",
  },
  "unit-based": {
    id: "unit-based",
    label: "Unit-based payment",
    summary: "Attached to the unit under contract.",
    group: "over-time",
    badgeClass: "border-border bg-paper text-foreground",
    glyph: "◍",
  },
  "technical-assistance": {
    id: "technical-assistance",
    label: "Technical assistance",
    summary: "No capital.",
    group: "no-capital",
    badgeClass: "border-dashed border-border bg-paper text-muted-foreground",
    glyph: "○",
  },
};

export const CASH_FLOW_GROUPS: Record<CashFlowGroup, { label: string; blurb: string }> = {
  "up-front": {
    label: "Arrives up front",
    blurb: "Available at or near closing, before construction costs are incurred.",
  },
  reimbursed: {
    label: "Reimbursed after you spend",
    blurb: "You carry the cost, document it, and are repaid on a draw cycle.",
  },
  "over-time": {
    label: "Arrives over time",
    blurb: "Paid on a schedule tied to milestones, occupancy, or tax collections.",
  },
  "no-capital": {
    label: "No capital",
    blurb: "Support that does not add dollars to the capital stack.",
  },
};

export const CASH_FLOW_ORDER: CashFlowGroup[] = [
  "up-front",
  "reimbursed",
  "over-time",
  "no-capital",
];
