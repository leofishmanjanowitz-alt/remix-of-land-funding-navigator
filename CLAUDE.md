# Collective Impact — parcel map (Tulsa County)

A TanStack Start + React app. `/map` answers one question for a Tulsa County parcel: **which geographies
does it fall in** (TIF district, Qualified Census Tract, Difficult Development Area, Opportunity Zone,
USDA rural eligibility, city limits, council district), with the vintage and pull date of every boundary.
Parcels and overlays live in PostGIS; the app reads them through its own server routes.

## Run it

```sh
colima start                 # macOS Docker runtime (once per boot)
npm run db:up                # Postgres 17 + PostGIS on 127.0.0.1:54329
npm run db:migrate           # apply db/migrations/*.sql
npm run ingest:all           # load every source (~15 min; each source also has its own ingest:* script)
npm run dev                  # http://localhost:8080 (reads DATABASE_URL from .env.local)
```

`cp .env.example .env.local` first. Node 24: the scripts run TypeScript directly (`node scripts/x.ts`), so
they may only use erasable syntax (no enums or parameter properties) and must import with `.ts` extensions.

## Check it

```sh
npm run verify   # known-parcel + API + headless-browser checks. Exits 1 on any failure
npm run bench    # 10 searches and 10 map clicks timed in headless Chrome, action -> readout on screen
npx tsc --noEmit -p . && npx tsc --noEmit -p scripts && npm run build
```

- Both scripts need the app and database running and Google Chrome installed (`CHROME_PATH` overrides where
  it is). `VERIFY_BASE_URL` / `BENCH_BASE_URL` point them at another server, e.g. a production build:
  `npm run build && node .output/server/index.mjs` (with `DATABASE_URL` and `PORT` set).
- `verify` asserts the known parcels (112 S ELGIN AV E, 320 N BOSTON AV E, 18919 W WEKIWA RD S, 2645 E 5 ST S,
  305 E IMPERIAL ST S), the street-click and out-of-county cases, the readout wording, and that each of the ten
  map layers draws when switched on and is removed when switched off. `VERIFY_SKIP_BROWSER=1` skips the browser part.
- Local numbers for reference: searches and clicks take about 30 ms (production build) to 50 ms (dev) end to end.
- Lint: `npm run lint` still reports ~160 prettier errors in untouched sample-data files under `src/lib`
  (and `tulsa-chat.ts`, deliberately left unformatted). Files written for the real-data work lint clean.

## Where things are

| Path                             | What                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db/migrations/`                 | Numbered SQL. `parcels` is source-neutral; one table per overlay; `parcel_overlays(id)` does the intersections; `display_geom` columns hold simplified copies for drawing |
| `scripts/ingest/`                | One script per source. Each keeps a raw copy in `data/raw/` (git-ignored), loads staging, swaps in atomically, records a `source_pulls` row                               |
| `src/server/`, `src/routes/api/` | Server-only code and the JSON routes: `/api/parcels/{search,at,outlines,:id}`, `/api/overlays/:kind`, `/api/sources`                                                      |
| `src/routes/map.tsx`             | The map page: state, search, click, side panel                                                                                                                            |
| `src/components/`                | `basemap` (Leaflet), `layer-control`, `map-legend`, `parcel-readout`, `parcel-search`, `candidate-list`, `parcel-chat`                                                    |
| `src/lib/`                       | `overlays-meta` (layers and wording), `overlay-text` (readout sentences), `parcel-api`/`parcel-types` (client + shared types), `address` (address normalizer)             |
| `src/lib/tulsa-map-data.ts`      | **Sample data** for the dashboard, KPI and report pages only. The map does not use it                                                                                     |

## Decisions (do not undo without asking)

**Data**

- PostGIS from the start; all geometry EPSG:4326 with GiST indexes. No flat GeoJSON as a store.
- Overlay checks are spatial intersections in the database, never calls to outside services at click time.
  Overlap under 1% of the parcel counts as outside, over 99% as inside, between is `partial` with its share.
- Sources: INCOG parcels (Tulsa County Assessor data), HUD QCT and DDA (newest vintage, 2026), CDFI Fund
  Opportunity Zones (2018 designations), USDA rural, INCOG city limits, City of Tulsa council districts.
  TIF is dissolved from the parcels' `IncrementDist`. A third-party TIF layer (J_Nickol) is deliberately not used.
- USDA publishes where its programs do not apply, so rural-eligible means outside those polygons.
- Council districts apply to Tulsa only. A Tulsa parcel in a gap between sources gets the largest-overlap (else
  nearest) district, status `boundary`. A parcel in no city reads "Unincorporated Tulsa County".
- No owner names, mailing addresses, sale prices or dates are stored or downloaded. Only `parcel` and `condo`
  records are searchable or selectable (never right-of-way, rail, water or `other`).
- The INCOG service publishes no licence. Get written confirmation from INCOG / the Assessor before a public launch.

**Map (steps 5-6)**

- Several parcels at one address (2645 E 5th St has 7) show a numbered pick list with every outline on the map.
  Never auto-select among several. The chat's lookup uses the same search and follows the same rule.
- Outlines are served only at zoom 16+, capped at 4,000 (nearest the centre first). Never load the whole county.
- Overlays are drawn from simplified `display_geom` (about 3 m); intersections use the exact `geom`.
- Floodplain (City and FEMA) and zoning are display-only: labelled as such, never used in a result.
- Wording: a council result by distance reads "Not in a mapped council district — nearest is District N."; by
  overlap "District N (on boundary)."; a click on a street reads "That's a street or right-of-way, not a parcel.";
  a parcel in none of the five says so plainly.
- **The real-parcel readout is geographies only.** No funding-program list, action plan or eligibility for real
  parcels. The program logic (`programsFromFacts`, `lib/real-facts.ts`) is kept but unused for them.
- Reports are not rebuilt for real parcels: the button stays, with an explanation.
- Layers that have no real source are not shown at all. The layer panel starts collapsed below 768 px and the
  legend below 640 px. Every layer must stay toggleable (`verify` checks this).

**Do not touch** the dashboard, KPI and report pages, or the scripted chat answers. `tulsa-map-data.ts` stays
because they depend on it. The dashboard's sample links (`/map?parcel=parcel-N[&report=true]`) must keep working.

## Gotchas

- Lovable was removed. Plain Vite config, npm (not Bun), `package-lock.json`.
- `main` may still be watched by a Lovable project; `real-data` is the working branch. Open PRs, do not push to `main`.
- Leaflet re-flies to the selected parcel whenever its effect re-runs: keep that effect keyed on the parcel id.
- The in-app browser pane is only ~460 px wide. Use headless Chrome (`scripts/lib/cdp.ts`) for layout checks.
- Shareable links: `/map?parcel=<id>`, `/map?q=<search>`, `/map?layers=all` (or `none`, or a list like `tif,qct`).
- Plans from the earlier prototype are in `docs/plans/`.
