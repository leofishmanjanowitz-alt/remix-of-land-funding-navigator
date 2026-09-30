-- Address search matches on the street name (exact, prefix, or fuzzy).
CREATE INDEX parcels_street_name_idx ON parcels (street_name text_pattern_ops);
CREATE INDEX parcels_street_name_trgm ON parcels USING gin (street_name gin_trgm_ops);
CREATE INDEX parcels_house_street_idx ON parcels (house_number, street_name);
