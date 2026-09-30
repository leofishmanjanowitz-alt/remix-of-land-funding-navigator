-- Core schema. All geometry is EPSG:4326 with a GiST index.

-- Raw, source-shaped rows land here first; the app never reads this schema.
CREATE SCHEMA IF NOT EXISTS staging;

-- ---------------------------------------------------------------------------
-- One row per ingest run. Every parcel and overlay row points at its pull, so
-- the app can always say where a fact came from and when it was pulled.
-- ---------------------------------------------------------------------------
CREATE TABLE source_pulls (
  id               serial PRIMARY KEY,
  source_key       text NOT NULL,          -- e.g. 'incog_parcels', 'hud_qct'
  dataset_name     text NOT NULL,
  publisher        text NOT NULL,
  source_url       text NOT NULL,
  vintage          text,                   -- designation year where one applies, e.g. '2026'
  pulled_at        timestamptz NOT NULL DEFAULT now(),
  source_last_edit timestamptz,            -- the source's own last-edit / load date, when published
  record_count     integer,
  license_note     text,
  params           jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes            text,
  -- Exactly one current pull per source; older pulls stay for the record.
  is_current       boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX source_pulls_one_current ON source_pulls (source_key) WHERE is_current;

-- ---------------------------------------------------------------------------
-- Parcels. Source-neutral: the app reads only these columns. Anything specific
-- to one provider stays in `raw`, which the app must not read.
-- ---------------------------------------------------------------------------
CREATE TABLE parcels (
  id                 bigserial PRIMARY KEY,
  pull_id            integer NOT NULL REFERENCES source_pulls (id),
  source_key         text NOT NULL,
  source_record_id   text NOT NULL,        -- the provider's own row id

  parcel_number      text,                 -- official county parcel number, digits only
  account_number     text,
  parcel_type        text NOT NULL DEFAULT 'parcel'
                     CHECK (parcel_type IN ('parcel', 'condo', 'right_of_way', 'rail', 'water', 'other')),

  situs_address      text,                 -- display form, e.g. '112 S ELGIN AV E'
  search_address     text,                 -- normalized form used for matching
  house_number       text,
  street_predir      text,
  street_name        text,
  street_type        text,
  street_postdir     text,
  city               text,
  zip                text,

  owner_name         text,
  legal_description  text,
  land_use           text,
  acres              numeric(12, 4),
  year_built         integer,
  assessed_total     numeric(14, 2),
  land_value         numeric(14, 2),
  improvement_value  numeric(14, 2),

  geom               geometry(MultiPolygon, 4326) NOT NULL,
  -- A point guaranteed to lie inside the parcel (for labels and point lookups).
  label_point        geometry(Point, 4326) NOT NULL,

  raw                jsonb NOT NULL DEFAULT '{}'::jsonb,

  UNIQUE (source_key, source_record_id)
);
CREATE INDEX parcels_geom_gix ON parcels USING gist (geom);
CREATE INDEX parcels_label_point_gix ON parcels USING gist (label_point);
CREATE INDEX parcels_parcel_number_idx ON parcels (parcel_number);
CREATE INDEX parcels_account_number_idx ON parcels (account_number);
CREATE INDEX parcels_house_number_idx ON parcels (house_number);
CREATE INDEX parcels_search_address_trgm ON parcels USING gin (search_address gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Overlays: one table each.
-- ---------------------------------------------------------------------------

-- Tax increment districts, dissolved from county parcels by their assigned district.
CREATE TABLE overlay_tif (
  id            serial PRIMARY KEY,
  pull_id       integer NOT NULL REFERENCES source_pulls (id),
  district_code text NOT NULL,             -- e.g. 'T13'
  name          text NOT NULL,             -- e.g. 'TULSA EAST END DIST C'
  source_label  text NOT NULL,             -- the county's label, verbatim
  parcel_count  integer NOT NULL,
  geom          geometry(MultiPolygon, 4326) NOT NULL,  -- exact union of member parcels
  display_geom  geometry(MultiPolygon, 4326) NOT NULL   -- street gaps closed, for drawing only
);
CREATE INDEX overlay_tif_geom_gix ON overlay_tif USING gist (geom);

-- HUD Qualified Census Tracts.
CREATE TABLE overlay_qct (
  id       serial PRIMARY KEY,
  pull_id  integer NOT NULL REFERENCES source_pulls (id),
  geoid    text NOT NULL,                  -- 11-digit tract GEOID
  name     text,
  vintage  text NOT NULL,                  -- designation year
  geom     geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX overlay_qct_geom_gix ON overlay_qct USING gist (geom);

-- HUD Difficult Development Areas (small-area DDAs are ZIP code tabulation areas).
CREATE TABLE overlay_dda (
  id        serial PRIMARY KEY,
  pull_id   integer NOT NULL REFERENCES source_pulls (id),
  code      text NOT NULL,                 -- ZCTA5 for small-area DDAs, else HUD's area code
  dda_type  text,
  name      text,
  vintage   text NOT NULL,
  geom      geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX overlay_dda_geom_gix ON overlay_dda USING gist (geom);

-- USDA Rural Development publishes where its programs do NOT apply.
-- A site is rural-eligible when it falls outside every polygon here.
CREATE TABLE overlay_usda_ineligible (
  id       serial PRIMARY KEY,
  pull_id  integer NOT NULL REFERENCES source_pulls (id),
  program  text NOT NULL,                  -- e.g. 'sfh_mfh'
  name     text,
  geom     geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX overlay_usda_ineligible_geom_gix ON overlay_usda_ineligible USING gist (geom);

-- City limits and council districts.
CREATE TABLE jurisdictions (
  id       serial PRIMARY KEY,
  pull_id  integer NOT NULL REFERENCES source_pulls (id),
  kind     text NOT NULL CHECK (kind IN ('city_limits', 'council_district')),
  code     text NOT NULL,                  -- e.g. council district number
  name     text NOT NULL,
  detail   text,                           -- e.g. council member
  geom     geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX jurisdictions_geom_gix ON jurisdictions USING gist (geom);
CREATE INDEX jurisdictions_kind_idx ON jurisdictions (kind);

-- Opportunity Zones (2018 designations on 2010 census tracts).
CREATE TABLE overlay_oz (
  id       serial PRIMARY KEY,
  pull_id  integer NOT NULL REFERENCES source_pulls (id),
  geoid    text NOT NULL,                  -- 11-digit 2010 tract GEOID
  vintage  text NOT NULL,
  geom     geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX overlay_oz_geom_gix ON overlay_oz USING gist (geom);
