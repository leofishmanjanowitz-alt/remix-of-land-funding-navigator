# Real parcel boundaries from Tulsa County

Today the outlined shape is invented — the app draws a rectangle from its own sample list. Tulsa County's Assessor publishes every parcel in the county as a public map service (hosted by INCOG), including the true lot boundary, owner name, legal description, land area, use code and assessed value. I confirmed the service responds and can be searched by address (for example, Elgin Avenue lots come back with boundaries and attributes).

## What changes for you

- Type an address in the assistant. The app looks it up in the county parcel records and draws that lot's **actual surveyed boundary** on the map, then flies to it.
- The detail panel opens with real facts from the county record: owner, legal description, lot size in acres, land use code, year built, assessed value — labelled as coming from the Tulsa County Assessor with the date of the record.
- Funding eligibility, action plans, tasks and reports keep working exactly as now. Those remain the app's own analysis layered on top of the real lot; program data stays illustrative until we wire each source.
- If the address isn't found, the assistant says so and offers close matches on the same street rather than showing a fake shape.
- If the county service is unreachable, the panel says the parcel record couldn't be loaded instead of silently drawing something invented.

## What stays sample data

The dozen or so demo addresses currently in the app only exist in the sample list. Once this is wired, searches go against the county's real inventory, so the demo addresses may not resolve. I'd replace the sample list with a handful of genuine Tulsa addresses so the demo still works out of the box.

## Technical notes

- Source: `https://map11.incog.org/arcgis11wa/rest/services/Parcels_TulsaCo/FeatureServer/0` (Copyright: Tulsa County Assessor). Confirmed live; supports `f=geojson` with `outSR=4326` and pagination, max 2000 records per request.
- New `src/lib/parcel-lookup.ts`:
  - `normalizeAddress()` — county format is `1922 S ELGIN AV E` (uppercase, `AV`/`ST`/`PL` abbreviations, quadrant suffix). Map user input to a `PropertyAddress LIKE` clause on house number + street root; don't require the suffix.
  - `lookupParcels(query)` — returns up to ~8 candidates with geometry plus `ACCT_NUM, PropertyAddress, Owner, Legal, GrossAcre, UseCode, YearBuilt, TotalAcctValue, PropertyZIP`.
  - Never fabricate: return `{ status: "not_found" | "error" | "ok" }` and let the UI render each state.
- `basemap.tsx`: extend `FocusTarget` to accept GeoJSON polygon rings in lat/lng (alongside, or replacing, today's drawing-space points) so the highlight uses the county geometry directly; keep the accent styling, permanent tooltip and `flyToBounds`.
- `map.tsx`: selection state becomes the looked-up parcel record; keep `PARCELS` only for the mock funding/analysis join, keyed by address or by point-in-polygon against the county shape.
- `parcel-chat.tsx`: non-question input runs `lookupParcels` through React Query (cached per normalized query); multiple hits render as pickable candidate chips; misses and service errors get their own plain-language replies. Address lookups stay free.
- Add a citation entry for the Tulsa County Assessor parcel layer and show it on the parcel-facts fields, matching the existing `Cite` system.
- Verify with Playwright: a real address draws a non-rectangular boundary matching the lot, a bogus address shows the not-found reply, and a blocked network shows the error state.
