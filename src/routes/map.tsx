import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { GIS_LAYER_IDS, fetchGisLayer, type GisStatus } from "@/lib/tulsa-gis";
import { ParcelChat } from "@/components/parcel-chat";
import { TaskPanel } from "@/components/task-panel";
import { ReportPreview } from "@/components/report-preview";
import {
  LAYERS,
  PARCELS,
  ZONING,
  programsFor,
  type LayerId,
  type Parcel,
  type ProgramStatus,
} from "@/lib/tulsa-map-data";
import { INITIAL_TASKS, createManualTask, createTaskFromAction, type Task } from "@/lib/tasks";
import { zoningSourceIds } from "@/lib/citations";
import { DisbursementDetail } from "@/components/disbursement";
import { ContactBlock } from "@/components/contact-block";
import { ComplexityNote } from "@/components/complexity";
import { AssistanceInterest } from "@/components/assistance-request";
import { contactForProgram } from "@/lib/contacts";
import {
  Cite,
  CiteStack,
  CitationScope,
  CoverageBar,
  CoverageLegend,
  LevelFilterControl,
  LevelFilterScope,
  ReferenceList,
  type LevelFilterValue,
} from "@/components/citation";
import {
  FundingViewTabs,
  ResidentAssistance,
  RESIDENT_CITATION_IDS,
  type FundingView,
} from "@/components/resident-assistance";

import { PROGRAM_COVERAGE, PROGRAM_REQUIREMENTS } from "@/lib/jurisdictions";
import {
  LayerControl,
  choroplethColor,
  choroplethRange,
  meetsThreshold,
} from "@/components/layer-control";
import {
  LAYER_CITATIONS,
  MFI_THRESHOLD,
  POVERTY_THRESHOLD,
  RENT_EFFECTIVE_YEAR,
  TRACTS,
  UNEMPLOYMENT_BENCHMARK,
  ZIP_AREAS,
  nmtcEligible,
  nmtcTestsMet,
  tractFor,
  tractValue,
  zipValue,
  type ChoroplethId,
} from "@/lib/census-layers";
import type { UnitSize } from "@/lib/underwriting";
import { UnderwritingLimits } from "@/components/underwriting";
import { UNDERWRITING_CITATIONS } from "@/lib/underwriting";
import { CostSavers } from "@/components/cost-savers";
import { OrgFitNote, OrgProfilePrompt, StatusGates } from "@/components/org-status";
import { ORG_CITATION_IDS, CHDO_ROUTE_COPY, chdoRouteFor, type OrgType } from "@/lib/org-status";
import { COST_SAVER_CITATION_IDS } from "@/lib/cost-savers";
import { groupByTier, type AccessAssessment } from "@/lib/accessibility";
import {
  AccessModelLine,
  AccessPath,
  AssumedOrgNote,
  EffortVsAward,
  RelationshipSources,
  TierHeading,
  WhyNotTierOne,
} from "@/components/accessibility";

import {
  ActionPlanView,
  LockedPlan,
  PlanUpgradeCard,
  ProgramSelector,
  type AddTaskInput,
} from "@/components/action-plan";
import { ALL_PLAN_CITATION_IDS, actionPlanFor, chdoPlanFor } from "@/lib/action-plans";

export const Route = createFileRoute("/map")({
  validateSearch: (search: Record<string, unknown>): { parcel?: string; report?: boolean } => {
    const out: { parcel?: string; report?: boolean } = {};
    if (typeof search["parcel"] === "string") out.parcel = search["parcel"];
    if (search["report"] === true || search["report"] === "true") out.report = true;
    return out;
  },

  head: () => ({
    meta: [
      { title: "Parcel map — Tulsa, Oklahoma | Collective Impact" },
      {
        name: "description",
        content:
          "Select a Tulsa parcel to see zoning, boundary overlays, and which federal, state, and local housing programs it qualifies for.",
      },
      { property: "og:title", content: "Parcel funding map — Tulsa, Oklahoma" },
      {
        property: "og:description",
        content: "Zoning, overlays, and funding eligibility for individual parcels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function MapPage() {
  const search = Route.useSearch();
  const initialParcel = search.parcel
    ? (PARCELS.find((p) => p.id === search.parcel) ?? PARCELS[6] ?? null)
    : (PARCELS[6] ?? null);
  const [selected, setSelected] = useState<Parcel | null>(initialParcel);
  // Layer selections live here, above the parcel, so they persist as the user
  // moves between parcels.
  const [active, setActive] = useState<Record<LayerId, boolean>>({
    tif: true,
    "tif-36th": false,
    zoning: false,
    qct: true,
    dda: false,
    usda: false,
    fema: true,
    oz: false,
    nmtc: false,
    district1: false,
    htf: false,
    nio: false,
    nco: false,
    hp: false,
  });
  const [choropleth, setChoropleth] = useState<ChoroplethId | null>(null);
  const [unit, setUnit] = useState<UnitSize>("2br");
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(Boolean(search.report && initialParcel));
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [chdoDesignated, setChdoDesignated] = useState(false);
  const [gisStatus, setGisStatus] = useState<Record<string, GisStatus>>({});

  const openTaskCount = tasks.filter((t) => !t.completed).length;

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  const toggle = (id: LayerId) => setActive((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-screen lg:flex-row lg:overflow-hidden">
      <div className="relative h-[60vh] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
        <MapCanvas
          active={active}
          choropleth={choropleth}
          unit={unit}
          onGisStatus={setGisStatus}
          focus={
            selected ? { id: selected.id, points: selected.points, label: selected.address } : null
          }
        />

        {/* Task list toggle */}
        <div className="absolute right-4 top-4 z-20">
          <button
            onClick={() => setTasksOpen(true)}
            aria-label="Open task list"
            className="pointer-events-auto flex items-center gap-2 border border-border bg-paper px-3 py-2 text-sm text-foreground hover:border-accent hover:text-accent rounded-md"
          >
            <span className="rule-label">Tasks</span>
            {openTaskCount > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-accent-foreground">
                {openTaskCount}
              </span>
            )}
          </button>
        </div>

        {/* Layer control, top-left */}
        <LayerControl
          active={active}
          toggle={toggle}
          choropleth={choropleth}
          onChoropleth={setChoropleth}
          unit={unit}
          onUnit={setUnit}
          gisStatus={gisStatus}
          className="top-4"
        />

        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            aria-label="Open AI assistant"
            className="absolute bottom-3 right-16 z-20 border border-primary bg-primary px-4 py-2.5 text-left text-primary-foreground shadow-card transition-colors hover:bg-primary-hover rounded-lg"
          >
            <span className="block text-xs font-medium">AI assistant</span>
            <span className="block text-[10px] text-primary-foreground/80">
              Ask about this parcel
            </span>
          </button>
        )}

        <div className="absolute bottom-3 left-3 z-10 rule-label rounded-md bg-paper/85 px-2 py-1 backdrop-blur-sm">
          Tulsa, Oklahoma · sample parcel data
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col border-l border-border bg-paper lg:h-screen lg:w-[400px]">
        <div className={`min-h-0 overflow-y-auto ${chatOpen ? "flex-[0_0_42%]" : "flex-1"}`}>
          <SidePanel
            key={selected?.id ?? "none"}
            parcel={selected}
            orgType={orgType}
            onOrgTypeChange={setOrgType}
            chdoDesignated={chdoDesignated}
            onChdoDesignatedChange={setChdoDesignated}
            onGenerateReport={() => setReportOpen(true)}
            onAddTask={(input) => addTask(createManualTask(input))}
          />
        </div>
        {chatOpen ? (
          <div className="fixed bottom-3 right-3 z-40 h-[min(70vh,36rem)] w-[min(400px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border shadow-popover lg:rounded-none lg:static lg:h-auto lg:min-h-0 lg:w-auto lg:flex-1 lg:border-0 lg:shadow-none">
            <ParcelChat
              parcel={selected}
              onSelectParcel={setSelected}
              onClose={() => setChatOpen(false)}
              onAddTask={(action) => addTask(createTaskFromAction(action))}
            />
          </div>
        ) : null}
      </aside>

      <ReportPreview
        parcel={selected}
        tasks={tasks}
        orgType={orgType}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />

      <TaskPanel
        open={tasksOpen}
        onClose={() => setTasksOpen(false)}
        tasks={tasks}
        onToggle={toggleTask}
      />
    </div>
  );
}

/* ------------------------------- map canvas ------------------------------ */

const BaseMap = lazy(() => import("@/components/basemap").then((m) => ({ default: m.BaseMap })));

function MapCanvas({
  active,
  choropleth,
  unit,
  onGisStatus,
  focus,
}: {
  active: Record<LayerId, boolean>;
  choropleth: ChoroplethId | null;
  unit: UnitSize;
  onGisStatus: (s: Record<string, GisStatus>) => void;
  focus: { id: string; points: [number, number][]; label: string } | null;
}) {
  // Layers backed by published city GIS data are drawn as real polygons by
  // Leaflet, so they never get an illustrative rectangle.
  const activeLayers = LAYERS.filter((l) => active[l.id] && !l.real);

  const gisIds = GIS_LAYER_IDS.filter((id) => active[id]);
  const gisQueries = useQueries({
    queries: GIS_LAYER_IDS.map((id) => ({
      queryKey: ["tulsa-gis", id],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchGisLayer(id, signal),
      enabled: active[id],
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60,
    })),
  });

  useEffect(() => {
    const status: Record<string, GisStatus> = {};
    GIS_LAYER_IDS.forEach((id, i) => {
      const q = gisQueries[i];
      if (!active[id] || !q) return;
      status[id] = q.data ? q.data.source : q.isError ? "error" : "loading";
    });
    onGisStatus(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(
      GIS_LAYER_IDS.map((id, i) => [
        active[id],
        gisQueries[i]?.data?.source,
        gisQueries[i]?.isError,
      ]),
    ),
  ]);

  // Recomputed every render on purpose: BaseMap diffs by layer id, so handing
  // it a fresh array is cheap and avoids stale-memo races while data loads.
  const geoLayers = gisIds.flatMap((id) => {
    const q = gisQueries[GIS_LAYER_IDS.indexOf(id)];
    const layer = LAYERS.find((l) => l.id === id);
    if (!q?.data || !layer) return [];
    return [{ id, data: q.data.data, color: layer.color }];
  });
  // Three or more stacked boundaries become unreadable as fills.
  const outlineOnly = activeLayers.length > 2;

  const artwork = (
    <g>
      {/* graduated choropleth — at most one, drawn beneath the boundaries */}
      {choropleth && <ChoroplethLayer id={choropleth} unit={unit} />}

      {/* overlay layers */}
      {activeLayers.map((l) => (
        <g key={l.id}>
          <rect
            x={l.rect.x}
            y={l.rect.y}
            width={l.rect.w}
            height={l.rect.h}
            fill={outlineOnly ? "none" : l.color}
            fillOpacity={outlineOnly ? 0 : 0.14}
            stroke={l.color}
            strokeWidth={outlineOnly ? 2.5 : 2}
            strokeDasharray="8 5"
          />
          <text
            x={l.rect.x + 8}
            y={l.rect.y + 18}
            fontFamily="var(--font-mono)"
            fontSize={11}
            fill={l.color}
          >
            {l.name.toUpperCase()}
          </text>
        </g>
      ))}
    </g>
  );

  return (
    // z-0 creates a stacking context so Leaflet's internal high z-indexes
    // (tiles 200, panes 400+, controls 1000) stay inside the map and cannot
    // paint over the sibling search bar, task button, or layer panel (z-20).
    <div className="absolute inset-0 z-0">
      <ClientOnly fallback={<div className="band-soft absolute inset-0" />}>
        <Suspense fallback={<div className="band-soft absolute inset-0" />}>
          <BaseMap femaFloodplain={!!active.fema} geoLayers={geoLayers} focus={focus}>
            {artwork}
          </BaseMap>
        </Suspense>
      </ClientOnly>
    </div>
  );
}

function ChoroplethLayer({ id, unit }: { id: ChoroplethId; unit: UnitSize }) {
  const range = choroplethRange(id, unit);
  const isTract =
    id === "poverty" || id === "mfi" || id === "unemployment" || id === "nmtc-eligible";
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  if (isTract) {
    return (
      <g>
        {TRACTS.map((t) => {
          const v = tractValue(id, t);
          const passes = meetsThreshold(id, v);
          return (
            <g key={t.geoid}>
              <rect
                x={t.rect.x}
                y={t.rect.y}
                width={t.rect.w}
                height={t.rect.h}
                fill={choroplethColor(id, v, range)}
                fillOpacity={0.45}
                stroke={passes ? "var(--color-accent)" : "var(--rule)"}
                strokeWidth={passes ? 3 : 1}
              >
                <title>{`${t.name} — ${id === "nmtc-eligible" ? (nmtcEligible(t) ? "eligible" : "not eligible") : `${v}%`}`}</title>
              </rect>
              <text
                x={t.rect.x + 8}
                y={t.rect.y + 18}
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill="var(--color-foreground)"
                pointerEvents="none"
              >
                {id === "nmtc-eligible" ? (nmtcEligible(t) ? "ELIGIBLE" : "NOT ELIGIBLE") : `${v}%`}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <g>
      {ZIP_AREAS.map((z) => {
        const v = zipValue(id, z, unit);
        return (
          <g key={z.zip}>
            <rect
              x={z.rect.x}
              y={z.rect.y}
              width={z.rect.w}
              height={z.rect.h}
              fill={choroplethColor(id, v, range)}
              fillOpacity={0.45}
              stroke="var(--rule)"
              strokeWidth={1}
            >
              <title>{`${z.zip} — ${money.format(v)}`}</title>
            </rect>
            <text
              x={z.rect.x + 8}
              y={z.rect.y + 18}
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-foreground)"
              pointerEvents="none"
            >
              {z.zip} · {money.format(v)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------- side panel ------------------------------ */

function statusClass(status: ProgramStatus) {
  if (status === "Likely eligible") return "border-primary bg-primary text-primary-foreground";
  if (status === "May be eligible") return "border-accent text-accent";
  return "border-border text-muted-foreground";
}

function SidePanel({
  parcel,
  orgType,
  onOrgTypeChange,
  chdoDesignated,
  onChdoDesignatedChange,
  onGenerateReport,
  onAddTask,
}: {
  parcel: Parcel | null;
  orgType: OrgType | null;
  onOrgTypeChange: (v: OrgType | null) => void;
  chdoDesignated: boolean;
  onChdoDesignatedChange: (v: boolean) => void;
  onGenerateReport: () => void;
  onAddTask: (input: AddTaskInput) => void;
}) {
  const [levelFilter, setLevelFilter] = useState<LevelFilterValue>("all");
  const [fundingView, setFundingView] = useState<FundingView>("development");
  const [residentView, setResidentView] = useState<"renter" | "buyer">("renter");
  const [chosenProgram, setChosenProgram] = useState<string | null>(null);

  if (!parcel) {
    return (
      <div className="flex h-full flex-col justify-center p-8">
        <p className="rule-label">No parcel selected</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Open the AI assistant and enter an address to load its parcel record.
        </p>
      </div>
    );
  }

  const zoning = ZONING[parcel.zoning];
  const programs = programsFor(parcel);
  const z = zoningSourceIds(parcel.zoning);
  const overlays = LAYERS.filter((l) => parcel.layers.includes(l.id));

  const citationIds = [
    "assessor-record",
    "assessor-value",
    ...overlays.map((l) => `ov-${l.id}`),
    ...programs.flatMap((p) => [
      p.sourceId,
      ...(PROGRAM_REQUIREMENTS[p.id] ?? []).flatMap((r) => r.sourceIds),
    ]),
    z.district,
    z.uses,
    z.height,
    z.lot,
    ...UNDERWRITING_CITATIONS,
    ...RESIDENT_CITATION_IDS,
    ...COST_SAVER_CITATION_IDS,
    ...ALL_PLAN_CITATION_IDS,
    ...LAYER_CITATIONS,
    ...ORG_CITATION_IDS,
    "pg-htc",
    "st-shpo",
  ];

  const tract = tractFor(parcel.centroid);
  const nmtcOk = tract ? nmtcEligible(tract) : false;
  const inQct = parcel.layers.includes("qct");
  const infill = LAYERS.filter((l) => l.category === "D" && parcel.layers.includes(l.id));

  return (
    <CitationScope ids={citationIds}>
      <LevelFilterScope value={levelFilter}>
        <div className="flex min-h-full flex-col">
          <div className="border-b border-border px-6 py-5">
            <Link to="/" className="rule-label hover:text-accent">
              ← Collective Impact
            </Link>
            <h1 className="mt-3 font-heading font-bold text-2xl leading-snug text-foreground">
              {parcel.address}
            </h1>
            <p className="text-sm text-muted-foreground">Tulsa, OK</p>
          </div>

          <Section title="Parcel facts">
            <dl className="divide-y divide-border border-y border-border">
              <Fact label="Address" value={parcel.address} citeId="assessor-record" />
              <Fact label="Parcel ID" value={parcel.parcelId} mono citeId="assessor-record" />
              <Fact
                label="Acreage"
                value={`${parcel.acreage.toFixed(2)} acres`}
                citeId="assessor-record"
              />
              <Fact label="Zoning code" value={zoning.label} citeId={z.district} />
              <Fact
                label="Assessed value"
                value={currency.format(parcel.assessedValue)}
                mono
                citeId="assessor-value"
              />
            </dl>
            {overlays.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {overlays.map((l) => (
                  <span
                    key={l.id}
                    className="border px-2 py-0.5 text-xs rounded-md"
                    style={{ color: l.color, borderColor: l.color }}
                  >
                    {l.short}
                    <Cite id={`ov-${l.id}`} />
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section title="Census indicators for this tract">
            {tract ? (
              <>
                <p className="text-sm text-foreground">
                  {tract.name}
                  <span className="ml-2 tabular-nums text-xs text-muted-foreground">
                    {tract.geoid}
                  </span>
                </p>
                <dl className="mt-3 divide-y divide-border border-y border-border">
                  <Measure
                    label="Poverty rate"
                    value={`${tract.poverty.toFixed(1)}%`}
                    threshold={`Threshold ${POVERTY_THRESHOLD}%`}
                    margin={`${(tract.poverty - POVERTY_THRESHOLD).toFixed(1)} pts ${tract.poverty >= POVERTY_THRESHOLD ? "above" : "below"} the threshold`}
                    passes={tract.poverty >= POVERTY_THRESHOLD}
                    citeId="cb-acs-poverty"
                  />
                  <Measure
                    label="Median family income"
                    value={`${tract.mfiPct}% of AMI`}
                    threshold={`Threshold ${MFI_THRESHOLD}%`}
                    margin={`${Math.abs(tract.mfiPct - MFI_THRESHOLD)} pts ${tract.mfiPct <= MFI_THRESHOLD ? "below" : "above"} the threshold`}
                    passes={tract.mfiPct <= MFI_THRESHOLD}
                    citeId="cb-acs-mfi"
                  />
                  <Measure
                    label="Unemployment"
                    value={`${tract.unemployment.toFixed(1)}%`}
                    threshold={`Benchmark ${UNEMPLOYMENT_BENCHMARK}%`}
                    margin={`${Math.abs(tract.unemployment - UNEMPLOYMENT_BENCHMARK).toFixed(1)} pts ${tract.unemployment >= UNEMPLOYMENT_BENCHMARK ? "above" : "below"} the benchmark`}
                    passes={tract.unemployment >= UNEMPLOYMENT_BENCHMARK}
                    citeId="cb-acs-unemp"
                  />
                </dl>
                <p className="mt-3 text-sm leading-relaxed text-foreground">
                  NMTC status: {nmtcOk ? "eligible" : "not eligible"}
                  <Cite id="cb-nmtc" />
                  {nmtcOk && ` — meets the ${nmtcTestsMet(tract).join(" and the ")}.`}
                </p>
                <p className="mt-2 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
                  Margin matters. A tract sitting just over a threshold can fall out of eligibility
                  at the next American Community Survey release; a tract far above it is unlikely
                  to.
                </p>
              </>
            ) : (
              <p className="border border-dashed border-accent px-3 py-2 text-xs leading-relaxed text-accent rounded-lg">
                Tract-level figures for this parcel are not yet loaded. This is not a finding that
                the tract fails the tests.
              </p>
            )}
          </Section>

          <Section title="Eligible funding">
            <FundingViewTabs value={fundingView} onChange={setFundingView} className="mb-4" />
            {fundingView === "development" ? (
              <>
                <OrgProfilePrompt value={orgType} onChange={onOrgTypeChange} className="mb-4" />
                <LevelFilterControl
                  value={levelFilter}
                  onChange={setLevelFilter}
                  className="mb-4"
                />
                <CoverageLegend className="mb-4" />
                {inQct && nmtcOk && (
                  <div className="mb-4 border-l-2 border-primary bg-secondary px-3 py-3">
                    <p className="rule-label">Stacking opportunity — NMTC with LIHTC</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      This parcel is in both a Qualified Census Tract
                      <Cite id="ov-qct" />
                      and an NMTC-eligible tract.
                      <Cite id="ov-nmtc" />
                      In a mixed-use building the two credits can be paired: divide the building
                      into a condominium regime, finance the commercial or community-facility
                      portion with New Markets credits, and finance the residential portion with
                      housing credits. Each credit then attaches only to the component it is
                      actually eligible for.
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      The condominium documents, cost allocation, and separate ownership entities
                      have to be in place before either closing. Confirm the structure with tax
                      counsel.
                    </p>
                  </div>
                )}
                {infill.length > 0 && (
                  <div className="mb-4 border border-border px-3 py-3 rounded-lg">
                    <p className="rule-label">Zoning overlays on this parcel</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {infill.map((l) => (
                        <li key={l.id} className="text-sm leading-relaxed text-foreground">
                          {l.name}
                          <Cite id={`ov-${l.id}`} />
                          {l.favorable && (
                            <span className="ml-2 border border-primary bg-primary px-1.5 py-0.5 text-[10px] tracking-wide text-primary-foreground rounded-md">
                              Favorable for housing
                            </span>
                          )}
                          <span className="block text-xs text-muted-foreground">
                            {l.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {parcel.layers.includes("hp") && (
                      <p className="mt-2 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
                        HP overlay is a City of Tulsa design-review district administered by the
                        Tulsa Preservation Commission. It is not National Register listing, and it
                        does not by itself make the building eligible for the Historic
                        Rehabilitation Tax Credit — that requires separate certification through the
                        State Historic Preservation Office and the National Park Service.
                        <Cite id="st-shpo" />
                      </p>
                    )}
                  </div>
                )}
                <AssumedOrgNote org={orgType} className="mb-4" />
                {groupByTier(programs, orgType, chdoDesignated).map((group) => (
                  <div key={group.tier} className="mb-6">
                    <TierHeading tier={group.tier} count={group.items.length} />
                    {group.items.length === 0 ? (
                      <p className="border-y border-border py-3 text-sm leading-relaxed text-muted-foreground">
                        Nothing on this parcel falls in this tier for your organization.
                      </p>
                    ) : (
                      <ul className="border-y border-border">
                        {group.items.map(({ item, assessment }) => (
                          <ProgramRow
                            key={item.id}
                            program={item}
                            assessment={assessment}
                            org={orgType}
                            chdoDesignated={chdoDesignated}
                            onChdoDesignatedChange={onChdoDesignatedChange}
                          />
                        ))}
                      </ul>
                    )}
                    {group.tier === 3 && (
                      <>
                        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                          Capital with no parcel test — access turns on who knows you, not where the
                          land is. Shown here so it is on your map at all.
                        </p>
                        <RelationshipSources className="mt-2" />
                      </>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <ResidentAssistance view={residentView} onViewChange={setResidentView} />
            )}
          </Section>

          <Section title="Free action plan">
            {(() => {
              const eligible = programs.filter((pr) => pr.status !== "Not eligible");
              const chosen = eligible.find((pr) => pr.id === chosenProgram) ?? null;
              const resolvePlan = (id: string) =>
                id === "home-chdo"
                  ? chdoPlanFor(chdoRouteFor(orgType, chdoDesignated) ?? "certify")
                  : actionPlanFor(id);
              const plan = chosen ? resolvePlan(chosen.id) : null;
              if (!chosen) {
                return (
                  <ProgramSelector
                    programs={programs}
                    chosen={chosenProgram}
                    onChoose={setChosenProgram}
                    resolvePlan={resolvePlan}
                  />
                );
              }
              if (!plan) {
                return (
                  <LockedPlan
                    programName={chosen.name}
                    onChangeProgram={() => setChosenProgram(null)}
                    onUpgrade={onGenerateReport}
                  />
                );
              }
              return (
                <>
                  <ActionPlanView
                    plan={plan}
                    onAddTask={onAddTask}
                    onChangeProgram={() => setChosenProgram(null)}
                  />
                  <AssistanceInterest
                    programId={plan.programId}
                    programName={plan.programName}
                    parcelId={parcel.parcelId}
                    parcelAddress={parcel.address}
                    className="mt-6"
                  />
                  <PlanUpgradeCard
                    remaining={Math.max(eligible.length - 1, 1)}
                    onUpgrade={onGenerateReport}
                    className="mt-6"
                  />
                </>
              );
            })()}
          </Section>

          <Section title="Organizational status gates">
            <StatusGates org={orgType} />
          </Section>

          <Section title="Cost and time savers">
            <CostSavers parcel={parcel} />
          </Section>

          <Section title="Underwriting limits">
            <UnderwritingLimits programs={programs} />
          </Section>

          <Section title="What you can build here">
            <p className="text-sm text-foreground">
              {zoning.label}
              <Cite id={z.district} />
            </p>
            <p className="rule-label mt-4">
              Permitted housing types
              <Cite id={z.uses} />
            </p>
            <ul className="mt-2 space-y-1.5">
              {zoning.permitted.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-foreground">
                  <span className="text-primary-deep">▪</span>
                  {t}
                </li>
              ))}
            </ul>
            <p className="rule-label mt-4">
              Conditional / discretionary
              <Cite id={z.uses} />
            </p>
            <ul className="mt-2 space-y-1.5">
              {zoning.conditional.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="text-accent">▫</span>
                  {t}
                </li>
              ))}
            </ul>
            <dl className="mt-4 divide-y divide-border border-y border-border">
              <Fact label="Max height" value={zoning.maxHeight} citeId={z.height} />
              <Fact label="Min lot area" value={zoning.minLot} citeId={z.lot} />
            </dl>
            <p className="mt-4 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
              Preliminary zoning summary. Dimensional standards, overlays, and platting requirements
              can change what is actually buildable — confirm with the City of Tulsa Planning Office
              before relying on this.
            </p>
          </Section>

          <Section title="References">
            <ReferenceList title="Sources cited in this panel" />
          </Section>

          <div className="mt-auto border-t border-border bg-paper-deep p-6">
            <button
              onClick={onGenerateReport}
              className="w-full border border-primary bg-primary px-4 py-3.5 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary-hover rounded-md"
            >
              Generate report for this parcel
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Prototype — all records shown are sample data.
            </p>
          </div>
        </div>
      </LevelFilterScope>
    </CitationScope>
  );
}

function Measure({
  label,
  value,
  threshold,
  margin,
  passes,
  citeId,
}: {
  label: string;
  value: string;
  threshold: string;
  margin: string;
  passes: boolean;
  citeId: string;
}) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <dt className="rule-label">
        {label}
        <Cite id={citeId} />
      </dt>
      <dd>
        <span
          className={`tabular-nums text-sm ${passes ? "text-primary-deep" : "text-foreground"}`}
        >
          {value}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">{threshold}</span>
        <span className="block text-xs text-muted-foreground">{margin}</span>
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-6 py-6">
      <h2 className="rule-label">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Fact({
  label,
  value,
  mono,
  citeId,
}: {
  label: string;
  value: string;
  mono?: boolean;
  citeId?: string;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2.5">
      <dt className="rule-label pt-0.5">{label}</dt>
      <dd className={`text-sm text-foreground ${mono ? "tabular-nums" : ""}`}>
        {value}
        {citeId && <Cite id={citeId} />}
      </dd>
    </div>
  );
}

function ProgramRow({
  program,
  assessment,
  org,
  chdoDesignated,
  onChdoDesignatedChange,
}: {
  program: ReturnType<typeof programsFor>[number];
  assessment: AccessAssessment;
  org: OrgType | null;
  chdoDesignated: boolean;
  onChdoDesignatedChange: (v: boolean) => void;
}) {
  const isChdo = program.id === "home-chdo";
  const chdoRoute = isChdo ? chdoRouteFor(org, chdoDesignated) : null;
  const [open, setOpen] = useState(false);
  const coverage = PROGRAM_COVERAGE[program.id];
  const requirements = PROGRAM_REQUIREMENTS[program.id] ?? [];
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 py-3 text-left"
      >
        <span>
          <span className="block text-sm font-medium leading-snug text-foreground">
            {program.name}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{program.agency}</span>
        </span>
        <span
          className={`shrink-0 border px-2 py-0.5 text-[11px] leading-tight ${statusClass(program.status)} rounded-md`}
        >
          {program.status}
        </span>
      </button>
      <AccessModelLine assessment={assessment} className="pb-2" />
      <AccessPath assessment={assessment} className="mb-3" />
      <WhyNotTierOne assessment={assessment} className="pb-3" />
      <EffortVsAward assessment={assessment} className="mb-3" />
      <DisbursementDetail id={program.disbursement} timing={program.timing} className="pb-3" />
      {coverage && <CoverageBar coverage={coverage} className="pb-3" />}
      <ComplexityNote programId={program.id} className="pb-3" />

      {program.id === "home" && (
        <p className="pb-3 text-xs leading-relaxed text-muted-foreground">
          <span className="rule-label mr-2">Related</span>
          The CHDO set-aside below is a reserved portion of this same HOME allocation — not
          additional money. Fewer organizations may compete for it, which makes it the less
          competitive of the two, but only organizations the City of Tulsa has certified may apply.
          <Cite id="og-chdo-setaside" />
        </p>
      )}
      {isChdo ? (
        <ChdoRouteNote
          route={chdoRoute}
          designated={chdoDesignated}
          onDesignatedChange={onChdoDesignatedChange}
          className="pb-3"
        />
      ) : (
        <OrgFitNote programId={program.id} org={org} className="pb-3" />
      )}
      {open && (
        <div className="pb-4 pr-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {program.reason}
            <Cite id={program.sourceId} />
          </p>
          {contactForProgram(program.id) && (
            <div className="mt-3">
              <p className="rule-label mb-1.5">Who administers it — direct contact</p>
              <ContactBlock contact={contactForProgram(program.id)!} />
            </div>
          )}
          {requirements.map((r) => (
            <div key={r.claim} className="mt-3 border-l-2 border-primary pl-3">
              <p className="rule-label">Governed at multiple levels</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {r.claim}
                <CiteStack ids={r.sourceIds} />
              </p>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

function ChdoRouteNote({
  route,
  designated,
  onDesignatedChange,
  className = "",
}: {
  route: ReturnType<typeof chdoRouteFor>;
  designated: boolean;
  onDesignatedChange: (v: boolean) => void;
  className?: string;
}) {
  const copy = route ? CHDO_ROUTE_COPY[route] : null;
  const badgeClass =
    route === "designated"
      ? "border-primary bg-primary text-primary-foreground"
      : route === "certify"
        ? "border-accent text-accent"
        : "border-accent text-accent";

  return (
    <div className={className}>
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="rule-label mr-2">Related</span>
        Reserved portion of the general HOME allocation above — same money, smaller field of
        applicants, restricted to designated organizations.
        <Cite id="og-chdo-setaside" />
      </p>

      {copy ? (
        <div className="mt-2.5 border-l-2 border-primary pl-3">
          <span
            className={`inline-block border px-2 py-0.5 text-[11px] leading-tight ${badgeClass} rounded-md`}
          >
            {copy.badge}
          </span>
          <p className="mt-1.5 text-sm font-medium text-foreground">
            {copy.headline}
            <Cite id="og-chdo-pj" />
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.detail}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Open the free action plan below for the{" "}
            {route === "partner"
              ? "partnership route — the CHDO's role in the deal and the jurisdiction's certified list"
              : route === "certify"
                ? "certification process with the City of Tulsa"
                : "application into the reserved pool"}
            .
          </p>
        </div>
      ) : (
        <p className="mt-2.5 border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
          Tell us your organization type above and this row will show whether the reserve is
          directly available to you, reachable through certification, or reachable through a
          partnership with a certified CHDO. Every organization type has a path.
        </p>
      )}

      <label className="mt-2.5 flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={designated}
          onChange={(e) => onDesignatedChange(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 accent-[var(--color-primary)]"
        />
        <span>Our organization already holds CHDO certification from the City of Tulsa.</span>
      </label>
    </div>
  );
}
