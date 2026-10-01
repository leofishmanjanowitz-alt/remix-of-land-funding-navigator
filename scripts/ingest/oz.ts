/**
 * Qualified Opportunity Zones -> overlay_oz.
 *
 * Source: CDFI Fund shapefile of the 8,764 census tracts designated in 2018
 * under the 2017 Tax Cuts and Jobs Act (2010 tract boundaries).
 * Run after the parcel ingest.
 */
import { log, pool, replaceCurrent, transaction } from "./lib.ts";
import { fetchShapefile, shapefileToStaging } from "./shapefile.ts";

const SOURCE_KEY = "cdfi_oz";
const PAGE = "https://www.cdfifund.gov/opportunity-zones";
const ZIP_URL =
  "https://www.cdfifund.gov/system/files/documents/opportunity-zones=8764.-9-10-2019.zip";
/** Tulsa County, Oklahoma. */
const COUNTY_GEOID = "40143";

const shp = await fetchShapefile(SOURCE_KEY, ZIP_URL, "opportunity-zones.zip");
await shapefileToStaging(shp, "staging.oz_shp");

const { count } = await transaction(async (client) => {
  const total = await client.query<{ n: string }>("SELECT count(*) AS n FROM staging.oz_shp");
  return replaceCurrent(
    client,
    {
      sourceKey: SOURCE_KEY,
      datasetName: "Designated Qualified Opportunity Zones (2018 designations)",
      publisher: "CDFI Fund, U.S. Department of the Treasury",
      sourceUrl: PAGE,
      vintage: "2018",
      // Date in the published shapefile's name.
      sourceLastEdit: new Date("2019-09-10T00:00:00Z"),
      boundaryBasis: "2010 census tracts",
      licenseNote: "U.S. federal government work; public domain.",
      params: {
        zip_url: ZIP_URL,
        county_geoid: COUNTY_GEOID,
        national_tracts: Number(total.rows[0]?.n ?? 0),
      },
      notes:
        "Tracts designated in 2018 under the 2017 Tax Cuts and Jobs Act, on 2010 census tract boundaries. " +
        "Official list: IRS Notice 2018-48.",
    },
    ["overlay_oz"],
    async (pullId) => {
      const res = await client.query(
        `INSERT INTO overlay_oz (pull_id, geoid, vintage, geom)
         SELECT $1, o.censustrac, '2018', g.geom
           FROM staging.oz_shp o
           CROSS JOIN LATERAL (SELECT staging.as_multipolygon(o.geom) AS geom) g
          WHERE o.censustrac LIKE $2 AND g.geom IS NOT NULL`,
        [pullId, `${COUNTY_GEOID}%`],
      );
      return res.rowCount ?? 0;
    },
  );
});
await pool.query("DROP TABLE IF EXISTS staging.oz_shp");
log(SOURCE_KEY, `loaded ${count} Tulsa County opportunity zone tracts`);
await pool.end();
