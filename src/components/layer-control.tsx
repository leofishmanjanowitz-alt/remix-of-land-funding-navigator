import { useState } from "react";
import { Cite } from "@/components/citation";
import {
  CHOROPLETHS,
  MFI_THRESHOLD,
  POVERTY_THRESHOLD,
  RENT_EFFECTIVE_NOTE,
  RENT_EFFECTIVE_YEAR,
  TRACTS,
  UNEMPLOYMENT_BENCHMARK,
  UNIT_SELECTOR,
  ZIP_AREAS,
  nmtcEligible,
  tractValue,
  zipValue,
  type ChoroplethId,
} from "@/lib/census-layers";
import { LAYERS, type LayerId } from "@/lib/tulsa-map-data";
import { GIS_SOURCES, SNAPSHOT_DATE, isGisLayer, type GisStatus } from "@/lib/tulsa-gis";
import type { UnitSize } from "@/lib/underwriting";

/* ------------------------------ color scales ----------------------------- */

/** Graduated green ramp. fraction 0 = lightest, 1 = darkest. */
export function ramp(fraction: number): string {
  const f = Math.max(0, Math.min(1, fraction));
  return `oklch(${(0.94 - 0.42 * f).toFixed(3)} ${(0.03 + 0.09 * f).toFixed(3)} 165)`;
}

export function choroplethRange(id: ChoroplethId, unit: UnitSize): [number, number] {
  if (id === "nmtc-eligible") return [0, 1];
  if (id === "poverty" || id === "mfi" || id === "unemployment") {
    const vals = TRACTS.map((t) => tractValue(id, t));
    return [Math.min(...vals), Math.max(...vals)];
  }
  const vals = ZIP_AREAS.map((z) => zipValue(id, z, unit));
  return [Math.min(...vals), Math.max(...vals)];
}

export function choroplethColor(id: ChoroplethId, value: number, range: [number, number]): string {
  if (id === "nmtc-eligible") return value ? "var(--color-primary)" : "var(--color-secondary)";
  const [lo, hi] = range;
  const f = hi === lo ? 0.5 : (value - lo) / (hi - lo);
  // For median family income, low values are the qualifying ones — invert.
  return ramp(id === "mfi" ? 1 - f : f);
}

/** True where the value clears the statutory threshold for that measure. */
export function meetsThreshold(id: ChoroplethId, value: number): boolean | null {
  if (id === "poverty") return value >= POVERTY_THRESHOLD;
  if (id === "mfi") return value <= MFI_THRESHOLD;
  if (id === "unemployment") return value >= UNEMPLOYMENT_BENCHMARK;
  if (id === "nmtc-eligible") return value === 1;
  return null;
}

/* ------------------------------- the control ------------------------------ */

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type CatKey = "A" | "B" | "C" | "D";

const CATEGORY_META: Record<CatKey, { label: string; blurb: string }> = {
  A: {
    label: "Funding eligibility geographies",
    blurb: "Designated boundaries that make a parcel eligible.",
  },
  B: {
    label: "Census indicators",
    blurb: "The measures behind the designations, with thresholds.",
  },
  C: { label: "Rent limits and payment standards", blurb: `${RENT_EFFECTIVE_YEAR} schedules.` },
  D: { label: "City of Tulsa zoning overlays", blurb: "What may be built, on top of base zoning." },
};

export function LayerControl({
  active,
  toggle,
  choropleth,
  onChoropleth,
  unit,
  onUnit,
  gisStatus = {},
  className = "top-24",
}: {
  active: Record<LayerId, boolean>;
  toggle: (id: LayerId) => void;
  choropleth: ChoroplethId | null;
  onChoropleth: (id: ChoroplethId | null) => void;
  unit: UnitSize;
  onUnit: (u: UnitSize) => void;
  gisStatus?: Record<string, GisStatus>;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  const [openCats, setOpenCats] = useState<Record<CatKey, boolean>>({
    A: true,
    B: false,
    C: false,
    D: false,
  });
  const toggleCat = (c: CatKey) => setOpenCats((s) => ({ ...s, [c]: !s[c] }));

  const boundaryOn = LAYERS.filter((l) => active[l.id]);
  const activeCount = boundaryOn.length + (choropleth ? 1 : 0);
  const catA = LAYERS.filter((l) => l.category === "A");
  const catD = LAYERS.filter((l) => l.category === "D");
  const catBChoro = CHOROPLETHS.filter((c) => c.category === "B");
  const catCChoro = CHOROPLETHS.filter((c) => c.category === "C");

  return (
    <div
      className={`absolute left-3 z-20 w-[19rem] max-w-[calc(100%-1.5rem)] border border-border bg-paper transition-[top] ${className}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-b border-border px-3 py-2"
      >
        <span className="flex items-center gap-2">
          <span className="rule-label">Map layers</span>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center bg-primary px-1.5 font-mono text-[11px] text-primary-foreground">
            {activeCount}
          </span>
        </span>
        <span className="font-mono text-xs text-muted-foreground">{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="max-h-[62vh] overflow-y-auto">
          {/* ------------------------------ Category A ---------------------------- */}
          <CategorySection
            cat="A"
            count={catA.filter((l) => active[l.id]).length}
            open={openCats.A}
            onToggle={() => toggleCat("A")}
          >
            <BoundaryList layers={catA} active={active} toggle={toggle} gisStatus={gisStatus} />
            {boundaryOn.length > 2 && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                More than two boundary layers are on, so they draw as outlines instead of fills.
              </p>
            )}
          </CategorySection>

          {/* ------------------------------ Category B ---------------------------- */}
          <CategorySection
            cat="B"
            count={choropleth && catBChoro.some((c) => c.id === choropleth) ? 1 : 0}
            open={openCats.B}
            onToggle={() => toggleCat("B")}
          >
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
              One shaded measure at a time — overlapping graduated shading cannot be read.
            </p>
            <ChoroList items={catBChoro} value={choropleth} onChange={onChoropleth} />
            {choropleth && catBChoro.some((c) => c.id === choropleth) && (
              <ChoroLegend id={choropleth} unit={unit} />
            )}
          </CategorySection>

          {/* ------------------------------ Category C ---------------------------- */}
          <CategorySection
            cat="C"
            count={choropleth && catCChoro.some((c) => c.id === choropleth) ? 1 : 0}
            open={openCats.C}
            onToggle={() => toggleCat("C")}
          >
            <p className="mb-2 border border-accent px-2 py-1 text-[11px] leading-relaxed text-accent">
              {RENT_EFFECTIVE_NOTE}
            </p>
            <ChoroList items={catCChoro} value={choropleth} onChange={onChoropleth} />
            <div className="mt-3">
              <p className="rule-label">Bedroom size</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {UNIT_SELECTOR.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onUnit(u.id)}
                    aria-pressed={unit === u.id}
                    className={`border px-2 py-1 text-[11px] leading-none transition-colors ${
                      unit === u.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
            {choropleth && catCChoro.some((c) => c.id === choropleth) && (
              <ChoroLegend id={choropleth} unit={unit} />
            )}
          </CategorySection>

          {/* ------------------------------ Category D ---------------------------- */}
          <CategorySection
            cat="D"
            count={catD.filter((l) => active[l.id]).length}
            open={openCats.D}
            onToggle={() => toggleCat("D")}
          >
            <BoundaryList layers={catD} active={active} toggle={toggle} gisStatus={gisStatus} />
          </CategorySection>
        </div>
      )}
    </div>
  );
}

function CategorySection({
  cat,
  count,
  open,
  onToggle,
  children,
}: {
  cat: CatKey;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const meta = CATEGORY_META[cat];
  return (
    <section className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left hover:bg-secondary"
      >
        <span>
          <span className="block text-xs font-medium text-foreground">{meta.label}</span>
          <span className="block text-[11px] leading-tight text-muted-foreground">
            {meta.blurb}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5">
          {count > 0 && <span className="font-mono text-[11px] text-primary">{count}</span>}
          <span className="font-mono text-xs text-muted-foreground">{open ? "–" : "+"}</span>
        </span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
}

const STATUS_TEXT: Record<GisStatus, string> = {
  loading: "Loading from the city…",
  live: "Live city data",
  cached: `Showing saved copy (${SNAPSHOT_DATE})`,
  error: "Could not load this layer",
};

function BoundaryList({
  layers,
  active,
  toggle,
  gisStatus = {},
}: {
  layers: typeof LAYERS;
  active: Record<LayerId, boolean>;
  toggle: (id: LayerId) => void;
  gisStatus?: Record<string, GisStatus>;
}) {
  return (
    <ul className="space-y-2">
      {layers.map((l) => (
        <li key={l.id}>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={active[l.id]}
              onChange={() => toggle(l.id)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span
              aria-hidden
              className="mt-1 inline-block h-3 w-3 shrink-0 border"
              style={{ backgroundColor: l.color, opacity: 0.45, borderColor: l.color }}
            />
            <span className="leading-tight">
              <span className="text-foreground">
                {l.name}
                <Cite id={`ov-${l.id}`} />
              </span>
              <span className="block text-[11px] text-muted-foreground">{l.description}</span>
              {isGisLayer(l.id) && (
                <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                  {active[l.id]
                    ? (STATUS_TEXT[gisStatus[l.id] ?? "loading"] ?? "")
                    : GIS_SOURCES[l.id].attribution}
                </span>
              )}
              {l.favorable && (
                <span className="mt-1 inline-block border border-primary bg-secondary px-1.5 py-0.5 text-[10px] tracking-wide text-primary">
                  Favorable for housing
                </span>
              )}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function ChoroList({
  items,
  value,
  onChange,
}: {
  items: typeof CHOROPLETHS;
  value: ChoroplethId | null;
  onChange: (id: ChoroplethId | null) => void;
}) {
  return (
    <ul className="space-y-2">
      <li>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="choropleth"
            checked={!items.some((i) => i.id === value)}
            onChange={() => onChange(null)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          <span className="text-muted-foreground">None</span>
        </label>
      </li>
      {items.map((c) => (
        <li key={c.id}>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="radio"
              name="choropleth"
              checked={value === c.id}
              onChange={() => onChange(c.id)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span className="leading-tight">
              <span className="text-foreground">
                {c.name}
                <Cite id={c.sourceId} />
              </span>
              <span className="block text-[11px] text-muted-foreground">{c.description}</span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function ChoroLegend({ id, unit }: { id: ChoroplethId; unit: UnitSize }) {
  const meta = CHOROPLETHS.find((c) => c.id === id)!;
  const [lo, hi] = choroplethRange(id, unit);
  const isMoney = id === "tha-ps" || id === "fmr" || id === "lihtc-rent";
  const fmt = (v: number) => (isMoney ? money.format(v) : `${v.toFixed(1)}%`);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="rule-label">Legend</p>
      {id === "nmtc-eligible" ? (
        <ul className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-3 w-6 bg-primary" /> Meets either test — eligible
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-6 border border-border bg-secondary" /> Meets neither test
          </li>
        </ul>
      ) : (
        <>
          <div className="mt-2 flex h-3 w-full">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => (
              <span key={f} className="flex-1" style={{ backgroundColor: ramp(f) }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>{fmt(lo)}</span>
            <span>{fmt(hi)}</span>
          </div>
        </>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-accent">{meta.thresholdNote}</p>
      {id === "poverty" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Tracts at or above {POVERTY_THRESHOLD}% carry a heavy outline on the map.
        </p>
      )}
      {id === "mfi" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Tracts at or below {MFI_THRESHOLD}% carry a heavy outline on the map.
        </p>
      )}
      {isMoney && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Shaded for the selected bedroom size, {RENT_EFFECTIVE_YEAR}.
        </p>
      )}
    </div>
  );
}

/** Tract count meeting each test, used by the panel copy. */
export const NMTC_ELIGIBLE_TRACTS = TRACTS.filter(nmtcEligible).length;
