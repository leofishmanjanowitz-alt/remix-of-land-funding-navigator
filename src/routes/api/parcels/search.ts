import { createFileRoute } from "@tanstack/react-router";
import { handle, json, problem } from "@/server/http";
import { searchParcels } from "@/server/parcels";

/** GET /api/parcels/search?q=112 S Elgin Ave — address or parcel-number search. */
export const Route = createFileRoute("/api/parcels/search")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handle(async () => {
          const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
          if (q.length < 2) return problem(400, "Provide a search of at least 2 characters in ?q=");
          if (q.length > 120) return problem(400, "Search text is too long.");
          return json(await searchParcels(q));
        }),
    },
  },
});
