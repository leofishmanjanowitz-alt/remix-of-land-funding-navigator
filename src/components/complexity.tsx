import { Cite, CiteStack } from "@/components/citation";
import {
  COMPLEXITY_BLURB,
  COMPLEXITY_LABEL,
  complexityFor,
  type ComplexityLevel,
} from "@/lib/complexity";

function levelClass(level: ComplexityLevel) {
  if (level === "in-house") return "border-primary text-primary";
  if (level === "specialist-recommended") return "border-accent text-accent";
  return "border-accent bg-accent text-primary-foreground";
}

/** One honest line on what the application involves. The reason carries the weight. */
export function ComplexityNote({
  programId,
  className = "",
}: {
  programId: string;
  className?: string;
}) {
  const c = complexityFor(programId);
  if (!c) return null;
  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="rule-label">Application difficulty</span>
        <span
          className={`inline-block border px-2 py-0.5 text-[11px] leading-tight ${levelClass(c.level)}`}
        >
          {COMPLEXITY_LABEL[c.level]}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {COMPLEXITY_BLURB[c.level]}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.reason}</p>
    </div>
  );
}

/** No-cost help that already exists, so paid help never looks like the only route. */
export function FreeAlternatives({
  programId,
  className = "",
}: {
  programId: string;
  className?: string;
}) {
  const c = complexityFor(programId);
  if (!c || c.freeAlternatives.length === 0) return null;
  return (
    <div className={`border-l-2 border-primary pl-3 ${className}`}>
      <p className="rule-label">Free help exists for this</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Before paying anyone, these no-cost sources cover part of the same ground.
      </p>
      <ul className="mt-2 space-y-2">
        {c.freeAlternatives.map((a) => (
          <li key={a.name}>
            <p className="text-sm font-medium text-foreground">
              {a.name}
              {a.sourceIds.length > 1 ? (
                <CiteStack ids={a.sourceIds} />
              ) : (
                <Cite id={a.sourceIds[0]!} />
              )}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{a.what}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
