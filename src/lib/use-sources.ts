import { useQuery } from "@tanstack/react-query";

export interface LoadedSource {
  sourceKey: string;
  datasetName: string;
  publisher: string;
  vintage: string | null;
  boundaryBasis: string | null;
  pulledAt: string;
  sourceLastEdit: string | null;
  recordCount: number;
  licenseNote: string | null;
}

/** Every data source currently loaded, with its vintage and pull date. */
export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/sources", { signal });
      if (!res.ok) throw new Error("The data service is not reachable.");
      return ((await res.json()) as { sources: LoadedSource[] }).sources;
    },
    staleTime: 10 * 60 * 1000,
  });
}
