import { createFileRoute } from "@tanstack/react-router";
import { handle, json, problem } from "@/server/http";
import { parcelOutlines, validateOutlineRequest, type Bbox } from "@/server/outlines";

/**
 * GET /api/parcels/outlines?bbox=minLng,minLat,maxLng,maxLat&zoom=17
 * Parcel outlines for the map view. Only at zoom 16+, and capped (nearest the centre first).
 */
export const Route = createFileRoute("/api/parcels/outlines")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handle(async () => {
          const params = new URL(request.url).searchParams;
          const bbox = (params.get("bbox") ?? "").split(",").map(Number) as Bbox;
          const zoom = Number(params.get("zoom"));
          if (bbox.length !== 4) return problem(400, "Provide ?bbox=minLng,minLat,maxLng,maxLat");
          const invalid = validateOutlineRequest(bbox, zoom);
          if (invalid) return problem(400, invalid);
          return json(await parcelOutlines(bbox, zoom), { request });
        }),
    },
  },
});
