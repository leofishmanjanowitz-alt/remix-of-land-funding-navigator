import { Cite } from "@/components/citation";
import { LEVEL_META } from "@/lib/jurisdictions";
import {
  BUYER_PROVIDERS,
  BUYER_SUMMARY,
  FORM_META,
  RENTER_PROGRAMS,
  RENTER_SUMMARY,
  RENTER_TYPE_META,
  RESIDENT_COVERAGE_NOTE,
} from "@/lib/resident-assistance";

export type FundingView = "development" | "resident";

export function FundingViewTabs({
  value,
  onChange,
  className = "",
}: {
  value: FundingView;
  onChange: (v: FundingView) => void;
  className?: string;
}) {
  const tabs: { id: FundingView; label: string; hint: string }[] = [
    { id: "development", label: "Development funding", hint: "Capital available to the developer" },
    { id: "resident", label: "Resident assistance", hint: "Help for future renters or buyers" },
  ];
  return (
    <div className={`grid grid-cols-2 border border-border ${className}`} role="tablist">
      {tabs.map((t) => {
        const on = value === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`px-3 py-2.5 text-left transition-colors ${
              on
                ? "bg-primary text-primary-foreground"
                : "bg-paper-deep text-muted-foreground hover:text-accent"
            }`}
          >
            <span className="block text-xs font-medium tracking-wide">{t.label}</span>
            <span className={`mt-0.5 block text-[11px] leading-tight ${on ? "opacity-80" : ""}`}>
              {t.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Segmented({
  value,
  onChange,
}: {
  value: "renter" | "buyer";
  onChange: (v: "renter" | "buyer") => void;
}) {
  return (
    <div className="flex border border-border">
      {(["renter", "buyer"] as const).map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={`flex-1 px-3 py-1.5 text-[11px] tracking-wide transition-colors ${
            value === k
              ? "bg-secondary text-primary-deep"
              : "text-muted-foreground hover:text-accent"
          }`}
        >
          {k === "renter" ? "Renter assistance" : "Homebuyer assistance"}
        </button>
      ))}
    </div>
  );
}

export function ResidentAssistance({
  view,
  onViewChange,
}: {
  view: "renter" | "buyer";
  onViewChange: (v: "renter" | "buyer") => void;
}) {
  return (
    <div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Assistance below goes to households, not to the project. It never appears in the development
        capital stack.
      </p>
      <div className="mt-3">
        <Segmented value={view} onChange={onViewChange} />
      </div>

      {view === "renter" ? <RenterView /> : <BuyerView />}

      <p className="mt-4 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
        {RESIDENT_COVERAGE_NOTE}
      </p>
    </div>
  );
}

function RenterView() {
  return (
    <div className="mt-4">
      <p className="border-l-2 border-primary pl-3 text-sm leading-relaxed text-foreground">
        <span className="rule-label block">What this means for your project</span>
        {RENTER_SUMMARY}
      </p>
      <ul className="mt-4 border-y border-border">
        {RENTER_PROGRAMS.map((p) => {
          const meta = RENTER_TYPE_META[p.type];
          return (
            <li key={p.id} className="border-b border-border py-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] leading-tight tracking-wide ${meta.badgeClass} rounded-md`}
                >
                  <span aria-hidden className="tabular-nums text-[10px]">
                    {meta.glyph}
                  </span>
                  {meta.label}
                </span>
                <span className="rule-label">{LEVEL_META[p.level].label}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {p.name}
                <Cite id={p.sourceId} />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.authority}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.amount}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                <span className="rule-label mr-1.5">Means for your project</span>
                {p.meaning}
              </p>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block text-xs text-accent underline underline-offset-2"
              >
                {p.authority} — program page ↗
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BuyerView() {
  return (
    <div className="mt-4">
      <p className="border-l-2 border-primary pl-3 text-sm leading-relaxed text-foreground">
        <span className="rule-label block">What this means for your project</span>
        {BUYER_SUMMARY}
      </p>
      <div className="mt-4 space-y-5">
        {BUYER_PROVIDERS.map((prov) => (
          <div key={prov.id} className="border-t border-border pt-4">
            <h3 className="font-heading font-bold text-lg leading-snug text-foreground">
              {prov.provider}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {prov.kind} · {LEVEL_META[prov.level].label}
            </p>

            {prov.coverage === "gap" || prov.programs.length === 0 ? (
              <p className="mt-3 border border-dashed border-accent px-3 py-2 text-xs leading-relaxed text-accent rounded-lg">
                Not yet loaded — programs from this provider are not in the library. This is not a
                finding that no assistance exists.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {prov.programs.map((p) => (
                  <li key={p.id}>
                    <p className="text-sm font-medium text-foreground">
                      {p.name}
                      <Cite id={p.sourceId} />
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <span
                        className={`border px-2 py-0.5 text-[11px] leading-tight tracking-wide ${FORM_META[p.form].badgeClass} rounded-md`}
                      >
                        {FORM_META[p.form].label}
                      </span>
                    </div>
                    <dl className="mt-2 divide-y divide-border border-y border-border">
                      <div className="grid gap-1 py-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
                        <dt className="rule-label">Amount</dt>
                        <dd className="text-sm leading-relaxed text-muted-foreground">
                          {p.amount}
                        </dd>
                      </div>
                      <div className="grid gap-1 py-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
                        <dt className="rule-label">Recapture</dt>
                        <dd className="text-sm leading-relaxed text-muted-foreground">
                          {p.recapture}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      <span className="rule-label mr-1.5">Means for your project</span>
                      {p.meaning}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <a
              href={prov.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block text-xs text-accent underline underline-offset-2"
            >
              {prov.provider} ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Every resident-assistance source id, so the panel can number them. */
export const RESIDENT_CITATION_IDS = [
  ...RENTER_PROGRAMS.map((p) => p.sourceId),
  ...BUYER_PROVIDERS.flatMap((p) => p.programs.map((x) => x.sourceId)),
];
