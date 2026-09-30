/**
 * Shapes shared by the parcel API routes (src/server, src/routes/api) and the
 * map UI. Types only, so importing this from the browser pulls in no server code.
 */
import type { ParsedQuery } from "./address";

export type PolygonGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

export interface ParcelSummary {
  id: number;
  parcelNumber: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  parcelType: string;
  landUse: string | null;
  acres: number | null;
  lng: number;
  lat: number;
  /** Outline, for drawing candidates on the map. */
  geometry: PolygonGeometry;
}

export interface SearchResult {
  query: string;
  /** How the text was read, so the UI can show what was actually searched. */
  interpretedAs: ParsedQuery;
  results: ParcelSummary[];
}

export type SurfaceKind = "parcel" | "right_of_way" | "rail" | "water" | "other" | "nothing";

export interface AtResult {
  /** Parcels under the point, smallest first (stacked condo units share one footprint). */
  results: ParcelSummary[];
  /** When nothing searchable is there, what the point landed on instead. */
  surface: SurfaceKind;
}

export type OverlayStatus = "inside" | "partial" | "outside" | "boundary" | "not_loaded";
export type OverlayKind =
  "tif" | "qct" | "dda" | "oz" | "usda_rural" | "municipality" | "council_district";

export interface OverlayAnswer {
  kind: OverlayKind;
  status: OverlayStatus;
  code: string | null;
  name: string | null;
  /** Share of the parcel's area inside, 0 to 1. */
  share: number | null;
  vintage: string | null;
  boundaryBasis: string | null;
  sourceKey: string;
  pulledAt: string | null;
  sourceLastEdit: string | null;
}

export interface ParcelDetail extends Omit<ParcelSummary, "geometry"> {
  geometry: PolygonGeometry;
  accountNumber: string | null;
  legalDescription: string | null;
  yearBuilt: number | null;
  assessedTotal: number | null;
  landValue: number | null;
  improvementValue: number | null;
  source: { publisher: string; pulledAt: string; sourceLastEdit: string | null };
  overlays: OverlayAnswer[];
  /** The five funding designations, in plain words. */
  designations: { inAny: boolean; message: string };
}

export interface OutlineFeature {
  type: "Feature";
  properties: { id: number; address: string | null };
  geometry: PolygonGeometry;
}

export interface OutlineCollection {
  type: "FeatureCollection";
  features: OutlineFeature[];
  /** More parcels were in view than the cap allows; the ones nearest the centre are returned. */
  truncated: boolean;
  count: number;
  cap: number;
  zoom: number;
}

/** Parcel outlines are only served at street level. */
export const OUTLINE_MIN_ZOOM = 16;
/** Most outlines returned for one view. */
export const OUTLINE_CAP = 4000;
