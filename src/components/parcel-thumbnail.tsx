import { LAYERS, type Parcel } from "@/lib/tulsa-map-data";

/**
 * Small plat-style crop of the Tulsa map surface centered on one parcel.
 * Purely presentational — reuses the same coordinate space as the main map.
 */
export function ParcelThumbnail({ parcel, muted = false }: { parcel: Parcel; muted?: boolean }) {
  const [cx, cy] = parcel.centroid;
  const halfW = 190;
  const halfH = 110;
  const vb = `${cx - halfW} ${cy - halfH} ${halfW * 2} ${halfH * 2}`;
  const gridLines: number[] = [];
  for (let g = Math.floor((cx - halfW) / 60) * 60; g < cx + halfW; g += 60) gridLines.push(g);
  const rowLines: number[] = [];
  for (let g = Math.floor((cy - halfH) / 60) * 60; g < cy + halfH; g += 60) rowLines.push(g);

  return (
    <svg
      viewBox={vb}
      role="img"
      aria-label={`Map excerpt for ${parcel.address}`}
      className={`h-36 w-full border-b border-border bg-paper-deep ${muted ? "opacity-70" : ""}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {gridLines.map((x) => (
        <line
          key={`v${x}`}
          x1={x}
          y1={cy - halfH}
          x2={x}
          y2={cy + halfH}
          stroke="var(--color-border)"
          strokeWidth={0.8}
        />
      ))}
      {rowLines.map((y) => (
        <line
          key={`h${y}`}
          x1={cx - halfW}
          y1={y}
          x2={cx + halfW}
          y2={y}
          stroke="var(--color-border)"
          strokeWidth={0.8}
        />
      ))}

      {LAYERS.filter((l) => parcel.layers.includes(l.id)).map((l) => (
        <rect
          key={l.id}
          x={l.rect.x}
          y={l.rect.y}
          width={l.rect.w}
          height={l.rect.h}
          fill={l.color}
          fillOpacity={0.14}
          stroke={l.color}
          strokeOpacity={0.5}
          strokeWidth={1.2}
        />
      ))}

      <polygon
        points={parcel.points.map((p) => p.join(",")).join(" ")}
        fill="var(--color-accent)"
        fillOpacity={0.28}
        stroke="var(--color-primary)"
        strokeWidth={2.5}
      />
    </svg>
  );
}
