/**
 * End-to-end timing in headless Chrome: how long from a search (or a map click) until the
 * parcel readout is on screen, measured inside the page. Needs the app and database running
 * and Google Chrome installed.
 *
 *   npm run bench                                    # http://localhost:8080
 *   BENCH_BASE_URL=http://localhost:8090 npm run bench
 *
 * Runs 10 searches (addresses with exactly one matching parcel) and 10 clicks on neighbouring
 * downtown parcels, and prints average, median, fastest and slowest. Exits non-zero if fewer
 * than 10 of either finish.
 *
 * Dev servers are slower than a production build (npm run build, then node .output/server/index.mjs).
 */
import { launchBrowser } from "./lib/cdp.ts";

const BASE = (process.env["BENCH_BASE_URL"] ?? "http://localhost:8080").replace(/\/$/, "");
const WANT = 10;

/** Addresses that each match exactly one parcel; spread across Tulsa County. Checked live. */
const ADDRESS_POOL = [
  "1039 E PINE ST N", "1343 S GARY AV E", "2529 N PEORIA AV E", "3242 E 11 ST S", "12635 E 34 ST S",
  "2610 E NEWTON ST N", "6120 S IRVINGTON AV E", "6959 E 21 ST S", "8687 E 105 CT S", "26303 W 55 ST S",
  "4608 S 185 AV E", "4309 S DOGWOOD AV W", "2406 S 123 AV E", "1124 N MINGO RD E", "9635 E 26 PL S",
  "9113 N 144 AV E", "6956 E 62 ST S", "16925 S 85 AV E", "838 MILLWOOD RD", "7401 S 70 CT E",
  "600 N FRANKLIN AV W", "406 W 11 ST S", "6107 S 116 AV E", "7425 E 159 PL S", "12428 E 15 ST S",
  "12229 S 65 PL E", "2809 S 136 AV E", "8311 N 99 AV E", "2915 W CANTON PL S", "9567 S COLLEGE CT E",
]; // prettier-ignore

type Geometry = { coordinates: unknown };
type Summary = { id: number; address: string | null };

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} returned HTTP ${res.status}`);
  return (await res.json()) as T;
}

function bboxCenter(g: Geometry): { lng: number; lat: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  (function walk(c: unknown) {
    if (Array.isArray(c) && typeof c[0] === "number") {
      xs.push(c[0] as number);
      ys.push(c[1] as number);
    } else if (Array.isArray(c)) c.forEach(walk);
  })(g.coordinates);
  return {
    lng: (Math.min(...xs) + Math.max(...xs)) / 2,
    lat: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

function stats(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return {
    n: s.length,
    avg: s.reduce((a, b) => a + b, 0) / (s.length || 1),
    median: s[Math.floor(s.length / 2)] ?? NaN,
    fastest: s[0] ?? NaN,
    slowest: s[s.length - 1] ?? NaN,
  };
}
const fmt = (xs: number[]) => {
  const o = stats(xs);
  return o.n === 0
    ? "n/a"
    : `avg ${o.avg.toFixed(0)} ms | median ${o.median.toFixed(0)} | fastest ${o.fastest.toFixed(0)} | slowest ${o.slowest.toFixed(0)}  (n=${o.n})`;
};

/** Page-side helpers: resolve with ms elapsed when the readout for `expected` is on screen. */
const PAGE_HELPERS = `
  window.__waitReadout = (expected, t0, timeout) => new Promise((resolve) => {
    const ok = () => {
      const h = document.querySelector('aside h1');
      return h && h.textContent.trim().toUpperCase() === expected &&
        document.querySelector('aside').textContent.includes('Where this parcel sits');
    };
    let done = false;
    const finish = (v) => { if (done) return; done = true; mo.disconnect(); clearTimeout(to); resolve(v); };
    const mo = new MutationObserver(() => { if (ok()) finish(performance.now() - t0); });
    const to = setTimeout(() => finish(-1), timeout);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    if (ok()) finish(performance.now() - t0);
  });
  window.__apiDone = (t0) => {
    const r = performance.getEntriesByType('resource').filter(
      (e) => e.name.includes('/api/parcels') && !e.name.includes('outlines') && e.startTime >= t0 - 5);
    return r.length ? Math.max(...r.map((e) => e.responseEnd)) - t0 : null;
  };
`;

// ---- choose the searches: single-match addresses, verified against the live API ----
const searches: string[] = [];
for (const address of ADDRESS_POOL) {
  if (searches.length === WANT) break;
  const r = await getJson<{ results: Summary[] }>(
    `/api/parcels/search?q=${encodeURIComponent(address)}`,
  );
  if (r.results.length === 1 && r.results[0]!.address === address) searches.push(address);
}
if (searches.length < WANT) {
  console.error(
    `Only ${searches.length} of the bench addresses match exactly one parcel; the data may have changed.`,
  );
  process.exit(1);
}

// ---- the click test starts at 112 S Elgin and clicks its neighbours ----
const start = (await getJson<{ results: Summary[] }>("/api/parcels/search?q=112%20S%20Elgin%20Ave"))
  .results[0];
if (!start) {
  console.error("112 S ELGIN AV E was not found: is the database loaded?");
  process.exit(1);
}
const outlines = await getJson<{
  features: { properties: { id: number; address: string | null }; geometry: Geometry }[];
}>("/api/parcels/outlines?bbox=-95.9899,36.1548,-95.9849,36.1582&zoom=18");
const seen = new Set<string>();
const neighbours = outlines.features
  .filter((f) => f.properties.address && f.properties.id !== start.id)
  .map((f) => ({ id: f.properties.id, address: f.properties.address!, ...bboxCenter(f.geometry) }))
  .filter((t) => {
    const k = `${t.lng.toFixed(5)},${t.lat.toFixed(5)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
const startShape = outlines.features.find((f) => f.properties.id === start.id);
if (!startShape) {
  console.error("The start parcel is not in the outline response.");
  process.exit(1);
}

const browser = await launchBrowser({ width: 1440, height: 900 });
const searchMs: number[] = [];
const searchApi: number[] = [];
const clickMs: number[] = [];
const clickApi: number[] = [];

try {
  await browser.goto(`${BASE}/map?parcel=${start.id}`);
  await browser.waitFor(
    "!!document.querySelector('.leaflet-container') && /Where this parcel sits/.test(document.querySelector('aside').textContent)",
    60000,
  );
  await browser.eval(PAGE_HELPERS);
  await browser.sleep(3000);

  // ---------------- searches ----------------
  for (const address of searches) {
    const r = await browser.eval<{ ms: number; api: number | null }>(`(async () => {
      const i = document.getElementById('parcel-search');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${JSON.stringify(address)});
      i.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 60));
      performance.clearResourceTimings();
      const t0 = performance.now();
      document.querySelector('form[role=search] button[type=submit]').click();
      const ms = await window.__waitReadout(${JSON.stringify(address)}, t0, 15000);
      return { ms, api: window.__apiDone(t0) };
    })()`);
    if (r.ms < 0) console.log(`  search timed out: ${address}`);
    else {
      searchMs.push(r.ms);
      if (r.api !== null) searchApi.push(r.api);
    }
    await browser.sleep(1600);
  }

  // ---------------- clicks ----------------
  await browser.goto(`${BASE}/map?parcel=${start.id}`);
  await browser.waitFor(
    "!!document.querySelector('.leaflet-selection-pane path') && /Where this parcel sits/.test(document.querySelector('aside').textContent)",
    60000,
  );
  await browser.eval(PAGE_HELPERS);
  await browser.sleep(3500);
  let current = { ...bboxCenter(startShape.geometry) };
  let attempts = 0;
  for (const t of neighbours) {
    if (clickMs.length === WANT || ++attempts > 40) break;
    const view = await browser.eval<{ x: number; y: number; z: number } | null>(`(() => {
      const p = document.querySelector('.leaflet-selection-pane path'); if (!p) return null;
      const r = p.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, z: Number(document.querySelector('.leaflet-container').dataset.zoom) };
    })()`);
    if (!view) {
      await browser.sleep(800);
      continue;
    }
    // Where on screen is the target? Mercator offset from the selected parcel, at this zoom.
    const x = view.x + (t.lng - current.lng) * ((256 * 2 ** view.z) / 360);
    const y = view.y - (merc(t.lat) - merc(current.lat)) * ((256 * 2 ** view.z) / (2 * Math.PI));
    if (x < 350 || x > 1000 || y < 100 || y > 800) continue; // clear of the panels and controls
    const r = await browser.eval<{ ms: number; api: number | null }>(`(async () => {
      const x = ${x}, y = ${y};
      const el = document.elementFromPoint(x, y);
      performance.clearResourceTimings();
      const t0 = performance.now();
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }));
      const ms = await window.__waitReadout(${JSON.stringify(t.address)}, t0, 15000);
      return { ms, api: window.__apiDone(t0) };
    })()`);
    if (r.ms < 0) {
      console.log(`  click: no readout for ${t.address} (skipped)`);
      await browser.sleep(1200);
      continue;
    }
    clickMs.push(r.ms);
    if (r.api !== null) clickApi.push(r.api);
    current = { lng: t.lng, lat: t.lat };
    await browser.sleep(2200); // let the map finish flying to the new parcel
  }

  console.log(`bench against ${BASE}\n`);
  console.log(`${searchMs.length} searches (submit -> readout rendered): ${fmt(searchMs)}`);
  console.log(`   of which waiting on the API (search + detail): ${fmt(searchApi)}`);
  console.log(`${clickMs.length} map clicks (click -> readout rendered): ${fmt(clickMs)}`);
  console.log(`   of which waiting on the API (at + detail): ${fmt(clickApi)}`);
  console.log(`\nconsole errors: ${browser.consoleErrors.length}`);
} finally {
  await browser.close();
}
process.exit(searchMs.length === WANT && clickMs.length === WANT ? 0 : 1);
