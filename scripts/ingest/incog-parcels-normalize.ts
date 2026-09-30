/**
 * INCOG staging rows -> normalized `parcels`.
 * This is the only place that knows INCOG's field names.
 */
import type pg from "pg";
import type { LayerInfo, PullMeta } from "./lib.ts";

const SOURCE_KEY = "incog_parcels";

const LICENSE =
  "Data: Tulsa County Assessor, served by INCOG. No licence is published for the service. " +
  "The Assessor's site disclaimer applies (data developed for ad valorem taxation; no liability for errors). " +
  "Get written confirmation from INCOG/Assessor before public display.";

type Deps = {
  url: string;
  info: LayerInfo;
  transaction: <T>(fn: (client: pg.PoolClient) => Promise<T>) => Promise<T>;
  replaceCurrent: (
    client: pg.PoolClient,
    meta: PullMeta,
    tables: string[],
    load: (pullId: number) => Promise<number>,
  ) => Promise<{ pullId: number; count: number }>;
  log: (sourceKey: string, message: string) => void;
};

const num = (field: string) => `NULLIF(a ->> '${field}', '')::numeric`;

export async function normalizeIncogParcels({ url, info, transaction, replaceCurrent, log }: Deps) {
  const { count } = await transaction(async (client) => {
    // The county stamps every row with the date it loaded the table.
    const loaded = await client.query<{ load_date: Date | null }>(
      `SELECT to_timestamp(max((attrs ->> 'LoadDate')::bigint) / 1000.0) AS load_date
         FROM staging.features WHERE source_key = $1`,
      [SOURCE_KEY],
    );

    return replaceCurrent(
      client,
      {
        sourceKey: SOURCE_KEY,
        datasetName: "Tulsa County Parcels (Parcels_TulsaCo)",
        publisher: "INCOG (data: Tulsa County Assessor)",
        sourceUrl: url,
        sourceLastEdit: loaded.rows[0]?.load_date ?? info.dataLastEdit,
        licenseNote: LICENSE,
        notes: info.description || null,
      },
      ["parcels"],
      async (pullId) => {
        const res = await client.query(
          `INSERT INTO parcels (
             pull_id, source_key, source_record_id,
             parcel_number, account_number, parcel_type,
             situs_address, search_address, house_number, street_predir, street_name, street_type, street_postdir,
             city, zip, legal_description, land_use,
             acres, year_built, assessed_total, land_value, improvement_value,
             geom, label_point, raw)
           SELECT
             $1, $2, a ->> 'OBJECTID',
             NULLIF(regexp_replace(COALESCE(a ->> 'ParcelNo', ''), '\\D', '', 'g'), ''),
             NULLIF(a ->> 'AccountNo', ''),
             CASE a ->> 'PAR_TYPE'
               WHEN 'PARCEL' THEN 'parcel'
               WHEN 'CONDO' THEN 'condo'
               WHEN 'ROW' THEN 'right_of_way'
               WHEN 'SUBD_ROW' THEN 'right_of_way'
               WHEN 'UNPLAT_ROW' THEN 'right_of_way'
               WHEN 'RAIL' THEN 'rail'
               WHEN 'UNPLAT_RAIL' THEN 'rail'
               WHEN 'ARK_RIV' THEN 'water'
               ELSE 'other'
             END,
             ps.situs, ps.situs, ps.house_number, ps.predir, ps.street_name, ps.street_type, ps.postdir,
             NULLIF(btrim(a ->> 'PropertyCity'), ''),
             NULLIF(left(regexp_replace(COALESCE(a ->> 'PropertyZIP', ''), '\\D', '', 'g'), 5), ''),
             NULLIF(btrim(a ->> 'Legal'), ''),
             COALESCE(NULLIF(btrim(a ->> 'UseCode'), ''), NULLIF(btrim(a ->> 'LEADescription'), '')),
             ${num("GrossAcre")},
             NULLIF(${num("YearBuilt")}, 0)::integer,
             ${num("TotalAcctValue")}, ${num("TotalLandValue")}, ${num("TotalImpValue")},
             g.geom, ST_PointOnSurface(g.geom),
             jsonb_strip_nulls(jsonb_build_object(
               'PAR_TYPE', a -> 'PAR_TYPE', 'IncrementDist', a -> 'IncrementDist', 'LoadDate', a -> 'LoadDate'))
           FROM (SELECT attrs AS a, staging.as_multipolygon(geom) AS geom
                   FROM staging.features WHERE source_key = $2) g
           CROSS JOIN LATERAL staging.parse_situs(g.a ->> 'PropertyAddress') ps
           WHERE g.geom IS NOT NULL`,
          [pullId, SOURCE_KEY],
        );
        return res.rowCount ?? 0;
      },
    );
  });
  await transaction((client) => client.query("ANALYZE parcels"));
  log(SOURCE_KEY, `loaded ${count} rows into parcels`);
}
