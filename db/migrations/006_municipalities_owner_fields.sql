-- 1. Jurisdictions: every municipality in Tulsa County (not only Tulsa's city limits).
--    Parcels in no municipality are unincorporated; council districts stay Tulsa-only.
DELETE FROM jurisdictions WHERE kind = 'city_limits';
UPDATE source_pulls
   SET is_current = false,
       notes = concat_ws(' ', notes, 'Superseded by incog_city_limits, which covers every municipality in the county.')
 WHERE source_key = 'tulsa_city_limits';
ALTER TABLE jurisdictions DROP CONSTRAINT jurisdictions_kind_check;
ALTER TABLE jurisdictions ADD CONSTRAINT jurisdictions_kind_check
  CHECK (kind IN ('municipality', 'council_district'));

-- 2. No owner data. Eligibility does not depend on who owns a parcel, so neither the
--    owner's name nor their mailing address is stored anywhere in the database.
ALTER TABLE parcels DROP COLUMN owner_name;
UPDATE parcels
   SET raw = raw - ARRAY['Owner', 'Name1', 'Name2', 'BusinessName', 'Address1', 'Address2', 'City', 'State', 'ZIPCode']
 WHERE raw ?| ARRAY['Owner', 'Name1', 'Name2', 'BusinessName', 'Address1', 'Address2', 'City', 'State', 'ZIPCode'];
UPDATE staging.features
   SET attrs = attrs - ARRAY['Owner', 'Name1', 'Name2', 'BusinessName', 'Address1', 'Address2', 'City', 'State', 'ZIPCode']
 WHERE source_key = 'incog_parcels';
