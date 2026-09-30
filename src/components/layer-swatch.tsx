import type { DisplayLayerMeta, OverlayMeta } from "@/lib/overlays-meta";

type Swatchable = Pick<OverlayMeta, "color" | "dash"> & { fill?: boolean };

/** A small sample of how a layer is drawn on the map: its fill, stroke and dash. */
export function LayerSwatch({
  layer,
  className = "",
}: {
  layer: Swatchable | DisplayLayerMeta;
  className?: string;
}) {
  const dash = "dash" in layer ? layer.dash : undefined;
  const fill = "fill" in layer ? layer.fill !== false : true;
  return (
    <svg
      viewBox="0 0 28 16"
      width="28"
      height="16"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <rect
        x="1.5"
        y="1.5"
        width="25"
        height="13"
        rx="2"
        fill={fill ? layer.color : "none"}
        fillOpacity={fill ? 0.25 : 0}
        stroke={layer.color}
        strokeWidth={fill ? 1.5 : 2.5}
        strokeDasharray={dash}
      />
    </svg>
  );
}
