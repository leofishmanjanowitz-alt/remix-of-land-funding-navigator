import { useEffect, useState } from "react";
import { LayerSwatch } from "@/components/layer-swatch";
import { formatDate } from "@/lib/overlay-text";
import {
  DISPLAY_LAYERS,
  OVERLAYS,
  type LayerKey,
  type LayerState,
  type OverlayMeta,
} from "@/lib/overlays-meta";
import type { GisStatus } from "@/lib/tulsa-gis";
import { SNAPSHOT_DATE } from "@/lib/tulsa-gis";
import { useSources, type LoadedSource } from "@/lib/use-sources";

function sourceLine(meta: OverlayMeta, src: LoadedSource | undefined): string {
  if (!src) return meta.source;
  const vintage =
    src.vintage && /^\d{4}$/.test(src.vintage)
      ? `${src.vintage} ${meta.key === "oz" ? "designation" : "designations"}`
      : src.vintage
        ? `dated ${src.vintage}`
        : src.sourceLastEdit
          ? `updated ${formatDate(src.sourceLastEdit)}`
          : null;
  return [meta.source, vintage, `pulled ${formatDate(src.pulledAt)}`].filter(Boolean).join(" · ");
}

function overlayDetail(
  meta: OverlayMeta,
  src: LoadedSource | undefined,
  status: GisStatus | undefined,
): string {
  if (status === "error") return "Could not be loaded";
  if (status === "loading") return "Loading…";
  return sourceLine(meta, src);
}

function gisStatusLabel(status: GisStatus | undefined): string | null {
  if (status === "live") return "Live from the City of Tulsa";
  if (status === "cached")
    return `Live service unreachable: showing a saved copy from ${SNAPSHOT_DATE}`;
  if (status === "loading") return "Loading…";
  if (status === "error") return "Could not be loaded";
  return null;
}

function Row({
  checked,
  onChange,
  swatch,
  label,
  description,
  detail,
  warn,
}: {
  checked: boolean;
  onChange: () => void;
  swatch: React.ReactNode;
  label: string;
  description: string;
  detail?: string | null;
  warn?: boolean;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-2.5 px-4 py-2 hover:bg-foreground/[0.03]">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-1 h-3.5 w-3.5 shrink-0 accent-[var(--color-accent)]"
        />
        <span className="mt-0.5">{swatch}</span>
        <span className="min-w-0 text-left">
          <span className="block text-sm leading-snug text-foreground">{label}</span>
          <span className="block text-xs leading-snug text-muted-foreground">{description}</span>
          {detail && (
            <span
              className={`mt-0.5 block text-[11px] leading-snug ${warn ? "text-accent" : "text-muted-foreground/90"}`}
            >
              {detail}
            </span>
          )}
        </span>
      </label>
    </li>
  );
}

function Heading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="px-4 pt-3 pb-1">
      <p className="rule-label">{title}</p>
      {note && <p className="mt-1 text-xs leading-snug text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Every layer, with a toggle, what it is, who publishes it, and its vintage and pull date. */
export function LayerControl({
  layers,
  toggle,
  status,
  className = "",
}: {
  layers: LayerState;
  toggle: (key: LayerKey) => void;
  /** Load state per layer: live/cached/loading/error. Absent when a layer is off or settled. */
  status: Partial<Record<string, GisStatus>>;
  className?: string;
}) {
  // Open on wide screens; on a phone the panel would cover the map, so it starts collapsed.
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  }, []);
  const sources = useSources();
  const byKey = new Map((sources.data ?? []).map((s) => [s.sourceKey, s]));
  const on = Object.values(layers).filter(Boolean).length;

  return (
    <div
      className={`absolute left-3 z-20 flex max-h-[calc(100%-2rem)] w-[19rem] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-paper/90 shadow-panel backdrop-blur-[16px] ${className}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="rule-label">Map layers</span>
          <span className="rounded-md bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
            {on}
          </span>
        </span>
        <span className="text-muted-foreground" aria-hidden="true">
          {open ? "–" : "+"}
        </span>
      </button>

      {open && (
        <div className="min-h-0 overflow-y-auto border-t border-border pb-3">
          <Heading
            title="Funding designations"
            note="Each is checked against a parcel by spatial intersection."
          />
          <ul>
            {OVERLAYS.filter((o) => o.group === "designation").map((o) => (
              <Row
                key={o.key}
                checked={layers[o.key]}
                onChange={() => toggle(o.key)}
                swatch={<LayerSwatch layer={o} />}
                label={o.label}
                description={o.description}
                detail={overlayDetail(o, byKey.get(o.sourceKey), status[o.key])}
                warn={status[o.key] === "error"}
              />
            ))}
          </ul>

          <Heading title="Boundaries" />
          <ul>
            {OVERLAYS.filter((o) => o.group === "boundary").map((o) => (
              <Row
                key={o.key}
                checked={layers[o.key]}
                onChange={() => toggle(o.key)}
                swatch={<LayerSwatch layer={o} />}
                label={o.label}
                description={o.description}
                detail={overlayDetail(o, byKey.get(o.sourceKey), status[o.key])}
                warn={status[o.key] === "error"}
              />
            ))}
          </ul>

          <Heading
            title="Display only"
            note="Drawn for reference. Not part of the parcel check and never used in a result."
          />
          <ul>
            {DISPLAY_LAYERS.map((d) => {
              const label = gisStatusLabel(status[d.key]);
              return (
                <Row
                  key={d.key}
                  checked={layers[d.key]}
                  onChange={() => toggle(d.key)}
                  swatch={<LayerSwatch layer={d} />}
                  label={d.label}
                  description={d.description}
                  detail={label ?? `${d.source} · display only`}
                  warn={status[d.key] === "cached" || status[d.key] === "error"}
                />
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
