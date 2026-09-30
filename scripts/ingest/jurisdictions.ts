/**
 * City of Tulsa city limits and council districts -> jurisdictions.
 * Source: City of Tulsa GIS open data (ArcGIS Online, org XkZ90iCdbTJ9oNXl).
 */
import {
  clearStaging,
  layerInfo,
  log,
  pool,
  queryAll,
  rawDir,
  replaceCurrent,
  saveRaw,
  stageFeatures,
  transaction,
} from "./lib.ts";

const BASE = "https://services2.arcgis.com/XkZ90iCdbTJ9oNXl/arcgis/rest/services";
const PUBLISHER = "City of Tulsa GIS";
const LICENSE =
  "City of Tulsa open data. Licence terms not yet confirmed; verify before public launch.";

type Source = {
  sourceKey: string;
  datasetName: string;
  url: string;
  kind: "city_limits" | "council_district";
  /** SQL expressions over staging attrs `a`. */
  code: string;
  name: string;
  detail: string;
};

const SOURCES: Source[] = [
  {
    sourceKey: "tulsa_city_limits",
    datasetName: "Tulsa City Limits",
    url: `${BASE}/TulsaCityLimits/FeatureServer/0`,
    kind: "city_limits",
    code: "COALESCE(NULLIF(a ->> 'FULLFIPS', ''), 'tulsa')",
    name: "COALESCE(NULLIF(a ->> 'NAME', ''), 'City of Tulsa')",
    detail: "NULL",
  },
  {
    sourceKey: "tulsa_council_districts",
    datasetName: "Tulsa City Council Districts",
    url: `${BASE}/Council_Districts/FeatureServer/0`,
    kind: "council_district",
    code: "a ->> 'DISTRICTID'",
    name: "COALESCE(NULLIF(a ->> 'NAME', ''), 'District ' || (a ->> 'DISTRICTID'))",
    detail: "NULLIF(a ->> 'REPNAME', '')",
  },
];

for (const src of SOURCES) {
  const info = await layerInfo(src.url);
  const dir = await rawDir(src.sourceKey);
  await clearStaging(src.sourceKey);
  const fetched = await queryAll(src.url, {
    onPage: async (features, page) => {
      await saveRaw(dir, `page-${String(page).padStart(4, "0")}.geojson`, {
        type: "FeatureCollection",
        features,
      });
      await stageFeatures(src.sourceKey, features);
    },
  });
  log(
    src.sourceKey,
    `fetched ${fetched} features (source last edited ${info.dataLastEdit?.toISOString() ?? "unknown"})`,
  );

  const { count } = await transaction((client) =>
    replaceCurrent(
      client,
      {
        sourceKey: src.sourceKey,
        datasetName: src.datasetName,
        publisher: PUBLISHER,
        sourceUrl: src.url,
        sourceLastEdit: info.dataLastEdit,
        licenseNote: LICENSE,
      },
      ["jurisdictions"],
      async (pullId) => {
        const res = await client.query(
          `INSERT INTO jurisdictions (pull_id, kind, code, name, detail, geom)
           SELECT $1, $2, ${src.code}, ${src.name}, ${src.detail}, staging.as_multipolygon(s.geom)
           FROM (SELECT attrs AS a, geom FROM staging.features WHERE source_key = $3) s
           WHERE staging.as_multipolygon(s.geom) IS NOT NULL`,
          [pullId, src.kind, src.sourceKey],
        );
        return res.rowCount ?? 0;
      },
    ),
  );
  log(src.sourceKey, `loaded ${count} rows into jurisdictions`);
}

await pool.end();
