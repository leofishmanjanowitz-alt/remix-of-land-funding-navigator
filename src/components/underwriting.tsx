import { useState } from "react";
import { Cite, CiteStack } from "@/components/citation";
import {
  AREA,
  BANDS,
  BAND_LABEL,
  CURRENCY_CAVEAT,
  FMR,
  HOUSEHOLD_SIZES,
  INCOME_LIMITS,
  PAYMENT_STANDARD,
  PROGRAM_LIMITS,
  RENT_LIMITS,
  RENT_NOTE,
  UNIT_LABEL,
  UNIT_SIZES,
  UTILITY_ALLOWANCE,
  UTILITY_NOTE,
  bindingLimit,
  type Band,
} from "@/lib/underwriting";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export type UnderwritingProgram = { id: string; name: string };

export function UnderwritingLimits({
  programs,
  className = "",
}: {
  programs: UnderwritingProgram[];
  className?: string;
}) {
  const selectable = programs.filter((p) => PROGRAM_LIMITS[p.id]);
  const [selected, setSelected] = useState<string[]>(() => selectable.slice(0, 2).map((p) => p.id));
  const active = selected.filter((id) => selectable.some((p) => p.id === id));
  const binding = bindingLimit(active);
  const bindingBand = binding.band;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const nameOf = (id: string) => selectable.find((p) => p.id === id)?.name ?? id;

  return (
    <div className={className}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Limits for the {AREA.name} — {AREA.counties}. Area median family income for a four-person
        household is {money.format(AREA.medianFamilyIncome)}.
        <Cite id="ul-section8-il" />
      </p>

      {/* --------------------------- program overlay --------------------------- */}
      <div className="mt-5 border border-accent/20 bg-accent/5 p-4 rounded-2xl">
        <p className="rule-label">Which limits bind for your stack</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectable.map((p) => {
            const on = active.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                aria-pressed={on}
                className={`border px-2 py-1 text-[11px] leading-tight transition-colors ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-accent hover:text-accent"
                } rounded-md`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground">{binding.note}</p>
        {bindingBand && (
          <p className="mt-2 tabular-nums text-sm text-primary-deep">
            Binding income limit: {BAND_LABEL[bindingBand]} —{" "}
            {binding.drivenBy.map(nameOf).join(", ")}
          </p>
        )}

        <dl className="mt-3 divide-y divide-border border-t border-border">
          {active.map((id) => {
            const set = PROGRAM_LIMITS[id]!;
            return (
              <div key={id} className="py-2.5">
                <dt className="text-sm font-medium text-foreground">
                  {nameOf(id)}
                  <CiteStack ids={set.sourceIds} />
                </dt>
                <dd className="mt-0.5 text-xs text-muted-foreground">Reads from: {set.table}</dd>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {set.incomeRule}
                </dd>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {set.rentRule ?? "No program rent limit."}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      {/* ---------------------------- income limits ---------------------------- */}
      <LimitTable
        title="Income limits by household size"
        effective={`Effective ${AREA.limitsEffective} · FY ${AREA.limitYear} schedule`}
        citeId="ul-section8-il"
        firstColumn="Household"
        columns={BANDS.map((b) => BAND_LABEL[b])}
        highlightColumn={bindingBand ? BANDS.indexOf(bindingBand) : -1}
        rows={INCOME_LIMITS.map((r) => ({
          key: String(r.size),
          label: `${r.size} ${r.size === 1 ? "person" : "persons"}`,
          cells: BANDS.map((b) => money.format(r.values[b])),
        }))}
      >
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Tax credit units read from the separate Multifamily Tax Subsidy Project series, which can
          differ from the Section 8 limits shown here.
          <Cite id="ul-mtsp" />
        </p>
      </LimitTable>

      {/* ----------------------------- rent limits ----------------------------- */}
      <LimitTable
        title="Maximum gross rents by unit size"
        effective={`Effective ${AREA.limitsEffective} · FY ${AREA.limitYear} schedule`}
        citeId="ul-home-rent"
        firstColumn="Unit"
        columns={BANDS.map((b) => BAND_LABEL[b])}
        highlightColumn={bindingBand ? BANDS.indexOf(bindingBand) : -1}
        rows={RENT_LIMITS.map((r) => ({
          key: r.unit,
          label: UNIT_LABEL[r.unit],
          cells: BANDS.map((b) => money.format(r.values[b])),
        }))}
      >
        <p className="mt-3 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
          {RENT_NOTE}
          <Cite id="ul-tha-ua" />
        </p>
      </LimitTable>

      {/* ------------------------- payment standards --------------------------- */}
      <LimitTable
        title="Voucher payment standards vs. Fair Market Rent"
        effective={`Payment standards effective ${AREA.paymentStandardEffective} · FMR effective ${AREA.fmrEffective}`}
        citeId="ul-tha-ps"
        firstColumn="Unit"
        columns={["Payment standard", "Fair Market Rent", "Difference"]}
        rows={UNIT_SIZES.map((u) => {
          const diff = PAYMENT_STANDARD[u] - FMR[u];
          return {
            key: u,
            label: UNIT_LABEL[u],
            cells: [
              money.format(PAYMENT_STANDARD[u]),
              money.format(FMR[u]),
              `${diff >= 0 ? "+" : "−"}${money.format(Math.abs(diff))}`,
            ],
          };
        })}
      >
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          The payment standard is what the Tulsa Housing Authority will pay toward a voucher
          holder's rent; the Fair Market Rent is the federal benchmark it is derived from.
          <Cite id="ul-fmr" /> A unit priced above the payment standard is reachable only if the
          household absorbs the difference and stays within the 40% initial rent burden cap.
        </p>
      </LimitTable>

      {/* --------------------------- utility allowance -------------------------- */}
      <LimitTable
        title="Utility allowance schedule"
        effective={`Effective ${AREA.utilityAllowanceEffective}`}
        citeId="ul-tha-ua"
        firstColumn="Unit"
        columns={["Monthly allowance", "60% AMI collectible rent"]}
        rows={UNIT_SIZES.map((u) => {
          const gross = RENT_LIMITS.find((r) => r.unit === u)!.values["60" as Band];
          return {
            key: u,
            label: UNIT_LABEL[u],
            cells: [money.format(UTILITY_ALLOWANCE[u]), money.format(gross - UTILITY_ALLOWANCE[u])],
          };
        })}
      >
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{UTILITY_NOTE}</p>
      </LimitTable>
    </div>
  );
}

function LimitTable({
  title,
  effective,
  citeId,
  firstColumn,
  columns,
  rows,
  highlightColumn = -1,
  children,
}: {
  title: string;
  effective: string;
  citeId: string;
  firstColumn: string;
  columns: string[];
  rows: { key: string; label: string; cells: string[] }[];
  highlightColumn?: number;
  children?: React.ReactNode;
}) {
  return (
    <section className="mt-6 border border-border bg-paper p-4 rounded-2xl">
      <h4 className="text-sm font-medium text-foreground">
        {title}
        <Cite id={citeId} />
      </h4>
      <p className="mt-1 tabular-nums text-[11px] uppercase tracking-wide text-accent">
        {effective}
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="rule-label py-1.5 text-left">{firstColumn}</th>
              {columns.map((c, i) => (
                <th
                  key={c}
                  className={`rule-label py-1.5 text-right ${
                    i === highlightColumn ? "text-primary-deep" : ""
                  }`}
                >
                  {c}
                  {i === highlightColumn ? " ◂" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-border last:border-b-0">
                <td className="py-1.5 text-left text-foreground">{r.label}</td>
                {r.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={`py-1.5 text-right tabular-nums text-[13px] ${
                      i === highlightColumn ? "bg-secondary text-primary-deep" : "text-foreground"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {children}

      <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="rule-label">Currency caveat</span> — {CURRENCY_CAVEAT}
      </p>
    </section>
  );
}
