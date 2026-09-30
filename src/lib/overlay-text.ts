/**
 * Plain-language wording for the overlay rows the parcel API returns.
 * Pure string work, so the readout never invents a finding the database did not make.
 */
import type { OverlayAnswer, OverlayKind } from "./parcel-types";

export const OVERLAY_ORDER: OverlayKind[] = [
  "tif",
  "qct",
  "dda",
  "oz",
  "usda_rural",
  "municipality",
  "council_district",
];

export const OVERLAY_TITLE: Record<OverlayKind, string> = {
  tif: "TIF district",
  qct: "Qualified Census Tract",
  dda: "Difficult Development Area",
  oz: "Opportunity Zone",
  usda_rural: "USDA rural eligibility",
  municipality: "City limits",
  council_district: "Council district",
};

export type Tone = "in" | "partial" | "out" | "unknown";

export interface OverlayLine {
  key: string;
  kind: OverlayKind;
  title: string;
  badge: string;
  tone: Tone;
  text: string;
  /** Vintage, what the boundaries are drawn on, and when they were pulled. */
  meta: string | null;
}

/** "TULSA EAST END DIST C" -> "Tulsa East End District C". Tokens with digits stay as written. */
export function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (/\d/.test(w) || w === "&") return w;
      if (w === "DIST") return "District";
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function percent(share: number | null): string {
  if (share === null) return "";
  if (share > 0 && share < 0.01) return "<1%";
  return `${Math.round(share * 100)}%`;
}

function vintageLabel(row: OverlayAnswer): string | null {
  if (!row.vintage) return null;
  switch (row.kind) {
    case "qct":
    case "dda":
      return `${row.vintage} designations`;
    case "oz":
      return `${row.vintage} designation`;
    case "usda_rural":
      return `USDA file dated ${row.vintage}`;
    default:
      return `source updated ${formatDate(row.vintage) ?? row.vintage}`;
  }
}

function basisLabel(row: OverlayAnswer): string | null {
  if (!row.boundaryBasis) return null;
  switch (row.kind) {
    case "qct":
    case "dda":
    case "oz":
      return `drawn on ${row.boundaryBasis}`;
    case "tif":
      return `built from ${row.boundaryBasis}`;
    case "usda_rural":
      return `from ${row.boundaryBasis}`;
    default:
      return null;
  }
}

function metaFor(row: OverlayAnswer): string | null {
  if (row.status === "not_loaded") return null;
  const pulled = formatDate(row.pulledAt);
  const parts = [vintageLabel(row), basisLabel(row), pulled ? `pulled ${pulled}` : null].filter(
    Boolean,
  );
  return parts.length ? parts.join(" · ") : null;
}

function describe(row: OverlayAnswer): { badge: string; tone: Tone; text: string } {
  const share = percent(row.share);
  const name = row.name ?? "";

  if (row.status === "not_loaded") {
    return {
      badge: "Not loaded",
      tone: "unknown",
      text: `${OVERLAY_TITLE[row.kind]} boundaries have not been loaded yet.`,
    };
  }

  switch (row.kind) {
    case "tif": {
      if (row.status === "outside")
        return { badge: "Not in", tone: "out", text: "Not in a TIF district." };
      const label = `TIF district ${row.code} — ${titleCase(name)}`;
      return row.status === "inside"
        ? { badge: "In", tone: "in", text: `Inside ${label}.` }
        : {
            badge: `Partly · ${share}`,
            tone: "partial",
            text: `${share} of the parcel is inside ${label}.`,
          };
    }
    case "qct": {
      if (row.status === "outside")
        return { badge: "Not in", tone: "out", text: "Not in a Qualified Census Tract." };
      return row.status === "inside"
        ? {
            badge: "In",
            tone: "in",
            text: `Inside a Qualified Census Tract (${name}, GEOID ${row.code}).`,
          }
        : {
            badge: `Partly · ${share}`,
            tone: "partial",
            text: `${share} of the parcel is inside a Qualified Census Tract (${name}).`,
          };
    }
    case "dda": {
      if (row.status === "outside")
        return { badge: "Not in", tone: "out", text: "Not in a Difficult Development Area." };
      const label = `a Difficult Development Area (ZIP ${row.code}${name ? `, ${name}` : ""})`;
      return row.status === "inside"
        ? { badge: "In", tone: "in", text: `Inside ${label}.` }
        : {
            badge: `Partly · ${share}`,
            tone: "partial",
            text: `${share} of the parcel is inside ${label}.`,
          };
    }
    case "oz": {
      if (row.status === "outside")
        return { badge: "Not in", tone: "out", text: "Not in an Opportunity Zone." };
      return row.status === "inside"
        ? { badge: "In", tone: "in", text: `Inside an Opportunity Zone (tract ${row.code}).` }
        : {
            badge: `Partly · ${share}`,
            tone: "partial",
            text: `${share} of the parcel is inside an Opportunity Zone (tract ${row.code}).`,
          };
    }
    case "usda_rural": {
      if (row.status === "inside") {
        return {
          badge: "Eligible",
          tone: "in",
          text: "In a USDA rural-eligible area (outside USDA's ineligible areas).",
        };
      }
      if (row.status === "outside") {
        return {
          badge: "Not eligible",
          tone: "out",
          text: "Not rural-eligible: the parcel is inside a USDA-ineligible (urban) area.",
        };
      }
      return {
        badge: `Partly · ${share}`,
        tone: "partial",
        text: `${share} of the parcel is rural-eligible; the rest is inside a USDA-ineligible area.`,
      };
    }
    case "municipality": {
      if (row.status === "outside") {
        return {
          badge: "Unincorporated",
          tone: "out",
          text: "Unincorporated Tulsa County: not inside any city limits.",
        };
      }
      return row.status === "inside"
        ? { badge: "In", tone: "in", text: `Inside the city limits of ${name}.` }
        : {
            badge: `Partly · ${share}`,
            tone: "partial",
            text: `${share} of the parcel is inside the city limits of ${name}.`,
          };
    }
    case "council_district": {
      if (row.status === "outside") {
        return {
          badge: "Not in",
          tone: "out",
          text: "Not in a City of Tulsa council district (the parcel is outside Tulsa).",
        };
      }
      if (row.status === "boundary") {
        return (row.share ?? 0) > 0
          ? { badge: "On boundary", tone: "partial", text: `${name} (on boundary).` }
          : {
              badge: "Not mapped",
              tone: "partial",
              text: `Not in a mapped council district — nearest is ${name}.`,
            };
      }
      return row.status === "inside"
        ? { badge: "In", tone: "in", text: `${name}.` }
        : {
            badge: `Partly · ${share}`,
            tone: "partial",
            text: `${share} of the parcel is in ${name}.`,
          };
    }
  }
}

/** One line per overlay result, in a fixed order. */
export function overlayLines(rows: OverlayAnswer[]): OverlayLine[] {
  const sorted = [...rows].sort(
    (a, b) => OVERLAY_ORDER.indexOf(a.kind) - OVERLAY_ORDER.indexOf(b.kind),
  );
  return sorted.map((row, i) => {
    const d = describe(row);
    return {
      key: `${row.kind}-${row.code ?? row.name ?? i}-${i}`,
      kind: row.kind,
      title: OVERLAY_TITLE[row.kind],
      ...d,
      meta: metaFor(row),
    };
  });
}
