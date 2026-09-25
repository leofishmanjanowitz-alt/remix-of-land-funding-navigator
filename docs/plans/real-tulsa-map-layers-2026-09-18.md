# Real Tulsa map layers

Yes — the City of Tulsa and INCOG publish their map data openly, so the map can show the real boundaries instead of the illustrative shapes drawn today. This adds three genuine layers: TIF districts, Tulsa's floodplains, and zoning.

## What changes for you

- **TIF districts** — actual incentive district boundaries from the city, clickable to see the district name.
- **Floodplains** — Tulsa's own regulatory floodplain, shown alongside the FEMA flood layer already available.
- **Zoning** — real zoning polygons for Tulsa County, with the zoning class shown on click.
- Each layer keeps its existing on/off checkbox in the Map layers panel, and each gets a source note naming the city or INCOG and the date the copy was taken.
- Layers load live from the city. If the city's servers are slow or down, the map quietly falls back to a saved copy stored in the app and shows a small "showing saved copy" note.
- The illustrative dashed rectangles for these three stay only as the saved fallback artwork is replaced; other layers (Opportunity Zone, QCT, USDA, etc.) are unchanged for now.

## Technical outline

- New `src/lib/tulsa-gis.ts`: endpoint definitions and a `fetchLayer(id)` helper that queries the ArcGIS REST services with `f=geojson&outSR=4326`, validates the FeatureCollection shape, and returns `{ data, source: "live" | "cached" }`.
  - TIF and floodplain: City of Tulsa Open Data ArcGIS services (`gis2-cityoftulsa.opendata.arcgis.com`).
  - Zoning: `map11.incog.org/arcgis11wa/rest/services/Zoning_TulsaCo/FeatureServer/0`.
  - Exact layer IDs confirmed by querying each service directory during implementation before wiring them up.
- Saved fallbacks committed as trimmed GeoJSON under `src/data/` (geometry simplified, only the fields used for labels kept) so bundle size stays reasonable.
- `src/components/basemap.tsx` gains a generic `geoLayers` prop: for each active real layer it creates an `L.geoJSON` layer with styling from the existing layer color tokens, binds a popup with the feature's name/class, and removes it on toggle off. This runs beside the existing FEMA WMS layer and SVG overlay.
- `src/routes/map.tsx` owns the fetch state (React Query, cached per layer), passes results into `BaseMap`, and marks the three layers in `LAYERS` as real-data backed so `MapCanvas` stops drawing their placeholder rectangles.
- `src/components/layer-control.tsx` shows a per-layer status line: loading, live, or saved copy.
- Verification with Playwright: toggle each of the three layers, confirm polygons render over Tulsa, confirm a popup opens, and confirm the saved-copy path renders when the network call is blocked.
