-- Plain dataset name for the municipal boundaries pull.
UPDATE source_pulls
   SET dataset_name = 'Municipal city limits (INCOG)'
 WHERE source_key = 'incog_city_limits';
