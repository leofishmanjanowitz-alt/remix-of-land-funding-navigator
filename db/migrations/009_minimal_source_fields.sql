-- Keep only the source fields that are actually used.
--
-- staging (INCOG rows): the fields the normalizer reads, plus the three that feed
-- derived data. Everything else the county publishes (sale price, sale date,
-- homestead exemption, building details, ...) is no longer downloaded or stored.
UPDATE staging.features f
   SET attrs = COALESCE(
     (SELECT jsonb_object_agg(e.key, e.value)
        FROM jsonb_each(f.attrs) e
       WHERE e.key = ANY (ARRAY[
         'OBJECTID', 'ParcelNo', 'AccountNo', 'PAR_TYPE', 'PropertyAddress', 'PropertyCity', 'PropertyZIP',
         'Legal', 'UseCode', 'LEADescription', 'GrossAcre', 'YearBuilt',
         'TotalAcctValue', 'TotalLandValue', 'TotalImpValue', 'IncrementDist', 'LoadDate'])),
     '{}'::jsonb)
 WHERE f.source_key = 'incog_parcels';

-- parcels.raw: only the source-specific values with no normalized column of their own.
UPDATE parcels p
   SET raw = COALESCE(
     (SELECT jsonb_object_agg(e.key, e.value)
        FROM jsonb_each(p.raw) e
       WHERE e.key = ANY (ARRAY['PAR_TYPE', 'IncrementDist', 'LoadDate'])),
     '{}'::jsonb);

-- What each overlay's boundaries are drawn on (e.g. which census-tract vintage).
ALTER TABLE source_pulls ADD COLUMN boundary_basis text;
UPDATE source_pulls SET boundary_basis = '2020 census tracts' WHERE source_key = 'hud_qct';
UPDATE source_pulls SET boundary_basis = 'ZIP code tabulation areas' WHERE source_key = 'hud_dda';
UPDATE source_pulls SET boundary_basis = '2010 census tracts' WHERE source_key = 'cdfi_oz';
UPDATE source_pulls SET boundary_basis = 'USDA ineligible-area polygons' WHERE source_key = 'usda_rural';
UPDATE source_pulls SET boundary_basis = 'county parcels' WHERE source_key = 'incog_tif';
UPDATE source_pulls SET boundary_basis = 'city limits' WHERE source_key = 'incog_city_limits';
UPDATE source_pulls SET boundary_basis = 'council district boundaries' WHERE source_key = 'tulsa_council_districts';
