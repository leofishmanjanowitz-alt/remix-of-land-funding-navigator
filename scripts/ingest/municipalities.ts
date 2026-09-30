/**
 * Municipal boundaries in Tulsa County -> jurisdictions (kind 'municipality').
 *
 * Source: INCOG publishes one "<City>CL" (city limits) service per municipality
 * in its region. Every one is pulled; only those containing at least one loaded
 * parcel are kept, so the set is "municipalities in Tulsa County" by construction.
 * Parcels in none of them are unincorporated. Run after the parcel ingest.
 */
import {
  clearStaging,
  log,
  pool,
  queryAll,
  rawDir,
  replaceCurrent,
  saveRaw,
  stageFeatures,
  transaction,
} from "./lib.ts";

const SOURCE_KEY = "incog_city_limits";
const BASE = "https://map11.incog.org/arcgis11wa/rest/services";

const catalog = (await (
  await fetch(`${BASE}?f=json`, { signal: AbortSignal.timeout(60_000) })
).json()) as {
  services: { name: string; type: string }[];
};
const services = [
  ...new Set(
    catalog.services
      .filter((s) => s.type === "FeatureServer" && /^[A-Za-z]+CL$/.test(s.name))
      .map((s) => s.name),
  ),
].sort();
if (services.length === 0) throw new Error("No city-limits services found in the INCOG catalog");

const dir = await rawDir(SOURCE_KEY);
await clearStaging(SOURCE_KEY);
for (const name of services) {
  // Layer ids are not always 0, so read the service's own layer list.
  const svc = (await (
    await fetch(`${BASE}/${name}/FeatureServer?f=json`, { signal: AbortSignal.timeout(60_000) })
  ).json()) as { layers?: { id: number }[] };
  const layerId = svc.layers?.[0]?.id;
  if (layerId === undefined) throw new Error(`${name}: service has no layers`);
  const url = `${BASE}/${name}/FeatureServer/${layerId}`;
  const n = await queryAll(url, {
    onPage: async (features) => {
      await saveRaw(dir, `${name}.geojson`, { type: "FeatureCollection", features });
      // Remember which service each feature came from.
      await stageFeatures(
        SOURCE_KEY,
        features.map((f) => ({ ...f, properties: { ...f.properties, _service: name } })),
      );
    },
  });
  log(SOURCE_KEY, `${name}: ${n} feature(s)`);
}

const { count } = await transaction(async (client) => {
  const edited = await client.query<{ last_edit: Date | null }>(
    `SELECT to_timestamp(max(NULLIF(attrs ->> 'last_edited_date', '')::bigint) / 1000.0) AS last_edit
       FROM staging.features WHERE source_key = $1`,
    [SOURCE_KEY],
  );
  return replaceCurrent(
    client,
    {
      sourceKey: SOURCE_KEY,
      datasetName: "Municipal city limits (INCOG)",
      publisher: "INCOG",
      sourceUrl: BASE,
      sourceLastEdit: edited.rows[0]?.last_edit ?? null,
      boundaryBasis: "city limits",
      licenseNote:
        "No licence published. Layers are marked 'prepared by INCOG'; confirm before public launch.",
      params: { services },
      notes:
        "One row per municipality with at least one loaded parcel inside it. A municipality's main limits and " +
        "its fenceline strips (narrow annexed bands) are unioned. code is the census place FIPS where the layer " +
        "publishes one. source_last_edit is the newest per-feature edit date published; " +
        "most layers publish none.",
    },
    ["jurisdictions"],
    async (pullId) => {
      const res = await client.query(
        `WITH cities AS (
           -- The layers share no schema, so the name comes from the service ('BrokenArrowCL' ->
           -- 'Broken Arrow') and the census place code from whichever field carries it.
           SELECT regexp_replace(regexp_replace(attrs ->> '_service', 'CL$', ''), '([a-z])([A-Z])', '\\1 \\2', 'g') AS city,
                  lpad(COALESCE(
                    (NULLIF(attrs ->> 'FIPS', '')::numeric)::integer::text,
                    NULLIF(attrs ->> 'PLACEFP', ''),
                    (NULLIF(attrs ->> 'PLACE', '')::numeric)::integer::text,
                    right(NULLIF(attrs ->> 'GEOID', ''), 5)), 5, '0') AS fips,
                  staging.as_multipolygon(geom) AS geom
             FROM staging.features
            WHERE source_key = $2
         ),
         merged AS (
           SELECT min(fips) AS fips, city, staging.as_multipolygon(ST_Union(geom)) AS geom
             FROM cities WHERE geom IS NOT NULL
            GROUP BY city
         )
         INSERT INTO jurisdictions (pull_id, kind, code, name, detail, geom)
         SELECT $1, 'municipality', m.fips, m.city, NULL, m.geom
           FROM merged m
          WHERE EXISTS (SELECT 1 FROM parcels p WHERE ST_Intersects(m.geom, p.label_point))`,
        [pullId, SOURCE_KEY],
      );
      return res.rowCount ?? 0;
    },
  );
});
log(SOURCE_KEY, `loaded ${count} municipalities with parcels in Tulsa County`);
await pool.end();
