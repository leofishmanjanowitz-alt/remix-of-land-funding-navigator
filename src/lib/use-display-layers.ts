import { useQueries } from "@tanstack/react-query";
import type { GeoLayerRender } from "@/components/basemap";
import { DISPLAY_LAYERS, type LayerState } from "./overlays-meta";
import { fetchGisLayer, type GisStatus } from "./tulsa-gis";

/**
 * Display-only layers drawn from the City of Tulsa's published services (floodplains, zoning).
 * They are not stored in the database and never feed a parcel result.
 */
export function useDisplayLayers(layers: LayerState) {
  const gis = DISPLAY_LAYERS.filter((d) => d.gisId);
  const results = useQueries({
    queries: gis.map((d) => ({
      queryKey: ["tulsa-gis", d.gisId],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchGisLayer(d.gisId!, signal),
      enabled: layers[d.key],
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60,
    })),
  });

  const geoLayers: GeoLayerRender[] = [];
  const status: Partial<Record<string, GisStatus>> = {};
  gis.forEach((d, i) => {
    const q = results[i];
    if (!layers[d.key] || !q) return;
    if (q.data) {
      status[d.key] = q.data.source;
      geoLayers.push({ id: d.gisId!, data: q.data.data, color: d.color });
    } else {
      status[d.key] = q.isError ? "error" : "loading";
    }
  });
  return { geoLayers, status };
}
