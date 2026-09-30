-- Landing table for raw features exactly as each source publishes them.
-- Ingest scripts normalize from here into the public tables.
CREATE TABLE staging.features (
  id          bigserial PRIMARY KEY,
  source_key  text NOT NULL,
  attrs       jsonb NOT NULL DEFAULT '{}'::jsonb,
  geom        geometry(Geometry, 4326)
);
CREATE INDEX staging_features_source_idx ON staging.features (source_key);

-- Any polygonal input -> valid MultiPolygon (or NULL when nothing polygonal survives).
CREATE OR REPLACE FUNCTION staging.as_multipolygon(g geometry)
RETURNS geometry(MultiPolygon, 4326)
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN ST_IsEmpty(m) THEN NULL ELSE ST_Multi(m) END
  FROM (SELECT ST_CollectionExtract(ST_MakeValid(g), 3) AS m) s;
$$;
