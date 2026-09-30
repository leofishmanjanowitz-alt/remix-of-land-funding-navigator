import { createFileRoute } from "@tanstack/react-router";
import { handle, json } from "@/server/http";
import { currentSources } from "@/server/overlays";

/** GET /api/sources — every data source currently loaded, with pull dates and vintages. */
export const Route = createFileRoute("/api/sources")({
  server: {
    handlers: {
      GET: () => handle(async () => json({ sources: await currentSources() })),
    },
  },
});
