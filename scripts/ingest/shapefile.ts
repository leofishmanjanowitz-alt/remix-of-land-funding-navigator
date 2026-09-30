/**
 * Shapefile sources: download a zip, unpack it under data/raw, and load it into
 * a staging table with shp2pgsql (which ships in the database container).
 */
import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { log, RAW_ROOT, rawDir } from "./lib.ts";

const run = promisify(execFile);
const CONTAINER = "collective-impact-db";

/** Downloads (once per day) and unzips; returns the path of the .shp inside. */
export async function fetchShapefile(
  sourceKey: string,
  zipUrl: string,
  zipName: string,
): Promise<string> {
  const dir = await rawDir(sourceKey);
  const zip = path.join(dir, zipName);
  try {
    await access(zip);
    log(sourceKey, "using the copy already downloaded today");
  } catch {
    log(sourceKey, "downloading shapefile…");
    const res = await fetch(zipUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (collective-impact ingest)" },
      signal: AbortSignal.timeout(600_000),
    });
    if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status}`);
    await pipeline(
      Readable.fromWeb(res.body as import("node:stream/web").ReadableStream),
      createWriteStream(zip),
    );
  }
  const out = path.join(dir, "shp");
  await run("unzip", ["-o", "-q", zip, "-d", out]);
  for (const entry of await readdir(out, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".shp"))
      return path.join(entry.parentPath, entry.name);
  }
  throw new Error(`No .shp file found in ${zipName}`);
}

/** EPSG code from the shapefile's .prj, for the projections these sources use. */
async function sourceSrid(shp: string): Promise<number> {
  const prj = await readFile(shp.replace(/\.shp$/i, ".prj"), "utf8");
  if (/Web_Mercator/i.test(prj)) return 3857;
  if (/^GEOGCS\["GCS_North_American_1983"/i.test(prj)) return 4269;
  if (/^GEOGCS\["GCS_WGS_1984"/i.test(prj)) return 4326;
  throw new Error(`Unrecognised projection in ${path.basename(shp)}: ${prj.slice(0, 80)}`);
}

/** Loads the shapefile into `table` (dropped and recreated), reprojected to EPSG:4326. */
export async function shapefileToStaging(shp: string, table: string): Promise<void> {
  if (!/^staging\.[a-z_]+$/.test(table)) throw new Error(`Unexpected staging table name: ${table}`);
  const srid = await sourceSrid(shp);
  // data/raw is mounted read-only in the database container at /data/raw.
  const inContainer = "/data/raw/" + path.relative(RAW_ROOT, shp).split(path.sep).join("/");
  const from = srid === 4326 ? "4326" : `${srid}:4326`;
  await run(
    "docker",
    [
      "exec",
      CONTAINER,
      "sh",
      "-c",
      // Drop explicitly: shp2pgsql's own -d errors when the table does not exist yet.
      `{ echo 'DROP TABLE IF EXISTS ${table};'; shp2pgsql -s ${from} -c -D -g geom "${inContainer}" ${table} 2>/dev/null; } ` +
        `| PGOPTIONS='-c client_min_messages=error' psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null`,
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
}
