/**
 * Parcel lookups. Everything here is answered from PostGIS; nothing calls an
 * outside service at request time.
 */
import { parseParcelQuery } from "@/lib/address";
import type {
  AtResult,
  OverlayAnswer,
  ParcelDetail,
  ParcelSummary,
  SearchResult,
} from "@/lib/parcel-types";
import { db } from "./db";

/** Only real property is searchable: never rights-of-way, rail, water or divided-interest records. */
const SEARCHABLE = "p.parcel_type IN ('parcel', 'condo')";

const SUMMARY_COLUMNS = `
  p.id::int                 AS id,
  p.parcel_number           AS "parcelNumber",
  p.situs_address           AS address,
  p.city,
  p.zip,
  p.parcel_type             AS "parcelType",
  p.land_use                AS "landUse",
  p.acres::float8           AS acres,
  ST_X(p.label_point)       AS lng,
  ST_Y(p.label_point)       AS lat,
  ST_AsGeoJSON(p.geom, 6)::json AS geometry`;

const MAX_RESULTS = 8;

export async function searchParcels(query: string): Promise<SearchResult> {
  const parsed = parseParcelQuery(query);
  const pool = db();
  let rows: ParcelSummary[] = [];

  if (parsed.kind === "parcel_number") {
    const exact = parsed.digits.length === 14;
    const res = await pool.query<ParcelSummary>(
      `SELECT ${SUMMARY_COLUMNS} FROM parcels p
        WHERE ${SEARCHABLE} AND ${exact ? "parcel_number = $1" : "parcel_number LIKE $1 || '%'"}
        ORDER BY parcel_number LIMIT ${MAX_RESULTS}`,
      [parsed.digits],
    );
    rows = res.rows;
  } else if (parsed.kind === "account_number") {
    const res = await pool.query<ParcelSummary>(
      `SELECT ${SUMMARY_COLUMNS} FROM parcels p
        WHERE ${SEARCHABLE} AND account_number = $1 LIMIT ${MAX_RESULTS}`,
      [parsed.account],
    );
    rows = res.rows;
  } else if (parsed.kind === "address") {
    // Numbered streets ("11", "119") must match exactly; named streets tolerate typos.
    const numbered = /^\d+$/.test(parsed.streetName);
    const nameMatch = numbered
      ? "street_name = $1"
      : "(street_name = $1 OR street_name LIKE $1 || '%' OR street_name % $1)";
    // A typed direction or street type ranks matches; leaving either out still finds the parcel.
    const ranking = `
      (street_name = $1) DESC,
      similarity(street_name, $1) DESC,
      ($2::text IS NULL OR street_predir = $2) DESC,
      ($3::text IS NULL OR street_type = $3) DESC`;
    const args = [parsed.streetName, parsed.predir, parsed.streetType];

    if (parsed.houseNumber) {
      const res = await pool.query<ParcelSummary>(
        `SELECT ${SUMMARY_COLUMNS} FROM parcels p
          WHERE ${SEARCHABLE} AND house_number = $4 AND ${nameMatch}
          ORDER BY ${ranking}, situs_address, parcel_number
          LIMIT ${MAX_RESULTS}`,
        [...args, parsed.houseNumber],
      );
      rows = res.rows;
    } else if (parsed.streetName.length >= 2) {
      // Street only: the first addresses along that street.
      const res = await pool.query<ParcelSummary>(
        `SELECT ${SUMMARY_COLUMNS} FROM parcels p
          WHERE ${SEARCHABLE} AND house_number IS NOT NULL AND ${nameMatch}
          ORDER BY ${ranking}, NULLIF(regexp_replace(house_number, '\\D', '', 'g'), '')::int, situs_address
          LIMIT ${MAX_RESULTS}`,
        args,
      );
      rows = res.rows;
    }
  }

  return { query, interpretedAs: parsed, results: rows };
}

export async function parcelsAt(lng: number, lat: number): Promise<AtResult> {
  const pool = db();
  const point = "ST_SetSRID(ST_MakePoint($1, $2), 4326)";
  const res = await pool.query<ParcelSummary>(
    `SELECT ${SUMMARY_COLUMNS}
       FROM parcels p
      WHERE ${SEARCHABLE} AND ST_Intersects(geom, ${point})
      ORDER BY ST_Area(geom), parcel_number
      LIMIT 10`,
    [lng, lat],
  );
  if (res.rows.length > 0) return { results: res.rows, surface: "parcel" };

  const other = await pool.query<{ parcel_type: string }>(
    `SELECT parcel_type FROM parcels p WHERE ST_Intersects(geom, ${point}) ORDER BY ST_Area(geom) LIMIT 1`,
    [lng, lat],
  );
  const type = other.rows[0]?.parcel_type;
  const surface: AtResult["surface"] =
    type === "right_of_way" || type === "rail" || type === "water" || type === "other"
      ? type
      : "nothing";
  return { results: [], surface };
}

const DESIGNATION_LABEL: Partial<Record<OverlayAnswer["kind"], string>> = {
  tif: "TIF district",
  qct: "Qualified Census Tract",
  dda: "Difficult Development Area",
  oz: "Opportunity Zone",
  usda_rural: "USDA rural-eligible area",
};

function describeDesignations(overlays: OverlayAnswer[]): ParcelDetail["designations"] {
  const kinds = Object.keys(DESIGNATION_LABEL) as OverlayAnswer["kind"][];
  const relevant = overlays.filter((o) => kinds.includes(o.kind));
  const hits = relevant.filter((o) => o.status === "inside" || o.status === "partial");
  const missing = kinds.filter((k) =>
    relevant.some((o) => o.kind === k && o.status === "not_loaded"),
  );
  const caveat = missing.length
    ? ` (${missing.map((k) => DESIGNATION_LABEL[k]).join(", ")} data is not loaded yet.)`
    : "";

  if (hits.length === 0) {
    return {
      inAny: false,
      message:
        "This parcel is not in a TIF district, Qualified Census Tract, Difficult Development Area, " +
        "Opportunity Zone or USDA rural-eligible area." +
        caveat,
    };
  }
  // Say "partly" when the parcel straddles a boundary, so nobody reads it as fully inside.
  const names = [
    ...new Set(
      hits.map((o) => DESIGNATION_LABEL[o.kind]! + (o.status === "partial" ? " (partly)" : "")),
    ),
  ];
  return { inAny: true, message: `This parcel is in: ${names.join(", ")}.` + caveat };
}

export async function getParcel(id: number): Promise<ParcelDetail | null> {
  const pool = db();
  const parcel = await pool.query(
    `SELECT ${SUMMARY_COLUMNS},
            p.account_number          AS "accountNumber",
            p.legal_description       AS "legalDescription",
            p.year_built              AS "yearBuilt",
            p.assessed_total::float8  AS "assessedTotal",
            p.land_value::float8      AS "landValue",
            p.improvement_value::float8 AS "improvementValue",
            sp.publisher, sp.pulled_at AS "pulledAt", sp.source_last_edit AS "sourceLastEdit"
       FROM parcels p JOIN source_pulls sp ON sp.id = p.pull_id
      WHERE p.id = $1 AND ${SEARCHABLE}`,
    [id],
  );
  const row = parcel.rows[0];
  if (!row) return null;

  const overlays = await pool.query<OverlayAnswer>(
    `SELECT kind, status, code, name, share::float8 AS share, vintage,
            boundary_basis AS "boundaryBasis", source_key AS "sourceKey",
            pulled_at AS "pulledAt", source_last_edit AS "sourceLastEdit"
       FROM parcel_overlays($1)`,
    [id],
  );

  const { publisher, pulledAt, sourceLastEdit, ...rest } = row;
  return {
    ...rest,
    source: { publisher, pulledAt, sourceLastEdit },
    overlays: overlays.rows,
    designations: describeDesignations(overlays.rows),
  };
}
