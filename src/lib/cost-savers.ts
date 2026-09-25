/**
 * Non-capital resources that improve project feasibility: they do not put
 * money into the capital stack, they take time and expense out of the
 * pre-development and permitting phase. Kept deliberately separate from
 * funding programs.
 *
 * Details marked UNVERIFIED_NOTE have not been confirmed against a published
 * source. Do not replace them with invented specifics.
 */

import { ZONING, type Parcel, type ZoningCode } from "./tulsa-map-data";

export const UNVERIFIED_NOTE =
  "Unverified — catalog contents, administering body, and the exact permitting benefit have not been confirmed. Check with the City of Tulsa Planning Office before relying on this.";

export type CostSaver = {
  id: string;
  name: string;
  administrator: string;
  /** What the resource is, in plain language. */
  what: string;
  /** What it saves the developer. */
  saves: string;
  url: string;
  sourceId: string;
  /** Availability condition, when the resource is not universally available. */
  condition?: string;
  unverified?: boolean;
};

/**
 * Building types the catalog is understood to cover. Written to match the
 * housing-type vocabulary used by the zoning profiles so the two can be
 * cross-referenced.
 */
export const CATALOG_BUILDING_TYPES = [
  "Single family detached",
  "Accessory dwelling unit",
  "Duplex",
  "Cottage court",
  "Townhouse",
];

export const COST_SAVERS: CostSaver[] = [
  {
    id: "ttown-catalog",
    name: "T-Town Catalog",
    administrator: "City of Tulsa Planning Office",
    what: "A catalog of pre-approved building plans for small-scale housing types. The plans have already been drawn and reviewed, so a developer can build from one instead of commissioning a design from scratch.",
    saves:
      "Design fees and plan review time. The stated intent is to reduce the cost and the calendar time between site control and a permit.",
    url: "https://www.cityoftulsa.org/",
    sourceId: "cs-ttown",
    condition:
      "Applies only to the building types carried in the catalog, and only where the parcel's zoning and any overlay permit that type. Historic Preservation and Neighborhood Character overlays impose design review that a stock plan does not satisfy on its own.",
    unverified: true,
  },
  {
    id: "partnertulsa-permitting",
    name: "PartnerTulsa permitting assistance",
    administrator: "PartnerTulsa (quasi-governmental)",
    what: "Staff assistance navigating municipal permitting and development review — identifying which approvals a project needs, in what order, and who at the City decides each one.",
    saves:
      "Elapsed time and rework. Its value is largest on projects that touch several departments or need a discretionary approval.",
    url: "https://partnertulsa.org/",
    sourceId: "cs-partnertulsa-permit",
    condition:
      "Directed at projects inside the City of Tulsa; priority and scope of assistance are set by PartnerTulsa and are not confirmed here.",
    unverified: true,
  },
];

export const COST_SAVER_CITATION_IDS = COST_SAVERS.map((r) => r.sourceId);

export type CatalogMatch = {
  type: string;
  /** Permitted outright, or only conditionally. */
  basis: "permitted" | "conditional";
};

/** Building types in the catalog that this parcel's zoning already allows. */
export function catalogMatches(zoningCode: ZoningCode): CatalogMatch[] {
  const zoning = ZONING[zoningCode];
  const norm = (s: string) => s.toLowerCase();
  const hit = (list: string[], t: string) =>
    list.some((entry) => norm(entry).startsWith(norm(t)));

  return CATALOG_BUILDING_TYPES.flatMap<CatalogMatch>((t) => {
    if (hit(zoning.permitted, t)) return [{ type: t, basis: "permitted" }];
    if (hit(zoning.conditional, t)) return [{ type: t, basis: "conditional" }];
    return [];
  });
}

/** Overlays that add design review on top of a stock plan. */
export function designReviewOverlays(parcel: Parcel): string[] {
  const out: string[] = [];
  if (parcel.layers.includes("hp")) out.push("Historic Preservation (HP) overlay");
  if (parcel.layers.includes("nco")) out.push("Neighborhood Character (NCO) overlay");
  return out;
}
