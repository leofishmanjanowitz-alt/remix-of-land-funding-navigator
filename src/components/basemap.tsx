/**
 * Real-world basemap for the parcel surface.
 *
 * Browser-only: this module statically imports Leaflet, so it must be loaded
 * lazily behind <ClientOnly> (see src/routes/map.tsx).
 *
 * Everything drawn on it is real geometry in latitude/longitude: overlays and parcel
 * outlines served from the database, plus the City of Tulsa's display-only layers.
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GIS_SOURCES, type GeoJsonFeatureCollection, type GisLayerId } from "@/lib/tulsa-gis";
import type { OutlineCollection, PolygonGeometry } from "@/lib/parcel-types";
import type { Viewport } from "@/lib/use-parcel-outlines";
import type { OverlayMeta } from "@/lib/overlays-meta";
import type { OverlayCollection } from "@/lib/use-overlays";

/** Downtown / north Tulsa. Aspect ratio chosen to match the 3:2 drawing. */
const SW: [number, number] = [36.118, -96.052];
const NE: [number, number] = [36.183, -95.932];
const BOUNDS = L.latLngBounds(SW, NE);

const FEMA_WMS = "https://hazards.fema.gov/arcgis/services/public/NFHL/MapServer/WMSServer";

export interface OverlayRender {
  meta: OverlayMeta;
  data: OverlayCollection;
}

export interface GeoLayerRender {
  id: GisLayerId;
  data: GeoJsonFeatureCollection;
  /** CSS color for stroke and fill. */
  color: string;
}

/** The selected parcel: its real outline and a label for the tooltip. */
export interface SelectedParcel {
  id: number;
  geometry: PolygonGeometry;
  label: string;
}

/** A parcel in an open pick list, numbered to match the list. */
export interface CandidateParcel {
  id: number;
  n: number;
  geometry: PolygonGeometry;
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

/** Leave room for the layer panel on the left and the search box along the top. */
function framing(map: L.Map): L.FitBoundsOptions {
  const wide = map.getSize().x > 900;
  return {
    paddingTopLeft: L.point(wide ? 340 : 24, 80),
    paddingBottomRight: L.point(24, 48),
  };
}

export function BaseMap({
  femaFloodplain,
  geoLayers = [],
  selected = null,
  candidates = [],
  highlightId = null,
  onMapClick,
  onSelectCandidate,
  parcelOutlines = null,
  overlays = [],
  onViewportChange,
}: {
  femaFloodplain: boolean;
  geoLayers?: GeoLayerRender[];
  selected?: SelectedParcel | null;
  candidates?: CandidateParcel[];
  highlightId?: number | null;
  /** A click on empty map (not on a candidate), with the zoom it happened at. */
  onMapClick?: (lat: number, lng: number, zoom: number) => void;
  onSelectCandidate?: (id: number) => void;
  /** Real parcel outlines for the current view (street level only). */
  parcelOutlines?: OutlineCollection | null;
  /** Overlays served from the database, already filtered to the ones switched on. */
  overlays?: OverlayRender[];
  onViewportChange?: (viewport: Viewport) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const femaRef = useRef<L.TileLayer.WMS | null>(null);
  const selectedRef = useRef<L.GeoJSON | null>(null);
  const candidateRef = useRef<{ group: L.FeatureGroup; byId: Map<number, L.GeoJSON> } | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onSelectCandidateRef = useRef(onSelectCandidate);
  onSelectCandidateRef.current = onSelectCandidate;
  const outlineRef = useRef<L.GeoJSON | null>(null);
  const outlineCanvasRef = useRef<L.Canvas | null>(null);
  const overlayRef = useRef<Map<string, { layer: L.GeoJSON; data: OverlayCollection }>>(new Map());
  const selectedId = selected?.id ?? null;
  const selectedNow = useRef(selected);
  selectedNow.current = selected;
  const candidatesKey = candidates.map((c) => c.id).join(",");
  const candidatesNow = useRef(candidates);
  candidatesNow.current = candidates;
  const onViewportRef = useRef(onViewportChange);
  onViewportRef.current = onViewportChange;
  const geoRef = useRef<Map<string, { layer: L.GeoJSON; data: unknown }>>(new Map());
  // Incremented each time a Leaflet map instance is created, so layer effects
  // re-run after a remount (React StrictMode mounts effects twice in dev).
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;
    // The stores never change identity; hold them so cleanup does not read a moved ref.
    const geoStore = geoRef.current;
    const overlayStore = overlayRef.current;

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

    // Panes keep parcel outlines above the overlays and below the selected parcel.
    map.createPane("overlays").style.zIndex = "410";
    map.createPane("parcelOutlines").style.zIndex = "420";
    map.createPane("candidates").style.zIndex = "430";
    map.createPane("selection").style.zIndex = "440";
    map.on("click", (e: L.LeafletMouseEvent) =>
      onMapClickRef.current?.(e.latlng.lat, e.latlng.lng, map.getZoom()),
    );

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
      geoStore.clear();
      femaRef.current = null;
      selectedRef.current = null;
      candidateRef.current = null;
      outlineRef.current = null;
      outlineCanvasRef.current = null;
      overlayStore.clear();
    };
  }, []);

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
          // A hover tooltip, not a click popup: a click must still select the parcel beneath.
          lyr.bindTooltip(
            `<strong>${title}</strong>${detail ? `<br/>${escapeHtml(detail)}` : ""}` +
              `<br/><span style="opacity:.7">${escapeHtml(src.attribution)} · display only</span>`,
            { sticky: true },
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

  // Overlays from the database (display geometry), diffed by kind.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const store = overlayRef.current;
    const wanted = new Map(overlays.map((o) => [o.meta.key, o]));

    for (const [key, entry] of store) {
      if (wanted.get(key as OverlayMeta["key"])?.data !== entry.data) {
        map.removeLayer(entry.layer);
        store.delete(key);
      }
    }
    for (const { meta, data } of overlays) {
      if (store.has(meta.key)) continue;
      const color = resolveColor(meta.color);
      const layer = L.geoJSON(data as unknown as GeoJSON.GeoJsonObject, {
        pane: "overlays",
        interactive: false,
        style: () => ({
          color,
          weight: meta.fill ? 1.5 : 2.5,
          opacity: 0.9,
          fill: meta.fill,
          fillColor: color,
          fillOpacity: 0.14,
          ...(meta.dash ? { dashArray: meta.dash } : {}),
        }),
      });
      layer.addTo(map);
      // Filled areas sit underneath; outline-only boundaries stay readable on top.
      if (meta.fill) layer.bringToBack();
      else layer.bringToFront();
      store.set(meta.key, { layer, data });
    }
  }, [overlays, epoch]);

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

  // The selected parcel: real outline, label, and a fly-to when the selection changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedRef.current) {
      map.removeLayer(selectedRef.current);
      selectedRef.current = null;
    }
    const sel = selectedNow.current;
    if (!sel) return;

    const color = resolveColor("var(--accent)");
    const layer = L.geoJSON(sel.geometry as unknown as GeoJSON.GeoJsonObject, {
      pane: "selection",
      interactive: false,
      style: () => ({ color, weight: 3, fillColor: color, fillOpacity: 0.25 }),
    });
    layer.eachLayer((l) =>
      l.bindTooltip(sel.label, { permanent: true, direction: "top", opacity: 0.95 }),
    );
    layer.addTo(map);
    selectedRef.current = layer;
    map.flyToBounds(layer.getBounds().pad(1.2), { ...framing(map), maxZoom: 18, duration: 0.8 });
    // Re-run only when the selected parcel changes, not on every parent render.
  }, [selectedId, epoch]);

  // Pick-list candidates: numbered dashed outlines, clickable, framed together.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (candidateRef.current) {
      map.removeLayer(candidateRef.current.group);
      candidateRef.current = null;
    }
    const list = candidatesNow.current;
    if (list.length === 0) return;

    const color = resolveColor("var(--accent)");
    const group = L.featureGroup();
    const byId = new Map<number, L.GeoJSON>();
    for (const c of list) {
      const poly = L.geoJSON(c.geometry as unknown as GeoJSON.GeoJsonObject, {
        pane: "candidates",
        style: () => ({ color, weight: 2, dashArray: "5 4", fillColor: color, fillOpacity: 0.12 }),
      });
      poly.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectCandidateRef.current?.(c.id);
      });
      poly.eachLayer((l) =>
        l.bindTooltip(String(c.n), {
          permanent: true,
          direction: "center",
          className: "candidate-number",
        }),
      );
      poly.addTo(group);
      byId.set(c.id, poly);
    }
    group.addTo(map);
    candidateRef.current = { group, byId };
    map.flyToBounds(group.getBounds().pad(0.6), { ...framing(map), maxZoom: 18, duration: 0.6 });
  }, [candidatesKey, epoch]);

  // Hovering a pick-list row emphasises its outline.
  useEffect(() => {
    const store = candidateRef.current;
    if (!store) return;
    const color = resolveColor("var(--accent)");
    for (const [id, layer] of store.byId) {
      layer.setStyle(
        id === highlightId
          ? { color, weight: 4, dashArray: undefined, fillOpacity: 0.3 }
          : { color, weight: 2, dashArray: "5 4", fillOpacity: 0.12 },
      );
    }
  }, [highlightId, candidatesKey, epoch]);

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="h-full w-full bg-paper-deep" />

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
