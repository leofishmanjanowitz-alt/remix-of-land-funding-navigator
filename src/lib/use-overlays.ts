import { useQueries } from "@tanstack/react-query";
import type { OverlayApiKind } from "./overlays-meta";

export interface OverlaySource {
  sourceKey: string;
  datasetName: string;
  publisher: string;
  vintage: string | null;
  boundaryBasis: string | null;
  pulledAt: string;
  sourceLastEdit: string | null;
  recordCount: number;
}

export interface OverlayCollection {
  kind: OverlayApiKind;
  source: OverlaySource | null;
  type: "FeatureCollection";
  features: unknown[];
}

async function fetchOverlay(kind: OverlayApiKind, signal: AbortSignal): Promise<OverlayCollection> {
  const res = await fetch(`/api/overlays/${kind}`, { signal });
  if (!res.ok) throw new Error(`Overlay ${kind} failed (${res.status})`);
  return (await res.json()) as OverlayCollection;
}

export type OverlayLoad =
  | { kind: OverlayApiKind; status: "loading" }
  | { kind: OverlayApiKind; status: "error" }
  | { kind: OverlayApiKind; status: "ready"; data: OverlayCollection };

/** Loads only the overlays that are switched on; each is fetched once and kept. */
export function useOverlays(kinds: OverlayApiKind[]): OverlayLoad[] {
  const results = useQueries({
    queries: kinds.map((kind) => ({
      queryKey: ["overlay", kind],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchOverlay(kind, signal),
      staleTime: 60 * 60 * 1000,
    })),
  });
  return kinds.map((kind, i): OverlayLoad => {
    const q = results[i];
    if (q?.data) return { kind, status: "ready", data: q.data };
    if (q?.isError) return { kind, status: "error" };
    return { kind, status: "loading" };
  });
}
