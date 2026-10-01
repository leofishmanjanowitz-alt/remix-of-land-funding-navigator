import type { ParcelSummary } from "@/lib/parcel-types";

/**
 * Several parcels matched (or share one footprint). Nothing is selected until the
 * user picks one; the same numbers label the dashed outlines on the map.
 */
export function CandidateList({
  title,
  hint,
  results,
  highlightId,
  onHighlight,
  onSelect,
}: {
  title: string;
  hint: string;
  results: ParcelSummary[];
  highlightId: number | null;
  onHighlight: (id: number | null) => void;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="px-6 py-6">
      <p className="rule-label">Choose a parcel</p>
      <h1 className="mt-3 font-heading text-xl leading-snug font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>

      <ol className="mt-5 space-y-2">
        {results.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelect(r.id)}
              onMouseEnter={() => onHighlight(r.id)}
              onMouseLeave={() => onHighlight(null)}
              onFocus={() => onHighlight(r.id)}
              onBlur={() => onHighlight(null)}
              className={`grid w-full grid-cols-[1.75rem_minmax(0,1fr)] gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                highlightId === r.id
                  ? "border-accent bg-accent/5"
                  : "border-border bg-paper hover:border-accent"
              }`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">
                  {r.address ?? "No street address"}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {[r.city, r.zip].filter(Boolean).join(" ")}
                </span>
                <span className="mt-1.5 block text-xs text-muted-foreground">
                  <span className="tabular-nums">{r.parcelNumber ?? "no parcel number"}</span>
                  {" · "}
                  {r.acres !== null ? `${r.acres.toFixed(2)} acres` : "acreage unknown"}
                  {" · "}
                  {r.parcelType === "condo" ? "condominium" : "parcel"}
                  {r.landUse ? ` · ${r.landUse}` : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
