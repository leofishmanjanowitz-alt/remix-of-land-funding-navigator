import { Cite } from "@/components/citation";
import {
  COST_SAVERS,
  catalogMatches,
  designReviewOverlays,
  type CostSaver,
} from "@/lib/cost-savers";
import type { Parcel } from "@/lib/tulsa-map-data";

export function CostSavers({
  parcel,
  className = "",
}: {
  parcel: Parcel;
  className?: string;
}) {
  const matches = catalogMatches(parcel.zoning);
  const reviewOverlays = designReviewOverlays(parcel);

  return (
    <div className={className}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Resources that put no money into the capital stack but take cost and calendar time out of
        design and permitting.
      </p>
      <ul className="mt-4 border-t border-border">
        {COST_SAVERS.map((r) => (
          <ResourceRow
            key={r.id}
            resource={r}
            matches={r.id === "ttown-catalog" ? matches : []}
            reviewOverlays={r.id === "ttown-catalog" ? reviewOverlays : []}
          />
        ))}
      </ul>
    </div>
  );
}

function ResourceRow({
  resource,
  matches,
  reviewOverlays,
}: {
  resource: CostSaver;
  matches: { type: string; basis: "permitted" | "conditional" }[];
  reviewOverlays: string[];
}) {
  return (
    <li className="border-b border-border py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {resource.name}
            <Cite id={resource.sourceId} />
          </p>
          <p className="text-xs text-muted-foreground">{resource.administrator}</p>
        </div>
        <span className="shrink-0 border border-accent px-2 py-0.5 text-[11px] leading-tight text-accent">
          Non-capital
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{resource.what}</p>

      <p className="rule-label mt-3">What it saves</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{resource.saves}</p>

      {resource.condition && (
        <>
          <p className="rule-label mt-3">Where it applies</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{resource.condition}</p>
        </>
      )}

      {matches.length > 0 && (
        <div className="mt-3 border-l-2 border-primary pl-3">
          <p className="rule-label">Match with this parcel's zoning</p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            Pre-approved plans exist for building types this parcel already allows:
          </p>
          <ul className="mt-2 space-y-1">
            {matches.map((m) => (
              <li key={m.type} className="flex gap-2 text-sm text-foreground">
                <span className={m.basis === "permitted" ? "text-primary" : "text-accent"}>
                  {m.basis === "permitted" ? "▪" : "▫"}
                </span>
                <span>
                  {m.type}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {m.basis === "permitted"
                      ? "permitted by right"
                      : "conditional — needs a discretionary approval first"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {reviewOverlays.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {reviewOverlays.join(" and ")} applies here. A stock plan does not by itself satisfy
              that design review.
            </p>
          )}
        </div>
      )}

      {matches.length === 0 && resource.id === "ttown-catalog" && (
        <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
          No catalog building type is permitted or conditionally allowed under this parcel's
          zoning, so the catalog is unlikely to help here without a rezoning.
        </p>
      )}

      <div className="mt-3 flex items-center gap-4">
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          className="border-b border-primary font-mono text-xs text-primary hover:border-accent hover:text-accent"
        >
          Open source ↗
        </a>
        {resource.unverified && (
          <span className="font-mono text-[11px] text-accent">Unverified — confirm details</span>
        )}
      </div>
    </li>
  );
}
