/** Browser-side client for the parcel API (src/routes/api). */
import type { AtResult, OutlineCollection, ParcelDetail, SearchResult } from "./parcel-types";

export type Bbox = [minLng: number, minLat: number, maxLng: number, maxLat: number];

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, signal ? { signal } : undefined);
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  return body as T;
}

export const searchParcels = (q: string, signal?: AbortSignal) =>
  getJson<SearchResult>(`/api/parcels/search?q=${encodeURIComponent(q)}`, signal);

export const parcelsAt = (lat: number, lng: number, signal?: AbortSignal) =>
  getJson<AtResult>(`/api/parcels/at?lat=${lat}&lng=${lng}`, signal);

export const getParcelDetail = (id: number, signal?: AbortSignal) =>
  getJson<ParcelDetail>(`/api/parcels/${id}`, signal);

export const getOutlines = (bbox: Bbox, zoom: number, signal?: AbortSignal) =>
  getJson<OutlineCollection>(`/api/parcels/outlines?bbox=${bbox.join(",")}&zoom=${zoom}`, signal);
