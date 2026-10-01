import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { GisStatus } from "@/lib/tulsa-gis";
import { useParcelOutlines, type Viewport } from "@/lib/use-parcel-outlines";
import { ApiError, getParcelDetail, parcelsAt, searchParcels } from "@/lib/parcel-api";
import { formatDate } from "@/lib/overlay-text";
import { ParcelSearchBox } from "@/components/parcel-search";
import { SourceReferences } from "@/components/source-references";
import { CandidateList } from "@/components/candidate-list";
import { OverlayReadout, ParcelSourceLine } from "@/components/parcel-readout";
import type {
  OutlineCollection,
  ParcelDetail,
  ParcelSummary,
  SearchResult,
  SurfaceKind,
} from "@/lib/parcel-types";
import { useOverlays } from "@/lib/use-overlays";
import { useDisplayLayers } from "@/lib/use-display-layers";
import { useSources } from "@/lib/use-sources";
import {
  OVERLAYS,
  OVERLAY_BY_KEY,
  layersFromParam,
  type LayerKey,
  type LayerState,
} from "@/lib/overlays-meta";
import type {
  CandidateParcel,
  GeoLayerRender,
  OverlayRender,
  SelectedParcel,
} from "@/components/basemap";
import { ParcelChat } from "@/components/parcel-chat";
import { TaskPanel } from "@/components/task-panel";
import { ReportPreview } from "@/components/report-preview";
import { PARCELS } from "@/lib/tulsa-map-data";
import { INITIAL_TASKS, createTaskFromAction, type Task } from "@/lib/tasks";
import { Cite } from "@/components/citation";

import { LayerControl } from "@/components/layer-control";
import { MapLegend } from "@/components/map-legend";

export const Route = createFileRoute("/map")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { parcel?: string; report?: boolean; q?: string; layers?: string } => {
    const out: { parcel?: string; report?: boolean; q?: string; layers?: string } = {};
    if (typeof search["layers"] === "string") out.layers = search["layers"];
    // A number is a real parcel id; anything else is a sample id from the prototype dashboard.
    if (typeof search["parcel"] === "string") out.parcel = search["parcel"];
    else if (typeof search["parcel"] === "number") out.parcel = String(search["parcel"]);
    if (typeof search["q"] === "string" && search["q"].trim()) out.q = search["q"].trim();
    if (search["report"] === true || search["report"] === "true") out.report = true;
    return out;
  },

  head: () => ({
    meta: [
      { title: "Parcel map — Tulsa County, Oklahoma | Collective Impact" },
      {
        name: "description",
        content:
          "Search a Tulsa County address or click a parcel to see which TIF district, census tract, Difficult Development Area, Opportunity Zone, USDA area, city and council district it sits in.",
      },
      { property: "og:title", content: "Parcel funding map — Tulsa, Oklahoma" },
      {
        property: "og:description",
        content: "Which boundary overlays a Tulsa County parcel sits in.",
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

interface CandidateSet {
  title: string;
  hint: string;
  results: ParcelSummary[];
}

const SURFACE_MESSAGE: Record<Exclude<SurfaceKind, "parcel">, string> = {
  right_of_way: "That's a street or right-of-way, not a parcel.",
  rail: "That's a rail corridor, not a parcel.",
  water: "That's a river or other water body, not a parcel.",
  other: "That area is a divided-interest record, which isn't selectable as a parcel.",
  nothing: "No parcel here. The parcel data covers Tulsa County.",
};

/** Street level and closer, where a click lands on one lot rather than a neighbourhood. */
const CLICK_MIN_ZOOM = 15;

function MapPage() {
  const search = Route.useSearch();
  const numericParcel = search.parcel && /^\d+$/.test(search.parcel) ? Number(search.parcel) : null;
  // The prototype dashboard links here with sample ids; those are not real records.
  const sampleParcel =
    search.parcel && numericParcel === null
      ? (PARCELS.find((p) => p.id === search.parcel) ?? null)
      : null;

  const [selectedId, setSelectedId] = useState<number | null>(numericParcel);
  const [candidates, setCandidates] = useState<CandidateSet | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Layer selections live here, above the parcel, so they persist as the user
  // moves between parcels. ?layers=all (or a comma list) switches them on from a link.
  const [layers, setLayers] = useState<LayerState>(() => layersFromParam(search.layers));
  const toggleLayer = useCallback(
    (key: LayerKey) => setLayers((s) => ({ ...s, [key]: !s[key] })),
    [],
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(Boolean(search.report && sampleParcel));
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const outlines = useParcelOutlines(viewport);

  // Overlays from the database: only the ones switched on are fetched.
  const overlayLoads = useOverlays(OVERLAYS.filter((o) => layers[o.key]).map((o) => o.key));
  const overlays: OverlayRender[] = overlayLoads.flatMap((o) =>
    o.status === "ready" ? [{ meta: OVERLAY_BY_KEY[o.kind], data: o.data }] : [],
  );
  // City floodplains and zoning: display only, straight from the City's service.
  const display = useDisplayLayers(layers);
  const layerStatus: Partial<Record<string, GisStatus>> = { ...display.status };
  for (const o of overlayLoads) if (o.status !== "ready") layerStatus[o.kind] = o.status;

  const detailQuery = useQuery({
    queryKey: ["parcel", selectedId],
    queryFn: ({ signal }) => getParcelDetail(selectedId!, signal),
    enabled: selectedId !== null,
    staleTime: 10 * 60 * 1000,
    // A missing or malformed id will not fix itself; only retry server trouble.
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
  });
  const detail = selectedId !== null ? (detailQuery.data ?? null) : null;

  const openTaskCount = tasks.filter((t) => !t.completed).length;

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  // Keep the address bar in step so a selection can be shared. Written straight to history:
  // the router would quote a numeric id ("31990") and re-render the whole page.
  const setUrl = useCallback((next: { parcel?: string }) => {
    const params = new URLSearchParams(window.location.search);
    if (next.parcel) params.set("parcel", next.parcel);
    else params.delete("parcel");
    params.delete("q"); // a search link is used up once its search has run
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, []);

  const selectParcel = useCallback(
    (id: number) => {
      setSelectedId(id);
      setCandidates(null);
      setHighlightId(null);
      setNotice(null);
      setUrl({ parcel: String(id) });
    },
    [setUrl],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setCandidates(null);
    setUrl({});
  }, [setUrl]);

  const showCandidates = useCallback(
    (set: CandidateSet) => {
      setSelectedId(null);
      setNotice(null);
      setCandidates(set);
      setUrl({});
    },
    [setUrl],
  );

  // One place decides what a search result means, for the search box and the chat alike:
  // one parcel is selected, several open a pick list, none says so. Never auto-select among several.
  const applySearchResults = useCallback(
    (q: string, res: SearchResult) => {
      if (res.results.length === 0) {
        setCandidates(null);
        const kind = res.interpretedAs.kind;
        setNotice(
          kind === "parcel_number" || kind === "account_number"
            ? `No parcel in Tulsa County has the number “${q}”.`
            : res.interpretedAs.kind === "address" && res.interpretedAs.houseNumber === null
              ? `No addresses found on “${q}”. Check the spelling, or add a house number.`
              : `No parcel found at “${q}”. Check the spelling, or search the street name alone to list its addresses.`,
        );
      } else if (res.results.length === 1) {
        selectParcel(res.results[0]!.id);
      } else {
        showCandidates({
          title: `${res.results.length} parcels match “${q}”`,
          hint: "Choose one. Their outlines are numbered on the map.",
          results: res.results,
        });
      }
    },
    [selectParcel, showCandidates],
  );

  const searchSeq = useRef(0);
  const runSearch = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (q.length < 2) {
        setNotice("Type at least 2 characters to search.");
        return;
      }
      const seq = ++searchSeq.current;
      setSearching(true);
      setNotice(null);
      try {
        const res = await searchParcels(q);
        if (seq !== searchSeq.current) return;
        applySearchResults(q, res);
      } catch (error) {
        if (seq !== searchSeq.current) return;
        setNotice(error instanceof ApiError ? error.message : "Search is not available right now.");
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    },
    [applySearchResults],
  );

  const handleMapClick = useCallback(
    async (lat: number, lng: number, zoom: number) => {
      if (zoom < CLICK_MIN_ZOOM) {
        setNotice("Zoom in to street level to click a parcel, or use the search box.");
        return;
      }
      try {
        const res = await parcelsAt(lat, lng);
        if (res.results.length === 1) selectParcel(res.results[0]!.id);
        else if (res.results.length > 1) {
          showCandidates({
            title: `${res.results.length} parcels at this spot`,
            hint: "Several parcels share this footprint, for example stacked condominium units. Choose one.",
            results: res.results,
          });
        } else {
          setNotice(SURFACE_MESSAGE[res.surface === "parcel" ? "nothing" : res.surface]);
        }
      } catch (error) {
        setNotice(
          error instanceof ApiError ? error.message : "That lookup is not available right now.",
        );
      }
    },
    [selectParcel, showCandidates],
  );

  // A shared link may carry a search (?q=) to run on arrival.
  const ranInitialSearch = useRef(false);
  useEffect(() => {
    if (ranInitialSearch.current || !search.q) return;
    ranInitialSearch.current = true;
    void runSearch(search.q);
  }, [search.q, runSearch]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 9000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const selected = useMemo(
    () =>
      detail
        ? {
            id: detail.id,
            geometry: detail.geometry,
            label: detail.address ?? detail.parcelNumber ?? "Parcel",
          }
        : null,
    [detail],
  );
  const candidateParcels = useMemo(
    () =>
      candidates
        ? candidates.results.map((r, i) => ({ id: r.id, n: i + 1, geometry: r.geometry }))
        : [],
    [candidates],
  );

  const reportUnavailable = useCallback(
    () =>
      setNotice(
        "Reports aren't available for real parcels yet: they need zoning, which isn't part of the parcel check. Floodplain and zoning are shown on the map as display-only layers.",
      ),
    [],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-screen lg:flex-row lg:overflow-hidden">
      <div className="relative h-[60vh] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
        <MapCanvas
          femaTiles={layers.fema}
          geoLayers={display.geoLayers}
          overlays={overlays}
          parcelOutlines={outlines.outlines}
          onViewportChange={setViewport}
          selected={selected}
          candidates={candidateParcels}
          highlightId={highlightId}
          onMapClick={handleMapClick}
          onSelectCandidate={selectParcel}
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
          layers={layers}
          toggle={toggleLayer}
          status={layerStatus}
          className="top-[4.25rem] sm:top-4"
        />

        <MapLegend layers={layers} className="absolute right-3 bottom-36 z-10" />

        {/* Search and notices, top centre */}
        <div className="absolute top-4 right-28 left-4 z-20 flex max-w-xl flex-col gap-2 sm:left-[20.5rem]">
          <ParcelSearchBox onSearch={runSearch} busy={searching} initialValue={search.q ?? ""} />
          {notice && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-paper px-3 py-2 text-sm leading-snug text-foreground shadow-card"
            >
              <span>{notice}</span>
              <button
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          )}
        </div>

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

        <div className="absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-14.5rem)] flex-col items-start gap-1.5 sm:left-[20.5rem] sm:max-w-none">
          <div
            className="rule-label rounded-md bg-paper/90 px-2 py-1 backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            {!outlines.streetLevel
              ? "Zoom in to street level to see parcel outlines"
              : outlines.error
                ? "Parcel outlines could not be loaded"
                : outlines.outlines?.truncated
                  ? `${outlines.outlines.count.toLocaleString()} nearest parcels shown · zoom in for more`
                  : outlines.outlines
                    ? `${outlines.outlines.count.toLocaleString()} parcels in view${outlines.loading ? " · updating…" : ""}`
                    : "Loading parcel outlines…"}
          </div>
          <div className="rule-label rounded-md bg-paper/85 px-2 py-1 backdrop-blur-sm">
            Tulsa County parcels · Assessor data via INCOG
          </div>
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col border-l border-border bg-paper lg:h-screen lg:w-[400px]">
        <div className={`min-h-0 overflow-y-auto ${chatOpen ? "flex-[0_0_42%]" : "flex-1"}`}>
          {sampleParcel && <SampleParcelNotice address={sampleParcel.address} />}
          {candidates ? (
            <CandidateList
              title={candidates.title}
              hint={candidates.hint}
              results={candidates.results}
              highlightId={highlightId}
              onHighlight={setHighlightId}
              onSelect={selectParcel}
            />
          ) : selectedId === null ? (
            <EmptyPanel />
          ) : detail ? (
            <ParcelPanel
              key={detail.id}
              detail={detail}
              onGenerateReport={reportUnavailable}
              onClear={clearSelection}
            />
          ) : detailQuery.isError ? (
            <div className="p-8">
              <p className="rule-label">Could not load this parcel</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {detailQuery.error instanceof ApiError
                  ? detailQuery.error.message
                  : "The parcel service did not respond."}
              </p>
              <button
                onClick={() => void detailQuery.refetch()}
                className="mt-4 h-10 rounded-md border border-input bg-paper px-[18px] text-[15px] font-medium hover:border-accent hover:text-accent"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="p-8" role="status">
              <p className="rule-label">Loading parcel…</p>
            </div>
          )}
        </div>
        {chatOpen ? (
          <div className="fixed bottom-3 right-3 z-40 h-[min(70vh,36rem)] w-[min(400px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border shadow-popover lg:rounded-none lg:static lg:h-auto lg:min-h-0 lg:w-auto lg:flex-1 lg:border-0 lg:shadow-none">
            <ParcelChat
              parcel={detail ? { address: detail.address ?? "the selected parcel" } : null}
              onSearchResults={applySearchResults}
              onClose={() => setChatOpen(false)}
              onAddTask={(action) => addTask(createTaskFromAction(action))}
            />
          </div>
        ) : null}
      </aside>

      {/* Reports exist only for the dashboard's sample parcels (they need zoning). */}
      <ReportPreview
        parcel={sampleParcel}
        tasks={tasks}
        orgType={null}
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
  femaTiles,
  geoLayers,
  overlays,
  parcelOutlines,
  onViewportChange,
  selected,
  candidates,
  highlightId,
  onMapClick,
  onSelectCandidate,
}: {
  femaTiles: boolean;
  geoLayers: GeoLayerRender[];
  overlays: OverlayRender[];
  parcelOutlines: OutlineCollection | null;
  onViewportChange: (v: Viewport) => void;
  selected: SelectedParcel | null;
  candidates: CandidateParcel[];
  highlightId: number | null;
  onMapClick: (lat: number, lng: number, zoom: number) => void;
  onSelectCandidate: (id: number) => void;
}) {
  return (
    // z-0 creates a stacking context so Leaflet's internal high z-indexes
    // (tiles 200, panes 400+, controls 1000) stay inside the map and cannot
    // paint over the sibling search bar, task button, or layer panel (z-20).
    <div className="absolute inset-0 z-0">
      <ClientOnly fallback={<div className="band-soft absolute inset-0" />}>
        <Suspense fallback={<div className="band-soft absolute inset-0" />}>
          <BaseMap
            femaFloodplain={femaTiles}
            geoLayers={geoLayers}
            selected={selected}
            candidates={candidates}
            highlightId={highlightId}
            onMapClick={onMapClick}
            onSelectCandidate={onSelectCandidate}
            parcelOutlines={parcelOutlines}
            overlays={overlays}
            onViewportChange={onViewportChange}
          />
        </Suspense>
      </ClientOnly>
    </div>
  );
}

/* ------------------------------- side panel ------------------------------ */

function EmptyPanel() {
  const sources = useSources();

  return (
    <div className="flex min-h-full flex-col px-6 py-8">
      <Link to="/" className="rule-label hover:text-accent">
        ← Collective Impact
      </Link>
      <p className="rule-label mt-8">Tulsa County parcels</p>
      <h1 className="mt-3 font-heading text-2xl leading-snug font-bold text-foreground">
        Search an address or click a parcel
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Type an address or a 14-digit parcel number in the search box, or zoom to street level and
        click a lot. The panel then shows which TIF district, census tract, Opportunity Zone, USDA
        area and city it sits in, checked against boundaries stored in our database.
      </p>

      <div className="mt-8 border-t border-border pt-6">
        <p className="rule-label">Data loaded</p>
        {sources.data ? (
          <ul className="mt-3 space-y-2.5">
            {sources.data.map((src) => (
              <li key={src.sourceKey} className="text-xs leading-relaxed text-muted-foreground">
                <span className="block text-sm text-foreground">{src.datasetName}</span>
                {src.recordCount.toLocaleString()} records
                {src.vintage ? ` · ${src.vintage}` : ""} · pulled {formatDate(src.pulledAt)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {sources.isError ? "The data service is not reachable." : "Loading…"}
          </p>
        )}
      </div>
    </div>
  );
}

function SampleParcelNotice({ address }: { address: string }) {
  return (
    <div className="border-b border-border bg-secondary px-6 py-4">
      <p className="rule-label">Sample parcel from the dashboard</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        “{address}” is a made-up record from the prototype dashboard, so there is nothing to draw on
        the real map. Search an address or click a parcel to see real data.
      </p>
    </div>
  );
}

function ParcelPanel({
  detail,
  onGenerateReport,
  onClear,
}: {
  detail: ParcelDetail;
  onGenerateReport: () => void;
  onClear: () => void;
}) {
  const address = detail.address ?? "No street address on record";
  const place = [detail.city, "OK", detail.zip].filter(Boolean).join(" ");

  return (
    <>
      <div className="flex min-h-full flex-col">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="rule-label hover:text-accent">
              ← Collective Impact
            </Link>
            <button onClick={onClear} className="rule-label hover:text-accent">
              Clear ✕
            </button>
          </div>
          <h1 className="mt-3 font-heading font-bold text-2xl leading-snug text-foreground">
            {address}
          </h1>
          <p className="text-sm text-muted-foreground">{place}</p>
        </div>

        <Section title="Where this parcel sits">
          <OverlayReadout detail={detail} />
        </Section>

        <Section title="Parcel facts">
          <dl className="divide-y divide-border border-y border-border">
            <Fact label="Address" value={address} />
            <Fact label="Parcel number" value={detail.parcelNumber ?? "—"} mono />
            {detail.accountNumber && <Fact label="Account" value={detail.accountNumber} mono />}
            <Fact
              label="Acreage"
              value={detail.acres !== null ? `${detail.acres.toFixed(2)} acres` : "—"}
            />
            <Fact label="Land use" value={detail.landUse ?? "—"} />
            {detail.yearBuilt && <Fact label="Year built" value={String(detail.yearBuilt)} mono />}
            <Fact
              label="Assessed value"
              value={detail.assessedTotal !== null ? currency.format(detail.assessedTotal) : "—"}
              mono
            />
            {detail.landValue !== null && detail.improvementValue !== null && (
              <Fact
                label="Of which"
                value={`land ${currency.format(detail.landValue)} · improvements ${currency.format(detail.improvementValue)}`}
              />
            )}
          </dl>
          {detail.legalDescription && (
            <details className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <summary className="cursor-pointer rule-label">Legal description</summary>
              <p className="mt-2">{detail.legalDescription}</p>
            </details>
          )}
          <ParcelSourceLine detail={detail} />
        </Section>

        <Section title="References">
          <SourceReferences />
        </Section>

        <div className="mt-auto border-t border-border bg-paper-deep p-6">
          <button
            onClick={onGenerateReport}
            className="w-full rounded-md border border-input bg-paper px-4 py-3.5 text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Generate report for this parcel
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Reports aren't available for real parcels yet.
          </p>
        </div>
      </div>
    </>
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
