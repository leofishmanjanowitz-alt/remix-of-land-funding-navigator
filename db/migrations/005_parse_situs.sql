-- Splits a Tulsa County situs address such as '112 S ELGIN AV E' into parts.
-- Layout: <house number> [direction] <street name> [street type] [quadrant].
CREATE OR REPLACE FUNCTION staging.parse_situs(
  addr text,
  OUT situs text,
  OUT house_number text,
  OUT predir text,
  OUT street_name text,
  OUT street_type text,
  OUT postdir text
)
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  tok text[];
  n int;
BEGIN
  situs := NULLIF(regexp_replace(upper(btrim(COALESCE(addr, ''))), '\s+', ' ', 'g'), '');
  IF situs IS NULL OR situs !~ '^\d' THEN
    RETURN;  -- no usable street address; situs is kept as published
  END IF;

  tok := string_to_array(situs, ' ');
  house_number := tok[1];
  tok := tok[2:];
  n := COALESCE(array_length(tok, 1), 0);

  IF n > 1 AND tok[1] IN ('N', 'S', 'E', 'W') THEN
    predir := tok[1];
    tok := tok[2:];
    n := n - 1;
  END IF;
  IF n > 1 AND tok[n] IN ('N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW') THEN
    postdir := tok[n];
    tok := tok[1:n - 1];
    n := n - 1;
  END IF;
  IF n > 1 AND tok[n] IN ('AV', 'AVE', 'ST', 'PL', 'BV', 'BLVD', 'DR', 'CT', 'RD', 'TL', 'TRL', 'WY',
                          'HY', 'HWY', 'CR', 'CIR', 'TE', 'TER', 'LN', 'PK', 'PKWY', 'EX', 'EXPY', 'TR') THEN
    street_type := tok[n];
    tok := tok[1:n - 1];
  END IF;
  street_name := NULLIF(array_to_string(tok, ' '), '');
END;
$$;
