# Collective Impact

Build a web app called Collective Impact. It helps mission-driven housing developers, Community Development Corporations, and local government housing departments find out what public funding they can use to build affordable housing on a specific piece of land.

The user problem: figuring out which federal, state, and local funding programs apply to a given parcel currently requires reading hundreds of pages of regulations across dozens of agency websites. We make it answerable at an address.

Visual direction. Soft civic-tech, matching the Collective Impact site: sky-teal primary, indigo accent, white and frosted-glass card surfaces on a cool off-white background. Quicksand for headings, Poppins for body. Rounded corners (8px buttons, 16px cards), hairline borders, gentle shadows. The landing hero is a full-bleed photo slideshow under a dark scrim. Design tokens live in `src/styles.css`; components should use them rather than hardcoded colors. Small text must meet WCAG AA contrast.

Landing page sections:

Hero — headline stating that you can find out what funding a parcel qualifies for, subhead explaining it covers federal, state, and local programs, and a single email input with a "Get map access" button

Three-column explanation of the flow: enter an address, see eligible funding and zoning, get a report with next steps

A section naming the audiences served: mission-driven developers, CDCs and nonprofits, local government housing departments

A short section on why this exists, written in plain language

Footer with contact and a link to request a demo call

Email verification flow. After email submission, show a "check your email" confirmation screen. Since this is a prototype, add a visible "Simulate email confirmation" button on that screen that advances to the map. Label it clearly as a prototype shortcut.

Use mock data throughout. No backend, no real authentication.

## Development

You need Node.js 22+ and npm.

```sh
npm install
npm run dev      # http://localhost:8080
```

Other scripts:

- `npm run build` — production build; the Node server bundle is written to `.output/` (run it with `node .output/server/index.mjs`)
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Database (PostGIS)

Parcels and every overlay are stored as PostGIS geometry (EPSG:4326). Locally the database runs in Docker.

One-time setup on macOS (Colima is a free Docker runtime):

```sh
brew install colima docker docker-compose
colima start --cpu 2 --memory 4 --disk 30
cp .env.example .env.local
```

Then:

```sh
npm run db:up        # build and start Postgres 17 + PostGIS on 127.0.0.1:54329
npm run db:migrate   # apply db/migrations/*.sql
npm run db:psql      # open a SQL prompt
npm run db:down      # stop (data is kept in a Docker volume)
```

After a restart of the Mac, run `colima start` before `npm run db:up`.

### Loading data

Each source has its own ingest script. Every run keeps a raw copy under `data/raw/<source>/<date>/` (git-ignored), loads a staging table, then swaps the normalized rows in inside one transaction and records a row in `source_pulls` (publisher, URL, vintage, pull date, the source's own last-edit date, row count, licence note).

```sh
npm run ingest:all            # everything, in dependency order (about 15 minutes)

npm run ingest:parcels        # Tulsa County parcels from INCOG (~285k)
npm run ingest:municipalities # every municipality's city limits in the county (INCOG)
npm run ingest:council        # City of Tulsa council districts
npm run ingest:tif            # TIF districts, dissolved from the parcels' IncrementDist
npm run ingest:hud            # HUD QCT + DDA, newest designation year available
npm run ingest:usda           # USDA rural-ineligible areas (data.gov shapefile)
npm run ingest:oz             # Opportunity Zones (CDFI Fund shapefile)
```

| Table                        | Source                                                                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parcels`                    | INCOG `Parcels_TulsaCo` (data: Tulsa County Assessor). Source-neutral columns; INCOG's own fields stay in `raw`.                                                                         |
| `overlay_tif`                | Derived: INCOG parcels dissolved by the Assessor's `IncrementDist`.                                                                                                                      |
| `overlay_qct`, `overlay_dda` | HUD eGIS, newest vintage.                                                                                                                                                                |
| `overlay_usda_ineligible`    | USDA Rural Development. These are _ineligible_ areas: rural-eligible means outside all of them.                                                                                          |
| `jurisdictions`              | `municipality`: INCOG city-limits layers, one row per municipality with parcels in Tulsa County (a parcel in none is unincorporated). `council_district`: City of Tulsa GIS, Tulsa only. |
| `overlay_oz`                 | CDFI Fund: tracts designated in 2018 under the 2017 Tax Cuts and Jobs Act.                                                                                                               |

`parcel_overlays(parcel_id)` answers which overlays a parcel is in by spatial intersection. It returns a row for every overlay kind, so "in none" is an explicit answer:

- `inside`: more than 99% of the parcel's area is in the overlay
- `partial`: between 1% and 99%
- `outside`: under 1% (slivers from mismatched source boundaries do not count)
- `boundary`: council districts only. The parcel is in Tulsa but sits in a gap between the city-limits and council-district sources, so it is assigned the district it overlaps most (or the nearest one)
- `not_loaded`: that overlay has not been ingested

Every kind is a positive finding. `usda_rural` `inside` means the parcel is in USDA's rural-eligible area (outside the ineligible polygons). A parcel in no municipality gets the name "Unincorporated Tulsa County". Council districts apply only to parcels in Tulsa.

Each row also carries `vintage` (designation year or file date, else the source's last-edit date) and `boundary_basis` (what the boundaries are drawn on: QCT 2026 on 2020 census tracts, Opportunity Zones 2018 on 2010 tracts, DDA 2026 on ZIP code tabulation areas).

Only the source fields the app uses are downloaded. Owner names, mailing addresses, sale prices and dates, exemptions and building details are never requested from the county service, so they are not in the raw copies, staging or `parcels`.

### API

Server routes in this app, all answered from PostGIS (no outside service is called at request time):

| Route                                   | Returns                                                                                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/parcels/search?q=`            | Up to 8 parcels for an address ("112 South Elgin Avenue", "2645 E 5th St") or a county parcel/account number. Matching is scripted string normalization plus trigram similarity.                                                                                        |
| `GET /api/parcels/at?lat=&lng=`         | The parcel under a point. If the point is on a street, rail line or water it says so (`surface`) instead of returning a parcel.                                                                                                                                         |
| `GET /api/parcels/:id`                  | Parcel facts, outline, every overlay result from `parcel_overlays`, and a plain-language `designations.message` (including when the parcel is in none).                                                                                                                 |
| `GET /api/parcels/outlines?bbox=&zoom=` | Parcel outlines for the map view. Served only at zoom 16 and closer and capped at 4,000 (the ones nearest the centre first, with `truncated: true` when the cap cut any), so the browser never loads the whole county.                                                  |
| `GET /api/overlays/:kind`               | One overlay's simplified display boundaries as GeoJSON (about 3 m tolerance, from the `display_geom` column) with its pull record. Intersection checks use the exact geometry. Kinds: `tif`, `qct`, `dda`, `oz`, `usda_ineligible`, `municipality`, `council_district`. |
| `GET /api/sources`                      | Every source currently loaded, with vintage and pull dates.                                                                                                                                                                                                             |

### The map

`/map` is wired to the database through those routes: a search box and click-to-select, a readout from `/api/parcels/:id` (every overlay result with its vintage and pull date, and a plain statement when a parcel is in none), parcel outlines at street level, and a toggle and legend entry for every overlay. Several parcels at one address open a numbered pick list and nothing is auto-selected. The chat's address lookup uses the same search. Shareable links: `/map?parcel=<id>`, `/map?q=<search>`, `/map?layers=all` (or a comma list such as `tif,qct,municipality`).

Floodplains (City of Tulsa and FEMA) and zoning are display-only layers: they are drawn for reference and are not used in any result. The zoning profile, census indicators and several other site tests are not part of the parcel check yet, so the funding list shows "may be eligible" for programs that depend on them.

`src/lib/tulsa-map-data.ts` is sample data kept only for the dashboard, KPI and report pages. The map does not use it.

Only `parcel_type` `parcel` and `condo` are searchable or selectable. Rights-of-way, rail, water and `other` (divided-interest) records never appear in results.

The INCOG service publishes no licence. Before a public launch, get written confirmation from INCOG / the Tulsa County Assessor that the parcel data may be displayed.

Feature plans from earlier development are in `docs/plans/`.
