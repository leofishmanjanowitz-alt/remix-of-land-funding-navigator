import type { ParcelDetail } from "@/lib/parcel-types";
import { formatDate, overlayLines, type Tone } from "@/lib/overlay-text";

const BADGE: Record<Tone, string> = {
  in: "border-accent bg-accent text-accent-foreground",
  partial: "border-accent text-accent",
  out: "border-border text-muted-foreground",
  unknown: "border-dashed border-border text-muted-foreground",
};

/**
 * Where this parcel sits: every overlay result from the database, with the vintage and
 * pull date of the boundary it was checked against, and a plain statement when the
 * parcel is in none of the five designations.
 */
export function OverlayReadout({ detail }: { detail: ParcelDetail }) {
  const lines = overlayLines(detail.overlays);
  const none = !detail.designations.inAny;

  return (
    <div>
      <div
        className={`rounded-xl border px-4 py-3 ${
          none ? "border-border bg-secondary" : "border-accent/30 bg-accent/5"
        }`}
        role="status"
      >
        <p className="rule-label">{none ? "In none of the five designations" : "Designations"}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          {detail.designations.message}
        </p>
      </div>

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {lines.map((line) => (
          <li key={line.key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3">
            <div>
              <span
                className={`inline-block rounded-md border px-2 py-0.5 text-[11px] leading-tight ${BADGE[line.tone]}`}
              >
                {line.badge}
              </span>
            </div>
            <div>
              <p className="rule-label">{line.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{line.text}</p>
              {line.meta && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{line.meta}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Each result is a spatial intersection of this parcel's outline with the boundary stored in
        the database, not a lookup at click time. Overlap under 1% of the parcel counts as outside
        and over 99% as inside; anything between is shown as partial with its share. Floodplain,
        zoning and several other site tests are not part of this check yet.
      </p>
    </div>
  );
}

/** Where the parcel facts came from, for the Parcel facts section. */
export function ParcelSourceLine({ detail }: { detail: ParcelDetail }) {
  const county = formatDate(detail.source.sourceLastEdit);
  const pulled = formatDate(detail.source.pulledAt);
  return (
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
      {detail.source.publisher}
      {county ? ` · county data loaded ${county}` : ""}
      {pulled ? ` · pulled ${pulled}` : ""}. The Assessor developed this data for property-tax
      valuation and it may be slightly dated.
    </p>
  );
}
