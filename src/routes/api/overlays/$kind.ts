import { createFileRoute } from "@tanstack/react-router";
import { handle, json, problem } from "@/server/http";
import { OVERLAY_KINDS, overlayGeoJson } from "@/server/overlays";

/** GET /api/overlays/:kind — one overlay's boundaries as GeoJSON, with its pull record. */
export const Route = createFileRoute("/api/overlays/$kind")({
  server: {
    handlers: {
      GET: ({ params, request }) =>
        handle(async () => {
          const data = await overlayGeoJson(params.kind);
          if (!data) return problem(404, `Unknown overlay. Available: ${OVERLAY_KINDS.join(", ")}`);
          // Boundaries change only when an ingest runs.
          return json(data, { cache: "public, max-age=300", request });
        }),
    },
  },
});
