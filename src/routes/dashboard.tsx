import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ParcelThumbnail } from "@/components/parcel-thumbnail";
import {
  PROGRAM_FILTERS,
  RESEARCHED_PARCELS,
  SORT_OPTIONS,
  formatReviewed,
  sortResearched,
  type ResearchedParcel,
  type SortKey,
} from "@/lib/researched-parcels";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Saved parcel dashboard | Collective Impact" },
      {
        name: "description",
        content:
          "Every parcel you have researched in one place: eligible funding counts, open tasks, and a link to each parcel report.",
      },
      { property: "og:title", content: "Saved parcel dashboard — Collective Impact" },
      {
        property: "og:description",
        content:
          "Track researched parcels, eligible programs, and open tasks across your pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function DashboardPage() {
  // Prototype gate: no real accounts. Defaults to the non-subscriber preview.
  const [subscribed, setSubscribed] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const [program, setProgram] = useState<string>("all");

  const rows = useMemo(() => {
    const filtered =
      program === "all"
        ? RESEARCHED_PARCELS
        : RESEARCHED_PARCELS.filter((r) => r.programIds.includes(program));
    return sortResearched(filtered, sort);
  }, [program, sort]);

  const visible = subscribed ? rows : rows.slice(0, 2);
  const lockedCount = rows.length - visible.length;

  const totals = useMemo(
    () => ({
      parcels: RESEARCHED_PARCELS.length,
      programs: RESEARCHED_PARCELS.reduce((s, r) => s + r.eligibleCount, 0),
      tasks: RESEARCHED_PARCELS.reduce((s, r) => s + r.openTasks, 0),
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="rule-label">Subscriber workspace</p>
            <h1 className="mt-3 font-heading font-bold text-4xl tracking-tight text-foreground">
              Saved parcel dashboard
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every parcel you have researched, with its funding read, open follow-ups, and the
              report you can hand to a board or a lender.
            </p>
          </div>
          <button
            onClick={() => setSubscribed((s) => !s)}
            className="border border-border px-3 py-2 tabular-nums text-xs tracking-wide text-muted-foreground transition-colors hover:border-accent hover:text-accent rounded-md"
          >
            Prototype shortcut: {subscribed ? "view as non-subscriber" : "simulate subscriber"}
          </button>
        </div>

        <dl className="grid grid-cols-1 gap-[22px] sm:grid-cols-3">
          <Stat label="Parcels researched" value={String(totals.parcels)} />
          <Stat label="Likely eligible program matches" value={String(totals.programs)} />
          <Stat label="Open tasks across parcels" value={String(totals.tasks)} />
        </dl>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <label htmlFor="program" className="rule-label block">
              Filter by funding program
            </label>
            <div className="mt-3 flex flex-wrap gap-2" id="program">
              <FilterChip
                active={program === "all"}
                onClick={() => setProgram("all")}
                label="All programs"
              />
              {PROGRAM_FILTERS.map((p) => (
                <FilterChip
                  key={p.id}
                  active={program === p.id}
                  onClick={() => setProgram(p.id)}
                  label={p.label}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="sort" className="rule-label block">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="mt-3 h-10 border border-border bg-paper px-3 text-sm text-foreground outline-none focus:border-accent rounded-lg"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-6 border-t border-border pt-4 tabular-nums text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "parcel" : "parcels"}
          {program !== "all" &&
            ` with ${PROGRAM_FILTERS.find((p) => p.id === program)?.label} eligibility`}
        </p>

        {rows.length === 0 ? (
          <p className="mt-10 border border-border bg-paper-deep p-8 text-sm text-muted-foreground rounded-lg">
            No researched parcel currently shows eligibility for that program. Clear the filter to
            see the full list.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((row) => (
              <ParcelCard key={row.parcel.id} row={row} />
            ))}
            {!subscribed &&
              rows.slice(2).map((row) => <ParcelCard key={row.parcel.id} row={row} locked />)}
          </div>
        )}

        {!subscribed && lockedCount > 0 && <SubscriberGate lockedCount={lockedCount} />}
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      <dt className="rule-label">{label}</dt>
      <dd className="mt-2 font-heading text-[32px] leading-tight font-bold text-accent">{value}</dd>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-paper text-muted-foreground hover:border-accent hover:text-accent"
      } rounded-md`}
    >
      {label}
    </button>
  );
}

function ParcelCard({ row, locked = false }: { row: ResearchedParcel; locked?: boolean }) {
  const { parcel } = row;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-paper transition-[transform,box-shadow] duration-200 ${
        locked
          ? "pointer-events-none select-none blur-[3px]"
          : "hover:-translate-y-1 hover:shadow-card"
      }`}
      aria-hidden={locked}
    >
      <ParcelThumbnail parcel={parcel} muted={locked} />

      <div className="flex flex-1 flex-col p-5">
        <p className="tabular-nums text-xs text-muted-foreground">Parcel {parcel.parcelId}</p>
        <h2 className="mt-1 font-heading font-bold text-xl leading-snug text-foreground">
          {parcel.address}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {parcel.zoning} · {parcel.acreage} acres · {currency.format(parcel.assessedValue)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-paper-deep px-3 py-2.5">
            <p className="font-heading font-bold text-2xl text-foreground">{row.eligibleCount}</p>
            <p className="rule-label mt-0.5">Eligible programs</p>
          </div>
          <div className="rounded-lg bg-paper-deep px-3 py-2.5">
            <p className="font-heading font-bold text-2xl text-accent">{row.openTasks}</p>
            <p className="rule-label mt-0.5">Open tasks</p>
          </div>
        </div>

        {row.maybeCount > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Plus {row.maybeCount} program{row.maybeCount === 1 ? "" : "s"} that may apply with
            additional documentation.
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed text-foreground">{row.note}</p>

        <p className="mt-4 tabular-nums text-xs text-muted-foreground">
          Last reviewed {formatReviewed(row.lastReviewed)}
        </p>

        <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
          <Link
            to="/map"
            search={{ parcel: parcel.id, report: true }}
            tabIndex={locked ? -1 : undefined}
            className="flex-1 bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover rounded-md"
          >
            Open report
          </Link>
          <Link
            to="/map"
            search={{ parcel: parcel.id }}
            tabIndex={locked ? -1 : undefined}
            className="border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent rounded-md"
          >
            View on map
          </Link>
        </div>
      </div>
    </article>
  );
}

function SubscriberGate({ lockedCount }: { lockedCount: number }) {
  return (
    <section className="mt-10 border border-border bg-paper-deep p-8 rounded-2xl">
      <p className="rule-label">Subscriber only</p>
      <h2 className="mt-3 font-heading font-bold text-2xl text-foreground">
        {lockedCount} more researched {lockedCount === 1 ? "parcel is" : "parcels are"} saved to
        this workspace
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The dashboard keeps every parcel you have looked at, so a funding read done in March is
        still there in October — with its citations, its tasks, and its report. A subscription
        unlocks the full list, unlimited reports, and unlimited chat questions.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="border border-border shadow-panel bg-paper p-6 rounded-2xl">
          <p className="rule-label">Recommended</p>
          <h3 className="mt-2 font-heading font-bold text-xl text-foreground">
            Monthly subscription
          </h3>
          <p className="mt-2 tabular-nums text-sm text-accent">[ pricing to be confirmed ]</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Unlimited parcel reports</li>
            <li>Saved parcel dashboard with tasks and history</li>
            <li>Unlimited chat questions with citations</li>
          </ul>
          <button className="mt-6 w-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover rounded-md">
            Start subscription
          </button>
        </div>
        <div className="border border-border bg-paper p-6 rounded-2xl">
          <h3 className="font-heading font-bold text-xl text-foreground">One-time report</h3>
          <p className="mt-2 tabular-nums text-sm text-accent">[ pricing to be confirmed ]</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Single parcel, downloadable PDF</li>
            <li>Full funding rationale and citations</li>
            <li>No dashboard or saved history</li>
          </ul>
          <button className="mt-6 w-full border border-accent px-4 py-3 text-sm font-medium text-accent transition-colors hover:bg-primary hover:text-primary-foreground rounded-md">
            Buy a single report
          </button>
        </div>
      </div>
    </section>
  );
}
