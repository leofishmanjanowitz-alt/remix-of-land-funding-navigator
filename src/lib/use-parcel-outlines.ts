import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getOutlines, type Bbox } from "./parcel-api";
import { OUTLINE_MIN_ZOOM } from "./parcel-types";

export interface Viewport {
  bbox: Bbox;
  zoom: number;
}

/** Ask for this much more than is visible, so small pans do not trigger a new request. */
const BUFFER = 0.25;

function buffered([w, s, e, n]: Bbox): Bbox {
  const dx = (e - w) * BUFFER;
  const dy = (n - s) * BUFFER;
  const r = (v: number) => Math.round(v * 1e4) / 1e4;
  return [r(w - dx), r(s - dy), r(e + dx), r(n + dy)];
}

function contains(outer: Bbox, inner: Bbox): boolean {
  return (
    outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3]
  );
}

/**
 * Parcel outlines for the map view: street level only, and only refetched when
 * the view leaves the area already loaded or the zoom changes.
 */
export function useParcelOutlines(viewport: Viewport | null) {
  const [request, setRequest] = useState<{ bbox: Bbox; zoom: number } | null>(null);
  const zoom = viewport ? Math.floor(viewport.zoom) : null;
  const enabled = zoom !== null && zoom >= OUTLINE_MIN_ZOOM;

  useEffect(() => {
    if (!viewport || zoom === null || zoom < OUTLINE_MIN_ZOOM) return;
    setRequest((current) =>
      current && current.zoom === zoom && contains(current.bbox, viewport.bbox)
        ? current
        : { bbox: buffered(viewport.bbox), zoom },
    );
  }, [viewport, zoom]);

  const query = useQuery({
    queryKey: ["parcel-outlines", request?.zoom, request?.bbox],
    queryFn: ({ signal }) => getOutlines(request!.bbox, request!.zoom, signal),
    enabled: enabled && request !== null,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  return {
    /** Null below street level, so the layer clears when zooming out. */
    outlines: enabled ? (query.data ?? null) : null,
    loading: enabled && query.isFetching,
    error: enabled && query.isError,
    zoom,
    streetLevel: enabled,
  };
}
