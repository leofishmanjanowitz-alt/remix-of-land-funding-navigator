/**
 * Parcel outlines for the current map view. Street level only, and capped, so
 * the browser never receives the county's ~285k parcels.
 */
import { OUTLINE_CAP, OUTLINE_MIN_ZOOM, type OutlineCollection } from "@/lib/parcel-types";
import { db } from "./db";

export type Bbox = [minLng: number, minLat: number, maxLng: number, maxLat: number];

/** Widest view served, in degrees. A 1920 px window at zoom 16 spans about 0.056° of longitude. */
const MAX_SPAN_LNG = 0.08;
const MAX_SPAN_LAT = 0.06;

export function validateOutlineRequest(bbox: Bbox, zoom: number): string | null {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  if (!bbox.every(Number.isFinite)) return "bbox must be four numbers: minLng,minLat,maxLng,maxLat";
  if (minLng >= maxLng || minLat >= maxLat) return "bbox is empty or reversed.";
  if (
    Math.abs(minLat) > 90 ||
    Math.abs(maxLat) > 90 ||
    Math.abs(minLng) > 180 ||
    Math.abs(maxLng) > 180
  ) {
    return "bbox is out of range.";
  }
  if (!Number.isFinite(zoom)) return "zoom must be a number.";
  if (zoom < OUTLINE_MIN_ZOOM) {
    return `Parcel outlines are only served at zoom ${OUTLINE_MIN_ZOOM} and closer. Zoom in to see parcels.`;
  }
  if (maxLng - minLng > MAX_SPAN_LNG || maxLat - minLat > MAX_SPAN_LAT)
    return "That view is too wide.";
  return null;
}

export async function parcelOutlines(bbox: Bbox, zoom: number): Promise<OutlineCollection> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const z = Math.min(Math.max(Math.floor(zoom), OUTLINE_MIN_ZOOM), 20);
  // Half a pixel at this zoom: lines stay visually identical, vertices drop away.
  const tolerance = (0.5 * 360) / 256 / 2 ** z;
  const decimals = z >= 18 ? 6 : 5;

  // One extra row tells us whether the cap cut anything off.
  const res = await db().query<{
    id: number;
    address: string | null;
    geometry: OutlineCollection["features"][number]["geometry"];
  }>(
    `WITH box AS (SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS g)
     SELECT p.id::int AS id,
            p.situs_address AS address,
            ST_AsGeoJSON(ST_SimplifyPreserveTopology(p.geom, $5), $6)::json AS geometry
       FROM parcels p, box
      WHERE p.parcel_type IN ('parcel', 'condo')
        AND ST_Intersects(p.geom, box.g)
      ORDER BY ST_Distance(p.label_point, ST_Centroid(box.g))
      LIMIT $7`,
    [minLng, minLat, maxLng, maxLat, tolerance, decimals, OUTLINE_CAP + 1],
  );

  const truncated = res.rows.length > OUTLINE_CAP;
  const rows = truncated ? res.rows.slice(0, OUTLINE_CAP) : res.rows;
  return {
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      properties: { id: r.id, address: r.address },
      geometry: r.geometry,
    })),
    truncated,
    count: rows.length,
    cap: OUTLINE_CAP,
    zoom: z,
  };
}
