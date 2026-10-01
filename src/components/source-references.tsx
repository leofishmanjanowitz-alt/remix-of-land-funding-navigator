import { formatDate } from "@/lib/overlay-text";
import { useSources, type LoadedSource } from "@/lib/use-sources";

/** Every source the readout is checked against, in the order the readout uses them. */
const ORDER = [
  "incog_parcels",
  "incog_tif",
  "hud_qct",
  "hud_dda",
  "cdfi_oz",
  "usda_rural",
  "incog_city_limits",
  "tulsa_council_districts",
];

/** "Vintage 2026" for designation years, "File dated ..." for USDA's published file. */
function vintageText(src: LoadedSource): string | null {
  if (!src.vintage) return null;
  if (/^\d{4}$/.test(src.vintage)) return `Vintage ${src.vintage}`;
  if (src.sourceKey === "usda_rural") return `File dated ${src.vintage}`;
  return null;
}

function Stamp({ iso, kind }: { iso: string; kind: "pulled" | "last-edit" }) {
  return (
    <time dateTime={iso} data-kind={kind}>
      {formatDate(iso)}
    </time>
  );
}

/**
 * The References section of the parcel readout, generated from the database's source_pulls
 * (via /api/sources): each source's dataset, publisher, working link, vintage, the date the
 * source says it was last edited, and the date we pulled it. Nothing here is hand-written.
 */
export function SourceReferences() {
  const sources = useSources();

  if (sources.isError) {
    return <p className="text-sm text-muted-foreground">The source list could not be loaded.</p>;
  }
  if (!sources.data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const byKey = new Map(sources.data.map((s) => [s.sourceKey, s]));
  const ordered = [
    ...ORDER.flatMap((k) => (byKey.has(k) ? [byKey.get(k)!] : [])),
    ...sources.data.filter((s) => !ORDER.includes(s.sourceKey)),
  ];

  return (
    <div>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        The boundaries and parcel records this readout was checked against. Dates come from the
        database's record of each pull.
      </p>
      <ol className="divide-y divide-border border-y border-border">
        {ordered.map((src, i) => {
          const vintage = vintageText(src);
          return (
            <li key={src.sourceKey} data-reference data-source-key={src.sourceKey} className="py-3">
              <p className="text-sm leading-snug text-foreground">
                <span className="mr-2 tabular-nums text-muted-foreground">{i + 1}.</span>
                {src.datasetName}
              </p>
              <p className="mt-0.5 pl-5 text-xs leading-relaxed text-muted-foreground">
                {src.publisher}
              </p>
              <p className="mt-0.5 pl-5 text-xs leading-relaxed text-muted-foreground">
                {vintage ? `${vintage} · ` : ""}
                {src.sourceLastEdit ? (
                  <>
                    source last edited <Stamp iso={src.sourceLastEdit} kind="last-edit" /> ·{" "}
                  </>
                ) : null}
                pulled <Stamp iso={src.pulledAt} kind="pulled" />
              </p>
              <a
                href={src.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block pl-5 text-xs leading-relaxed break-all text-accent underline underline-offset-2"
              >
                {src.sourceUrl} ↗
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
