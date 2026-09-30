/**
 * USDA Rural Development ineligible areas (SFH / MFH) -> overlay_usda_ineligible.
 *
 * USDA publishes where its rural housing programs do NOT apply. The live map
 * service (rdgdwe.sc.egov.usda.gov) refuses outside connections, so this loads
 * the shapefile USDA publishes on data.gov. Run after the parcel ingest.
 */
import { log, pool, replaceCurrent, transaction } from "./lib.ts";
import { fetchShapefile, shapefileToStaging } from "./shapefile.ts";

const SOURCE_KEY = "usda_rural";
const DATASET_PAGE =
  "https://catalog.data.gov/dataset/usda-rural-development-property-eligibility-sfh-mfh";
const ZIP_URL =
  "https://inventory.data.gov/dataset/6a0a8e5a-cd69-4d7f-b5d9-881d6bea0e5a/resource/b711e2fe-4082-4945-b396-45f1665120a3/download/rdsfh_mfh_shapefile_01-24-2024.zip";
/** Date in the published file name. */
const FILE_DATE = "2024-01-24";

const shp = await fetchShapefile(SOURCE_KEY, ZIP_URL, "rdsfh_mfh_shapefile.zip");
await shapefileToStaging(shp, "staging.usda_shp");

const { count } = await transaction(async (client) => {
  const eff = await client.query<{ effective: Date | null; total: string }>(
    "SELECT max(effective_) AS effective, count(*) AS total FROM staging.usda_shp",
  );
  return replaceCurrent(
    client,
    {
      sourceKey: SOURCE_KEY,
      datasetName: "USDA Rural Development Property Eligibility (SFH/MFH) — ineligible areas",
      publisher: "USDA Rural Development",
      sourceUrl: DATASET_PAGE,
      vintage: FILE_DATE,
      sourceLastEdit: eff.rows[0]?.effective ?? null,
      boundaryBasis: "USDA ineligible-area polygons",
      licenseNote: "Creative Commons CC0 (public domain), per data.gov.",
      params: { zip_url: ZIP_URL, national_polygons: Number(eff.rows[0]?.total ?? 0) },
      notes:
        "Polygons are INELIGIBLE areas; a site is rural-eligible when outside all of them. " +
        "Only polygons touching the loaded parcel extent are kept, clipped to that extent. " +
        "USDA's live service was unreachable, so this file may lag the current eligibility map.",
    },
    ["overlay_usda_ineligible"],
    async (pullId) => {
      const res = await client.query(
        `WITH extent AS (
           SELECT ST_Expand(ST_SetSRID(ST_Extent(geom)::geometry, 4326), 0.05) AS box FROM parcels
         )
         INSERT INTO overlay_usda_ineligible (pull_id, program, name, geom)
         SELECT $1, 'sfh_mfh', u.name, g.geom
           FROM staging.usda_shp u, extent e
           CROSS JOIN LATERAL (
             SELECT staging.as_multipolygon(ST_Intersection(ST_MakeValid(u.geom), e.box)) AS geom
           ) g
          WHERE ST_Intersects(u.geom, e.box) AND g.geom IS NOT NULL`,
        [pullId],
      );
      return res.rowCount ?? 0;
    },
  );
});
await pool.query("DROP TABLE IF EXISTS staging.usda_shp");
log(SOURCE_KEY, `loaded ${count} ineligible-area polygons`);
await pool.end();
