import { LayerSwatch } from "@/components/layer-swatch";
import { DISPLAY_LAYERS, OVERLAYS, type LayerState } from "@/lib/overlays-meta";

/** What the colours and line styles on the map mean, for the layers that are switched on. */
export function MapLegend({ layers, className = "" }: { layers: LayerState; className?: string }) {
  const overlays = OVERLAYS.filter((o) => layers[o.key]);
  const display = DISPLAY_LAYERS.filter((d) => layers[d.key]);

  return (
    <div
      className={`max-w-[15rem] rounded-xl border border-border bg-paper/90 px-3 py-2.5 shadow-card backdrop-blur-[16px] ${className}`}
      role="group"
      aria-label="Map legend"
    >
      <p className="rule-label">Legend</p>
      <ul className="mt-2 space-y-1.5">
        {overlays.map((o) => (
          <li key={o.key} className="flex items-center gap-2 text-xs leading-tight text-foreground">
            <LayerSwatch layer={o} />
            {o.label}
          </li>
        ))}
        {display.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-xs leading-tight text-foreground">
            <LayerSwatch layer={d} />
            <span>
              {d.label} <span className="text-muted-foreground">(display only)</span>
            </span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-xs leading-tight text-foreground">
          <svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true" className="shrink-0">
            <rect
              x="3"
              y="3"
              width="22"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
          </svg>
          Parcel outline (street level)
        </li>
        <li className="flex items-center gap-2 text-xs leading-tight text-foreground">
          <svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true" className="shrink-0">
            <rect
              x="3"
              y="3"
              width="22"
              height="10"
              fill="var(--color-accent)"
              fillOpacity="0.25"
              stroke="var(--color-accent)"
              strokeWidth="3"
            />
          </svg>
          Selected parcel
        </li>
        <li className="flex items-center gap-2 text-xs leading-tight text-foreground">
          <svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true" className="shrink-0">
            <rect
              x="3"
              y="3"
              width="22"
              height="10"
              fill="var(--color-accent)"
              fillOpacity="0.12"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
          </svg>
          Parcel to choose from
        </li>
      </ul>
    </div>
  );
}
