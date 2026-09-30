/** Turns a real parcel's overlay results into the inputs the program tests use. */
import type { OverlayAnswer, OverlayKind, ParcelDetail } from "./parcel-types";
import { titleCase } from "./overlay-text";
import type { Known, ProgramFacts } from "./tulsa-map-data";

function rowsFor(d: ParcelDetail, kind: OverlayKind): OverlayAnswer[] {
  return d.overlays.filter((o) => o.kind === kind);
}

/** True when inside, false when clearly outside, null when not loaded or split across the edge. */
function settle(d: ParcelDetail, kind: OverlayKind): Known {
  const rows = rowsFor(d, kind);
  if (rows.length === 0 || rows.every((r) => r.status === "not_loaded")) return null;
  if (rows.some((r) => r.status === "inside")) return true;
  if (rows.some((r) => r.status === "partial" || r.status === "boundary")) return null;
  return false;
}

export function factsFromDetail(d: ParcelDetail): ProgramFacts {
  const qct = settle(d, "qct");
  const dda = settle(d, "dda");
  const tifRow = rowsFor(d, "tif").find((r) => r.status === "inside");
  const tulsa = rowsFor(d, "municipality").filter((r) => r.name === "Tulsa");
  const municipalitiesLoaded = rowsFor(d, "municipality").some((r) => r.status !== "not_loaded");

  let inTulsa: Known;
  if (!municipalitiesLoaded) inTulsa = null;
  else if (tulsa.some((r) => r.status === "inside")) inTulsa = true;
  else if (tulsa.some((r) => r.status === "partial")) inTulsa = null;
  else inTulsa = false;

  return {
    inTulsa,
    qct,
    basisBoost: qct === true || dda === true ? true : qct === false && dda === false ? false : null,
    usda: settle(d, "usda_rural"),
    tif: settle(d, "tif"),
    tifDistrict: tifRow ? `${tifRow.code} ${titleCase(tifRow.name ?? "")}`.trim() : null,
    tifIsTulsa: tifRow ? /^T\d/.test(tifRow.code ?? "") : false,
    // Not part of the parcel check: floodplain and zoning are display-only map layers, and the
    // housing trust fund and historic-overlay boundaries have no source loaded.
    htf: null,
    hp: null,
    flood: null,
    zoning: null,
  };
}
