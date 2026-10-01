/**
 * Tax increment districts -> overlay_tif.
 *
 * Built from the county's own records: INCOG parcels dissolved by the
 * `IncrementDist` the Assessor assigns to each parcel. No third-party TIF
 * layer is read. Run after the parcel ingest.
 */
import { log, pool, replaceCurrent, transaction } from "./lib.ts";

const SOURCE_KEY = "incog_tif";
const PARCEL_KEY = "incog_parcels";
/** Feet. Streets are separate right-of-way parcels, so districts dissolve into blocks;
 *  closing by this distance joins the blocks for display without changing `geom`. */
const CLOSE_FT = 60;

const { count } = await transaction(async (client) => {
  const parent = await client.query<{
    id: number;
    source_url: string;
    source_last_edit: Date | null;
    pulled_at: Date;
  }>(
    "SELECT id, source_url, source_last_edit, pulled_at FROM source_pulls WHERE source_key = $1 AND is_current",
    [PARCEL_KEY],
  );
  const parcels = parent.rows[0];
  if (!parcels)
    throw new Error("No current INCOG parcel pull. Run `npm run ingest:parcels` first.");

  return replaceCurrent(
    client,
    {
      sourceKey: SOURCE_KEY,
      datasetName: "Tax increment districts (dissolved from parcel IncrementDist)",
      publisher: "Derived from Tulsa County Assessor parcel records via INCOG",
      sourceUrl: parcels.source_url,
      sourceLastEdit: parcels.source_last_edit,
      boundaryBasis: "county parcels",
      licenseNote: "Derived dataset; same terms as the INCOG parcel pull it was built from.",
      params: { derived_from_pull: parcels.id, field: "IncrementDist", display_close_ft: CLOSE_FT },
      notes:
        "District membership is the Assessor's per-parcel assignment. geom is the exact union of member parcels; display_geom closes street gaps for drawing only.",
    },
    ["overlay_tif"],
    async (pullId) => {
      const res = await client.query(
        `WITH members AS (
           SELECT btrim(attrs ->> 'IncrementDist') AS label, staging.as_multipolygon(geom) AS geom
             FROM staging.features
            WHERE source_key = $2 AND NULLIF(btrim(attrs ->> 'IncrementDist'), '') IS NOT NULL
         ),
         dissolved AS (
           SELECT label, count(*) AS parcel_count, ST_Union(geom) AS geom
             FROM members WHERE geom IS NOT NULL GROUP BY label
         )
         INSERT INTO overlay_tif (pull_id, district_code, name, source_label, parcel_count, geom, display_geom)
         SELECT $1,
                btrim(split_part(label, '-', 1)),
                btrim(substr(label, strpos(label, '-') + 1)),
                label,
                parcel_count,
                staging.as_multipolygon(geom),
                staging.as_multipolygon(
                  ST_SimplifyPreserveTopology(
                    ST_Transform(
                      ST_Buffer(ST_Buffer(ST_Transform(geom, 2267), $3, 'join=mitre'), -$3::float, 'join=mitre'),
                      4326),
                    0.00003))
           FROM dissolved`,
        [pullId, PARCEL_KEY, CLOSE_FT],
      );
      return res.rowCount ?? 0;
    },
  );
});
log(SOURCE_KEY, `built ${count} districts`);
await pool.end();
