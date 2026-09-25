import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSource } from "@/lib/citations";
import { COVERAGE_META, LEVELS, LEVEL_META, type Coverage, type Level } from "@/lib/jurisdictions";

type ScopeValue = { numbers: Map<string, number>; ids: string[] };

const CitationContext = createContext<ScopeValue | null>(null);

export type LevelFilterValue = Level | "all";
const FilterContext = createContext<LevelFilterValue>("all");

/**
 * Assigns sequential citation numbers (starting at 1) to the given source ids,
 * in order of first appearance. Wrap a panel or document in one scope.
 */
export function CitationScope({ ids, children }: { ids: string[]; children: ReactNode }) {
  const unique: string[] = [];
  for (const id of ids) if (getSource(id) && !unique.includes(id)) unique.push(id);
  const numbers = new Map(unique.map((id, i) => [id, i + 1]));
  return (
    <CitationContext.Provider value={{ numbers, ids: unique }}>{children}</CitationContext.Provider>
  );
}

export function useCitationScope() {
  return useContext(CitationContext);
}

/** Restricts which citation levels are rendered inside. */
export function LevelFilterScope({
  value,
  children,
}: {
  value: LevelFilterValue;
  children: ReactNode;
}) {
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

/** Segmented control for choosing the jurisdiction level filter. */
export function LevelFilterControl({
  value,
  onChange,
  className = "",
}: {
  value: LevelFilterValue;
  onChange: (v: LevelFilterValue) => void;
  className?: string;
}) {
  const options: { key: LevelFilterValue; label: string }[] = [
    { key: "all", label: "All levels" },
    ...LEVELS.map((l) => ({ key: l as LevelFilterValue, label: LEVEL_META[l].label })),
  ];
  return (
    <div className={className}>
      <p className="rule-label">Filter citations by level</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {options.map((o) => {
          const active = o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              aria-pressed={active}
              title={o.key === "all" ? "Show every level" : LEVEL_META[o.key as Level].blurb}
              className={`border px-2 py-1 tabular-nums text-[11px] tracking-wide transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-accent hover:text-accent"
              } rounded-md`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LevelTag({ level }: { level: Level }) {
  return (
    <span className="border border-accent px-1.5 py-0.5 tabular-nums text-[10px] uppercase tracking-[0.12em] text-accent rounded-md">
      {LEVEL_META[level].label}
    </span>
  );
}

/** Superscript numbered citation marker with hover / tap popover. */
export function Cite({ id }: { id: string }) {
  const scope = useContext(CitationContext);
  const filter = useContext(FilterContext);
  const source = getSource(id);
  const [open, setOpen] = useState(false);
  const [below, setBelow] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  if (!source) return null;
  if (filter !== "all" && source.level !== filter) return null;
  const n = scope?.numbers.get(id);
  if (!n) return null;

  const hold = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const top = wrapRef.current?.getBoundingClientRect().top ?? 0;
    setBelow(top < 320);
    setOpen(true);
  };
  const release = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  return (
    <span ref={wrapRef} className="relative inline" onMouseEnter={hold} onMouseLeave={release}>
      <button
        type="button"
        aria-describedby={open ? popId : undefined}
        aria-expanded={open}
        aria-label={`Citation ${n}, ${LEVEL_META[source.level].label}: ${source.note}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onFocus={hold}
        onBlur={release}
        className="cursor-help align-super tabular-nums text-[0.65em] leading-none text-accent underline decoration-dotted underline-offset-2 hover:text-accent"
      >
        {n}
      </button>
      {open && (
        <span
          id={popId}
          role="tooltip"
          onMouseEnter={hold}
          onMouseLeave={release}
          className={`absolute left-1/2 z-50 block ${below ? "top-full mt-2" : "bottom-full mb-2"}  w-[320px] max-w-[86vw] -translate-x-1/2 rounded-2xl border border-border bg-paper p-4 text-left shadow-popover rounded-md`}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="rule-label">Reference {n}</span>
            <LevelTag level={source.level} />
          </span>
          <span className="mt-2 block font-heading font-bold text-[13px] leading-relaxed text-foreground">
            {source.note}
          </span>
          {source.role && (
            <span className="mt-2 block border-l-2 border-accent pl-2 text-[12px] leading-relaxed text-muted-foreground">
              {source.role}
            </span>
          )}
          <span className="mt-3 block border-t border-border pt-2">
            <span className="rule-label block">Issuing body</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              {source.issuer}
            </span>
          </span>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 inline-block border border-primary bg-primary px-2.5 py-1.5 tabular-nums text-[11px] tracking-wide text-primary-foreground hover:bg-primary-hover rounded-md"
          >
            Open source ↗
          </a>
          <span className="mt-2 block tabular-nums text-[11px] text-muted-foreground">
            Accessed {source.accessed}.
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Stacked citations: one superscript per governing level, in sequence.
 * Each number opens its own popover.
 */
export function CiteStack({ ids }: { ids: string[] }) {
  const filter = useContext(FilterContext);
  const visible = ids.filter((id) => {
    const src = getSource(id);
    return src && (filter === "all" || src.level === filter);
  });
  if (!visible.length) return null;
  return (
    <span className="whitespace-nowrap">
      {visible.map((id, i) => (
        <span key={id}>
          {i > 0 && <span className="align-super text-[0.6em] text-muted-foreground">,</span>}
          <Cite id={id} />
        </span>
      ))}
    </span>
  );
}

/** Four-box indicator showing which levels have sources loaded for a program. */
export function CoverageBar({
  coverage,
  className = "",
}: {
  coverage: Record<Level, Coverage>;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="rule-label mr-1">Coverage</span>
      {LEVELS.map((l) => {
        const state = coverage[l];
        const base =
          "flex h-5 w-5 items-center justify-center tabular-nums text-[10px] leading-none";
        const style =
          state === "loaded"
            ? "border border-primary bg-primary text-primary-foreground"
            : state === "none"
              ? "border border-border bg-secondary text-muted-foreground"
              : "border border-dashed border-accent text-accent";
        return (
          <span
            key={l}
            title={`${LEVEL_META[l].label} — ${COVERAGE_META[state].label}: ${COVERAGE_META[state].detail}`}
            aria-label={`${LEVEL_META[l].label}: ${COVERAGE_META[state].label}`}
            className={`${base} ${style}`}
          >
            {state === "loaded" ? LEVEL_META[l].short : state === "none" ? "–" : "?"}
          </span>
        );
      })}
    </div>
  );
}

/** Key explaining the three coverage states. */
export function CoverageLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-3 w-3 border border-primary bg-primary rounded-sm" /> Source loaded
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-3 w-3 border border-border bg-secondary rounded-sm" /> No requirement at
        this level
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-3 w-3 border border-dashed border-accent rounded-sm" /> Not loaded yet
      </span>
    </div>
  );
}

/**
 * Numbered reference list matching the superscript numbers in the same scope,
 * grouped by level of government.
 */
export function ReferenceList({
  title = "References",
  className = "",
}: {
  title?: string;
  className?: string;
}) {
  const scope = useContext(CitationContext);
  const filter = useContext(FilterContext);
  if (!scope || scope.ids.length === 0) return null;

  const groups = LEVELS.map((level) => ({
    level,
    entries: scope.ids
      .map((id, i) => ({ id, n: i + 1, src: getSource(id)! }))
      .filter((e) => e.src.level === level && (filter === "all" || filter === level)),
  })).filter((g) => g.entries.length > 0);

  if (!groups.length)
    return (
      <div className={className}>
        <p className="rule-label">{title}</p>
        <p className="mt-3 text-[12px] text-muted-foreground">
          No sources at this level are cited here.
        </p>
      </div>
    );

  return (
    <div className={className}>
      <p className="rule-label">{title}</p>
      <div className="mt-3 space-y-5">
        {groups.map((g) => (
          <div key={g.level}>
            <p className="flex items-baseline gap-2 border-b border-border pb-1">
              <span className="font-heading font-bold text-sm text-foreground">
                {LEVEL_META[g.level].label}
              </span>
              <span className="tabular-nums text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {LEVEL_META[g.level].blurb}
              </span>
            </p>
            <ol className="mt-2.5 space-y-2.5">
              {g.entries.map(({ id, n, src }) => (
                <li key={id} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-1">
                  <span className="tabular-nums text-[11px] text-accent">{n}.</span>
                  <span className="text-[12px] leading-relaxed text-muted-foreground">
                    {src.note}{" "}
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="tabular-nums text-[11px] text-primary-deep underline underline-offset-2 hover:text-accent"
                    >
                      Link ↗
                    </a>{" "}
                    Accessed {src.accessed}.
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
