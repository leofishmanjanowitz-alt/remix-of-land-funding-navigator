-- parcel_overlays v3.
--
-- One or more rows per overlay kind, always, so "in none" is an explicit answer.
--
--   inside      more than 99% of the parcel's area is in the overlay
--   partial     between 1% and 99%
--   outside     under 1% (boundary slivers from mismatched source edges do not count)
--   boundary    council districts only: the parcel is in Tulsa but falls in a gap between
--               the city-limits and council-district sources, so it is assigned the district
--               it overlaps most (or, with no overlap at all, the nearest one)
--   not_loaded  that overlay has not been ingested yet
--
-- Every kind is phrased as a positive finding:
--   usda_rural        'inside' = the parcel is in USDA's rural-ELIGIBLE area, i.e. outside
--                     the ineligible polygons USDA publishes. `share` is the eligible share.
--   municipality      a parcel in no municipality reports 'Unincorporated Tulsa County'.
--   council_district  Tulsa only: a parcel outside Tulsa is always 'outside'.
--
-- `vintage` is the designation year or file date where one applies, otherwise the source's
-- own last-edit date. `boundary_basis` says what the boundaries are drawn on.

DROP FUNCTION IF EXISTS parcel_overlays(bigint);

CREATE FUNCTION parcel_overlays(p_parcel_id bigint)
RETURNS TABLE (
  kind             text,
  status           text,
  code             text,
  name             text,
  share            numeric,
  vintage          text,
  boundary_basis   text,
  source_key       text,
  pulled_at        timestamptz,
  source_last_edit timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH p AS (
    SELECT geom, NULLIF(ST_Area(geom::geography), 0) AS area
    FROM parcels
    WHERE id = p_parcel_id
  ),
  kinds (kind, source_key, sort) AS (
    VALUES
      ('tif',              'incog_tif',               1),
      ('qct',              'hud_qct',                 2),
      ('dda',              'hud_dda',                 3),
      ('oz',               'cdfi_oz',                 4),
      ('usda_rural',       'usda_rural',              5),
      ('municipality',     'incog_city_limits',       6),
      ('council_district', 'tulsa_council_districts', 7)
  ),
  raw_hits AS (
    SELECT 'tif' AS kind, o.district_code AS code, o.name, o.geom
      FROM p JOIN overlay_tif o ON ST_Intersects(p.geom, o.geom)
    UNION ALL
    SELECT 'qct', o.geoid, o.name, o.geom
      FROM p JOIN overlay_qct o ON ST_Intersects(p.geom, o.geom)
    UNION ALL
    SELECT 'dda', o.code, o.name, o.geom
      FROM p JOIN overlay_dda o ON ST_Intersects(p.geom, o.geom)
    UNION ALL
    SELECT 'oz', o.geoid, 'Opportunity Zone tract ' || o.geoid, o.geom
      FROM p JOIN overlay_oz o ON ST_Intersects(p.geom, o.geom)
    UNION ALL
    SELECT j.kind, j.code, j.name, j.geom
      FROM p JOIN jurisdictions j ON ST_Intersects(p.geom, j.geom)
  ),
  all_hits AS (
    SELECT h.kind, h.code, h.name,
           (ST_Area(ST_Intersection(p.geom, h.geom)::geography) / p.area)::numeric AS share
    FROM raw_hits h, p
  ),
  in_tulsa AS (
    SELECT EXISTS (
      SELECT 1 FROM all_hits WHERE kind = 'municipality' AND name = 'Tulsa' AND share >= 0.01
    ) AS yes
  ),
  hits AS (
    -- Council districts only apply inside Tulsa.
    SELECT h.* FROM all_hits h, in_tulsa t
    WHERE h.share >= 0.01 AND (h.kind <> 'council_district' OR t.yes)
  ),
  council_fallback AS (
    -- For a Tulsa parcel with no district at >= 1%: largest overlap, then nearest.
    SELECT j.code, j.name,
           COALESCE((SELECT a.share FROM all_hits a WHERE a.kind = 'council_district' AND a.code = j.code), 0) AS share
    FROM jurisdictions j, p, in_tulsa t
    WHERE j.kind = 'council_district'
      AND t.yes
      AND NOT EXISTS (SELECT 1 FROM hits h WHERE h.kind = 'council_district')
    ORDER BY 3 DESC, ST_Distance(p.geom, j.geom) ASC
    LIMIT 1
  ),
  usda AS (
    -- Share of the parcel covered by USDA-ineligible area (polygons unioned so overlaps count once).
    SELECT COALESCE(
             (SELECT ST_Area(ST_Intersection(p.geom, ST_Union(o.geom))::geography) / p.area
                FROM overlay_usda_ineligible o
               WHERE ST_Intersects(p.geom, o.geom)),
             0)::numeric AS ineligible_share
    FROM p
  ),
  pulls AS (
    SELECT k.kind, k.source_key, k.sort, sp.id AS pull_id, sp.boundary_basis, sp.pulled_at, sp.source_last_edit,
           COALESCE(sp.vintage, to_char(sp.source_last_edit AT TIME ZONE 'UTC', 'YYYY-MM-DD')) AS vintage
    FROM kinds k
    LEFT JOIN source_pulls sp ON sp.source_key = k.source_key AND sp.is_current
  ),
  answers AS (
    -- Overlay not ingested yet.
    SELECT pl.kind, 'not_loaded' AS status, NULL::text AS code, NULL::text AS name, NULL::numeric AS share, pl.sort
    FROM pulls pl
    WHERE pl.pull_id IS NULL

    UNION ALL
    -- Real matches.
    SELECT h.kind, CASE WHEN h.share > 0.99 THEN 'inside' ELSE 'partial' END, h.code, h.name,
           round(LEAST(h.share, 1), 4), pl.sort
    FROM hits h
    JOIN pulls pl ON pl.kind = h.kind AND pl.pull_id IS NOT NULL

    UNION ALL
    -- Tulsa parcel in a gap between the two boundary sources.
    SELECT 'council_district', 'boundary', f.code, f.name, round(LEAST(f.share, 1), 4), pl.sort
    FROM council_fallback f
    JOIN pulls pl ON pl.kind = 'council_district' AND pl.pull_id IS NOT NULL

    UNION ALL
    -- Loaded, but the parcel is in none of its polygons: say so explicitly.
    SELECT pl.kind, 'outside', NULL,
           CASE WHEN pl.kind = 'municipality' THEN 'Unincorporated Tulsa County' END,
           0, pl.sort
    FROM pulls pl
    WHERE pl.pull_id IS NOT NULL
      AND pl.kind <> 'usda_rural'
      AND NOT EXISTS (SELECT 1 FROM hits h WHERE h.kind = pl.kind)
      AND NOT (pl.kind = 'council_district' AND EXISTS (SELECT 1 FROM council_fallback))

    UNION ALL
    -- USDA, as a positive: share of the parcel that is rural-eligible.
    SELECT pl.kind,
           CASE WHEN 1 - u.ineligible_share > 0.99 THEN 'inside'
                WHEN 1 - u.ineligible_share < 0.01 THEN 'outside'
                ELSE 'partial' END,
           NULL,
           CASE WHEN 1 - u.ineligible_share >= 0.01 THEN 'USDA rural-eligible area' END,
           round(LEAST(GREATEST(1 - u.ineligible_share, 0), 1), 4), pl.sort
    FROM pulls pl, usda u
    WHERE pl.pull_id IS NOT NULL AND pl.kind = 'usda_rural'
  )
  SELECT a.kind, a.status, a.code, a.name, a.share,
         pl.vintage, pl.boundary_basis, pl.source_key, pl.pulled_at, pl.source_last_edit
  FROM answers a
  JOIN pulls pl ON pl.kind = a.kind
  WHERE EXISTS (SELECT 1 FROM p)
  ORDER BY a.sort, a.share DESC NULLS LAST, a.code;
$$;
