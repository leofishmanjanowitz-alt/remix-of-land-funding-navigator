import { createFileRoute } from "@tanstack/react-router";
import { handle, json, problem } from "@/server/http";
import { parcelsAt } from "@/server/parcels";

/** GET /api/parcels/at?lat=36.1565&lng=-95.9874 — the parcel under a map click. */
export const Route = createFileRoute("/api/parcels/at")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handle(async () => {
          const params = new URL(request.url).searchParams;
          const lat = Number(params.get("lat"));
          const lng = Number(params.get("lng"));
          if (
            !params.get("lat") ||
            !params.get("lng") ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            return problem(400, "Provide numeric ?lat= and ?lng=");
          }
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return problem(400, "lat/lng are out of range.");
          }
          return json(await parcelsAt(lng, lat), { request });
        }),
    },
  },
});
