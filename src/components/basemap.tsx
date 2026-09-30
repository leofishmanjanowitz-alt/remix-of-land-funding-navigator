/**
 * Real-world basemap for the parcel surface.
 *
 * Browser-only: this module statically imports Leaflet, so it must be loaded
 * lazily behind <ClientOnly> (see src/routes/map.tsx).
 *
 * The existing parcel/overlay artwork is drawn in a 1200x800 coordinate space.
 * It is projected onto a fixed Tulsa bounding box with an L.svgOverlay, so the
 * drawing pans and zooms in lockstep with the tiles underneath.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GIS_SOURCES, type GeoJsonFeatureCollection, type GisLayerId } from "@/lib/tulsa-gis";
import type { OutlineCollection } from "@/lib/parcel-types";
import type { Viewport } from "@/lib/use-parcel-outlines";

export const VIEW_W = 1200;
export const VIEW_H = 800;

/** Downtown / north Tulsa. Aspect ratio chosen to match the 3:2 drawing. */
const SW: [number, number] = [36.118, -96.052];
const NE: [number, number] = [36.183, -95.932];
const BOUNDS = L.latLngBounds(SW, NE);

const FEMA_WMS = "https://hazards.fema.gov/arcgis/services/public/NFHL/MapServer/WMSServer";

export interface GeoLayerRender {
  id: GisLayerId;
  data: GeoJsonFeatureCollection;
  /** CSS color for stroke and fill. */
  color: string;
}

/** Selected parcel, in the 1200x800 drawing space. */
export interface FocusTarget {
  id: string;
  points: [number, number][];
  label: string;
}

/** Drawing space -> lat/lng, matching the L.svgOverlay projection onto BOUNDS. */
function toLatLng([x, y]: [number, number]): [number, number] {
  const lng = SW[1] + (x / VIEW_W) * (NE[1] - SW[1]);
  const lat = NE[0] - (y / VIEW_H) * (NE[0] - SW[0]);
  return [lat, lng];
}

/** Leaflet writes SVG presentation attributes, which do not resolve var(). */
function resolveColor(color: string): string {
  const m = /^var\((--[^),]+)\)$/.exec(color.trim());
  if (!m || !m[1]) return color;
  const v = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  return v || "#2f6b7a";
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

export function BaseMap({
  femaFloodplain,
  geoLayers = [],
  focus = null,
  parcelOutlines = null,
  onViewportChange,
  children,
}: {
  femaFloodplain: boolean;
  geoLayers?: GeoLayerRender[];
  focus?: FocusTarget | null;
  /** Real parcel outlines for the current view (street level only). */
  parcelOutlines?: OutlineCollection | null;
  onViewportChange?: (viewport: Viewport) => void;
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const femaRef = useRef<L.TileLayer.WMS | null>(null);
  const focusRef = useRef<L.Polygon | null>(null);
  const outlineRef = useRef<L.GeoJSON | null>(null);
  const outlineCanvasRef = useRef<L.Canvas | null>(null);
  const focusId = focus?.id ?? null;
  const onViewportRef = useRef(onViewportChange);
  onViewportRef.current = onViewportChange;
  const geoRef = useRef<Map<string, { layer: L.GeoJSON; data: unknown }>>(new Map());
  // Incremented each time a Leaflet map instance is created, so layer effects
  // re-run after a remount (React StrictMode mounts effects twice in dev).
  const [epoch, setEpoch] = useState(0);

  const svgEl = useMemo(() => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
    el.setAttribute("preserveAspectRatio", "none");
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Parcel map of Tulsa, Oklahoma");
    return el;
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;

    const map = L.map(host, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 11,
      maxZoom: 19,
    });
    map.fitBounds(BOUNDS);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.svgOverlay(svgEl, BOUNDS, { interactive: true, className: "parcel-overlay" }).addTo(map);

    // Panes keep parcel outlines above the overlays and below the selected parcel.
    map.createPane("parcelOutlines").style.zIndex = "420";

    mapRef.current = map;
    setEpoch((n) => n + 1);

    // Report the visible area (debounced) so the page can load outlines for it.
    let timer: number | undefined;
    const report = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const b = map.getBounds();
        // Exposed for end-to-end checks.
        host.dataset["zoom"] = String(map.getZoom());
        onViewportRef.current?.({
          bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
          zoom: map.getZoom(),
        });
      }, 200);
    };
    map.on("moveend", report);
    report();

    const resize = () => map.invalidateSize();
    window.addEventListener("resize", resize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", resize);
      map.remove();
      mapRef.current = null;
      geoRef.current.clear();
      femaRef.current = null;
      focusRef.current = null;
      outlineRef.current = null;
      outlineCanvasRef.current = null;
    };
  }, [svgEl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (femaFloodplain && !femaRef.current) {
      const wms = L.tileLayer.wms(FEMA_WMS, {
        layers: "28",
        format: "image/png",
        transparent: true,
        opacity: 0.55,
        attribution: "FEMA National Flood Hazard Layer",
      });
      wms.addTo(map);
      femaRef.current = wms;
    } else if (!femaFloodplain && femaRef.current) {
      map.removeLayer(femaRef.current);
      femaRef.current = null;
    }
  }, [femaFloodplain, epoch]);

  // Published city / county boundaries, drawn from GeoJSON.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const store = geoRef.current;
    const wanted = new Set(geoLayers.map((g) => g.id));
    let added = false;

    for (const [id, entry] of store) {
      const stillWanted = geoLayers.find((g) => g.id === id);
      if (!wanted.has(id as GisLayerId) || stillWanted?.data !== entry.data) {
        map.removeLayer(entry.layer);
        store.delete(id);
      }
    }

    for (const g of geoLayers) {
      if (store.has(g.id)) continue;
      const src = GIS_SOURCES[g.id];
      const color = resolveColor(g.color);
      const layer = L.geoJSON(g.data as unknown as GeoJSON.GeoJsonObject, {
        style: () => ({
          color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.16,
        }),
        onEachFeature: (feature, lyr) => {
          const props = (feature.properties ?? {}) as Record<string, unknown>;
          const title = escapeHtml(src.label(props));
          const detail = src.detail?.(props);
          lyr.bindPopup(
            `<strong>${title}</strong>${detail ? `<br/>${escapeHtml(detail)}` : ""}` +
              `<br/><span style="opacity:.7">${escapeHtml(src.attribution)}</span>`,
          );
        },
      });
      layer.addTo(map);
      store.set(g.id, { layer, data: g.data });
      added = true;
    }

    // Vector layers added before the container has its final size render empty
    // until the next view update, so nudge Leaflet once.
    if (added) requestAnimationFrame(() => map.invalidateSize());
  }, [geoLayers, epoch]);

  // Real parcel outlines for the current view, drawn on a canvas (thousands of polygons).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (outlineRef.current) {
      map.removeLayer(outlineRef.current);
      outlineRef.current = null;
    }
    if (!parcelOutlines || parcelOutlines.features.length === 0) return;

    const color = resolveColor("var(--foreground)");
    // One canvas for the life of the map; a new one per update would leak elements.
    const canvas = (outlineCanvasRef.current ??= L.canvas({
      padding: 0.3,
      pane: "parcelOutlines",
    }));
    const layer = L.geoJSON(parcelOutlines as unknown as GeoJSON.GeoJsonObject, {
      pane: "parcelOutlines",
      interactive: false,
      style: () => ({ renderer: canvas, color, weight: 1, opacity: 0.5, fill: false }),
    });
    layer.addTo(map);
    outlineRef.current = layer;
  }, [parcelOutlines, epoch]);

  // Highlight and fly to the selected parcel.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (focusRef.current) {
      map.removeLayer(focusRef.current);
      focusRef.current = null;
    }
    if (!focus || focus.points.length < 3) return;

    const color = resolveColor("var(--accent)");
    const polygon = L.polygon(focus.points.map(toLatLng), {
      color,
      weight: 3,
      fillColor: color,
      fillOpacity: 0.25,
    });
    polygon.bindTooltip(focus.label, { permanent: true, direction: "top", opacity: 0.95 });
    polygon.addTo(map);
    focusRef.current = polygon;

    map.flyToBounds(polygon.getBounds().pad(1.5), { maxZoom: 17, duration: 0.8 });
    // Re-run only when the selected parcel changes, not on every parent render:
    // `focus` is a new object each render, and flying again would undo the user's pan and zoom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, epoch]);

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="h-full w-full bg-paper-deep" />
      {createPortal(children, svgEl)}

      <div className="absolute bottom-3 right-3 z-[500] flex flex-col overflow-hidden rounded-lg border border-border bg-paper shadow-card">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="h-9 w-9 border-b border-border text-foreground hover:bg-secondary"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="h-9 w-9 border-b border-border text-foreground hover:bg-secondary"
        >
          −
        </button>
        <button
          onClick={() => mapRef.current?.fitBounds(BOUNDS)}
          aria-label="Reset view"
          className="h-9 w-9 tabular-nums text-[10px] text-muted-foreground hover:bg-secondary"
        >
          RST
        </button>
      </div>
    </div>
  );
}

export default BaseMap;
