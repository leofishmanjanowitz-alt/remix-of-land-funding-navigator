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

npm run ingest:jurisdictions  # City of Tulsa city limits + council districts
npm run ingest:parcels        # Tulsa County parcels from INCOG (~285k)
npm run ingest:tif            # TIF districts, dissolved from the parcels' IncrementDist
npm run ingest:hud            # HUD QCT + DDA, newest designation year available
npm run ingest:usda           # USDA rural-ineligible areas (data.gov shapefile)
npm run ingest:oz             # Opportunity Zones (CDFI Fund shapefile)
```

| Table                        | Source                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `parcels`                    | INCOG `Parcels_TulsaCo` (data: Tulsa County Assessor). Source-neutral columns; INCOG's own fields stay in `raw`. |
| `overlay_tif`                | Derived: INCOG parcels dissolved by the Assessor's `IncrementDist`.                                              |
| `overlay_qct`, `overlay_dda` | HUD eGIS, newest vintage.                                                                                        |
| `overlay_usda_ineligible`    | USDA Rural Development. These are _ineligible_ areas: rural-eligible means outside all of them.                  |
| `jurisdictions`              | City of Tulsa GIS: city limits and council districts.                                                            |
| `overlay_oz`                 | CDFI Fund: tracts designated in 2018 under the 2017 Tax Cuts and Jobs Act.                                       |

`parcel_overlays(parcel_id)` answers which overlays a parcel is in by spatial intersection, returning `inside`, `partial`, `outside` or `not_loaded` for every overlay kind.

The INCOG service publishes no licence. Before a public launch, get written confirmation from INCOG / the Tulsa County Assessor that the parcel data may be displayed.

Feature plans from earlier development are in `docs/plans/`.
