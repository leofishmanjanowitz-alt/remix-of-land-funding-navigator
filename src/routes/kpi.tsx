import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  assistanceKpis,
  formatRequestedAt,
  listAssistanceRequests,
  subscribeAssistanceRequests,
  ASSISTANCE_TYPE_LABEL,
} from "@/lib/assistance-requests";

export const Route = createFileRoute("/kpi")({
  head: () => ({
    meta: [
      { title: "Assistance demand review | Collective Impact" },
      {
        name: "description",
        content:
          "Measurement view for assistance requests: what share of users ask for help, which funding programs generate the most requests, and which kind of help dominates.",
      },
      { property: "og:title", content: "Assistance demand review — Collective Impact" },
      {
        property: "og:description",
        content:
          "Counts of assistance requests by program and assistance type, recorded from action plans and reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KpiPage,
});

function useAssistanceKpis() {
  const list = useSyncExternalStore(
    subscribeAssistanceRequests,
    listAssistanceRequests,
    listAssistanceRequests,
  );
  return assistanceKpis(list);
}

function KpiPage() {
  const kpi = useAssistanceKpis();
  const maxProgram = Math.max(1, ...kpi.byProgram.map((p) => p.count));
  const maxType = Math.max(1, ...kpi.byType.map((t) => t.count));
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <p className="rule-label">Internal measurement</p>
        <h1 className="mt-2 font-serif text-3xl leading-tight text-primary">
          Assistance demand review
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every request recorded from an action plan or a report, with program, assistance type, and
          timestamp. Three questions decide whether a directory or a service offering is worth
          building: what share of users want help, which programs generate the most requests, and
          which kind of help dominates.
        </p>

        <dl className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
          <Stat label="Share of sessions requesting help" value={pct(kpi.requestRate)} note={`${kpi.uniqueUsers} of ${kpi.sessions} sessions`} />
          <Stat label="Requests recorded" value={String(kpi.total)} note="All time, this prototype" />
          <Stat
            label="Leading assistance type"
            value={kpi.byType[0]?.label ?? "—"}
            note={`${kpi.byType[0]?.count ?? 0} requests`}
          />
        </dl>

        <section className="mt-12">
          <h2 className="rule-label border-b border-primary pb-2">Requests by program</h2>
          <ul className="mt-4">
            {kpi.byProgram.map((p) => (
              <li key={p.programId} className="border-b border-border py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-foreground">{p.programName}</span>
                  <span className="font-mono text-sm text-primary">{p.count}</span>
                </div>
                <div className="mt-2 h-1.5 bg-secondary">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(p.count / maxProgram) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="rule-label border-b border-primary pb-2">Requests by assistance type</h2>
          <ul className="mt-4">
            {kpi.byType.map((t) => (
              <li key={t.type} className="border-b border-border py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-foreground">{t.label}</span>
                  <span className="font-mono text-sm text-primary">{t.count}</span>
                </div>
                <div className="mt-2 h-1.5 bg-secondary">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(t.count / maxType) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="rule-label border-b border-primary pb-2">Most recent requests</h2>
          <table className="mt-4 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="rule-label py-2">Date</th>
                <th className="rule-label py-2">Program</th>
                <th className="rule-label py-2">Assistance type</th>
                <th className="rule-label py-2">Parcel</th>
              </tr>
            </thead>
            <tbody>
              {kpi.recent.map((r) => (
                <tr key={r.id} className="border-b border-border align-top">
                  <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">
                    {formatRequestedAt(r.at)}
                  </td>
                  <td className="py-2.5 pr-3 text-sm text-foreground">{r.programName}</td>
                  <td className="py-2.5 pr-3 text-sm text-muted-foreground">
                    {ASSISTANCE_TYPE_LABEL[r.type]}
                  </td>
                  <td className="py-2.5 text-sm text-muted-foreground">
                    {r.parcelAddress ?? "—"}
                    {r.source === "session" && (
                      <span className="ml-2 border border-accent px-1.5 py-0.5 font-mono text-[10px] text-accent">
                        this session
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="mt-8 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
          Demand signal only. No provider directory, no matching, and no referral has been made
          against any of these requests. Counts before this session are seeded prototype data.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-paper px-5 py-4">
      <dt className="rule-label">{label}</dt>
      <dd className="mt-2 font-serif text-2xl leading-tight text-primary">{value}</dd>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}
