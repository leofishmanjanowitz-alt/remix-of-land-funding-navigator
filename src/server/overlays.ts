/**
 * Overlay boundaries as GeoJSON for drawing only. Each overlay table keeps its exact
 * `geom` for intersection checks and a simplified `display_geom` (about 3 m tolerance)
 * that this module serves, so the browser never downloads the exact boundaries.
 */
import { db } from "./db";

type OverlaySpec = {
  sourceKey: string;
  /** SELECT list producing: geom, code, name (+ any extra properties). */
  from: string;
  properties: string;
};

/** Coordinates to 5 decimals: about 1 m. */
const DECIMALS = 5;

const OVERLAYS: Record<string, OverlaySpec> = {
  tif: {
    sourceKey: "incog_tif",
    from: "(SELECT display_geom AS geom, district_code AS code, name, parcel_count FROM overlay_tif) o",
    properties: "'code', o.code, 'name', o.name, 'parcelCount', o.parcel_count",
  },
  qct: {
    sourceKey: "hud_qct",
    from: "(SELECT display_geom AS geom, geoid AS code, name, vintage FROM overlay_qct) o",
    properties: "'code', o.code, 'name', o.name, 'vintage', o.vintage",
  },
  dda: {
    sourceKey: "hud_dda",
    from: "(SELECT display_geom AS geom, code, name, vintage, dda_type FROM overlay_dda) o",
    properties: "'code', o.code, 'name', o.name, 'vintage', o.vintage, 'ddaType', o.dda_type",
  },
  oz: {
    sourceKey: "cdfi_oz",
    from: "(SELECT display_geom AS geom, geoid AS code, 'Opportunity Zone tract ' || geoid AS name, vintage FROM overlay_oz) o",
    properties: "'code', o.code, 'name', o.name, 'vintage', o.vintage",
  },
  // Drawn as published: these are the areas where USDA rural programs do NOT apply.
  usda_ineligible: {
    sourceKey: "usda_rural",
    from: "(SELECT display_geom AS geom, NULL::text AS code, 'USDA rural-ineligible area' AS name FROM overlay_usda_ineligible) o",
    properties: "'name', o.name",
  },
  municipality: {
    sourceKey: "incog_city_limits",
    from: "(SELECT display_geom AS geom, code, name FROM jurisdictions WHERE kind = 'municipality') o",
    properties: "'code', o.code, 'name', o.name",
  },
  council_district: {
    sourceKey: "tulsa_council_districts",
    from: "(SELECT display_geom AS geom, code, name, detail FROM jurisdictions WHERE kind = 'council_district') o",
    properties: "'code', o.code, 'name', o.name, 'councilMember', o.detail",
  },
};

export const OVERLAY_KINDS = Object.keys(OVERLAYS);

export async function overlayGeoJson(kind: string): Promise<unknown | null> {
  const spec = OVERLAYS[kind];
  if (!spec) return null;
  const pool = db();

  const features = await pool.query<{ fc: unknown }>(
    `SELECT jsonb_build_object(
              'type', 'FeatureCollection',
              'features', COALESCE(jsonb_agg(jsonb_build_object(
                'type', 'Feature',
                'properties', jsonb_build_object(${spec.properties}),
                'geometry', ST_AsGeoJSON(o.geom, ${DECIMALS})::jsonb
              )), '[]'::jsonb)
            ) AS fc
       FROM ${spec.from}`,
  );
  const pull = await pool.query(
    `SELECT source_key AS "sourceKey", dataset_name AS "datasetName", publisher,
            COALESCE(vintage, to_char(source_last_edit AT TIME ZONE 'UTC', 'YYYY-MM-DD')) AS vintage,
            boundary_basis AS "boundaryBasis", pulled_at AS "pulledAt",
            source_last_edit AS "sourceLastEdit", record_count AS "recordCount"
       FROM source_pulls WHERE source_key = $1 AND is_current`,
    [spec.sourceKey],
  );
  return { kind, source: pull.rows[0] ?? null, ...(features.rows[0]!.fc as object) };
}

export async function currentSources(): Promise<unknown[]> {
  const res = await db().query(
    `SELECT source_key AS "sourceKey", dataset_name AS "datasetName", publisher,
            source_url AS "sourceUrl",
            COALESCE(vintage, to_char(source_last_edit AT TIME ZONE 'UTC', 'YYYY-MM-DD')) AS vintage,
            boundary_basis AS "boundaryBasis", pulled_at AS "pulledAt",
            source_last_edit AS "sourceLastEdit", record_count AS "recordCount", license_note AS "licenseNote"
       FROM source_pulls WHERE is_current ORDER BY source_key`,
  );
  return res.rows;
}
