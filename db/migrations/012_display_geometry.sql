-- Display geometry: a simplified copy of each overlay used ONLY for drawing the map.
-- Intersection checks (parcel_overlays) keep using the exact `geom` column.
--
-- Tolerance 0.00003 degrees (about 3 m): at most ~3 m from the true boundary, which is
-- finer than the boundaries' own positional accuracy, and cuts the payload by ~5x.
-- Generated columns keep it in step with `geom` whenever an ingest replaces the rows.

ALTER TABLE overlay_qct
  ADD COLUMN display_geom geometry(MultiPolygon, 4326)
  GENERATED ALWAYS AS (ST_Multi(ST_SimplifyPreserveTopology(geom, 0.00003))) STORED;

ALTER TABLE overlay_dda
  ADD COLUMN display_geom geometry(MultiPolygon, 4326)
  GENERATED ALWAYS AS (ST_Multi(ST_SimplifyPreserveTopology(geom, 0.00003))) STORED;

ALTER TABLE overlay_oz
  ADD COLUMN display_geom geometry(MultiPolygon, 4326)
  GENERATED ALWAYS AS (ST_Multi(ST_SimplifyPreserveTopology(geom, 0.00003))) STORED;

ALTER TABLE overlay_usda_ineligible
  ADD COLUMN display_geom geometry(MultiPolygon, 4326)
  GENERATED ALWAYS AS (ST_Multi(ST_SimplifyPreserveTopology(geom, 0.00003))) STORED;

ALTER TABLE jurisdictions
  ADD COLUMN display_geom geometry(MultiPolygon, 4326)
  GENERATED ALWAYS AS (ST_Multi(ST_SimplifyPreserveTopology(geom, 0.00003))) STORED;

-- TIF already has a display_geom (street gaps closed, see scripts/ingest/tif.ts).
-- Simplify it the same way; the ingest now does this on load.
UPDATE overlay_tif
   SET display_geom = ST_Multi(ST_SimplifyPreserveTopology(display_geom, 0.00003));
