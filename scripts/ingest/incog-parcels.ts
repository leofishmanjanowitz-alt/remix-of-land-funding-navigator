/**
 * Tulsa County parcels from INCOG -> parcels (and the staging rows the TIF dissolve reads).
 *
 * Source: INCOG map service "Parcels_TulsaCo" (data: Tulsa County Assessor).
 * The INCOG-specific field mapping lives only in this file; the app reads the
 * normalized `parcels` columns, so another provider can replace this adapter.
 *
 *   node scripts/ingest/incog-parcels.ts               download, then normalize
 *   node scripts/ingest/incog-parcels.ts --no-download  normalize what is already staged
 */
import {
  clearStaging,
  layerCount,
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

export const SOURCE_KEY = "incog_parcels";
const URL = "https://map11.incog.org/arcgis11wa/rest/services/Parcels_TulsaCo/FeatureServer/0";

const download = !process.argv.includes("--no-download");
const normalize = !process.argv.includes("--download-only");

if (download) {
  const expected = await layerCount(URL);
  log(SOURCE_KEY, `source reports ${expected} parcels; downloading…`);
  const dir = await rawDir(SOURCE_KEY);
  await clearStaging(SOURCE_KEY);
  const fetched = await queryAll(URL, {
    pageSize: 2000,
    onPage: async (features, page) => {
      await saveRaw(dir, `page-${String(page).padStart(4, "0")}.geojson`, {
        type: "FeatureCollection",
        features,
      });
      await stageFeatures(SOURCE_KEY, features);
      if (page % 10 === 0) log(SOURCE_KEY, `page ${page} (${(page + 1) * 2000} rows so far)`);
    },
  });
  log(SOURCE_KEY, `staged ${fetched} of ${expected}`);
  if (fetched !== expected) throw new Error(`expected ${expected} features, got ${fetched}`);
}

if (normalize) {
  const { normalizeIncogParcels } = await import("./incog-parcels-normalize.ts");
  const info = await layerInfo(URL);
  await normalizeIncogParcels({ url: URL, info, replaceCurrent, transaction, log });
}

await pool.end();
