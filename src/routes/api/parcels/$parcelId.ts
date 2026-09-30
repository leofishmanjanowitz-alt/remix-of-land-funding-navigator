import { createFileRoute } from "@tanstack/react-router";
import { handle, json, problem } from "@/server/http";
import { getParcel } from "@/server/parcels";

/** GET /api/parcels/:parcelId — parcel facts, outline, and its overlay results. */
export const Route = createFileRoute("/api/parcels/$parcelId")({
  server: {
    handlers: {
      GET: ({ params }) =>
        handle(async () => {
          if (!/^\d{1,9}$/.test(params.parcelId))
            return problem(400, "Parcel id must be a number.");
          const parcel = await getParcel(Number(params.parcelId));
          if (!parcel) return problem(404, "No parcel with that id.");
          return json(parcel);
        }),
    },
  },
});
