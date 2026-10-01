/**
 * End-to-end checks against the running app: known parcels must fall in exactly the
 * overlays the source data says they do. Needs the database loaded and the app running
 * (npm run db:up && npm run dev).
 *
 *   npm run verify                                   # http://localhost:8080
 *   VERIFY_BASE_URL=http://localhost:8090 npm run verify
 *
 * The last group drives headless Chrome (needs Google Chrome; VERIFY_SKIP_BROWSER=1 skips it) and
 * checks that every map layer draws when switched on and is removed when switched off.
 *
 * Exits non-zero if any check fails.
 */
import assert from "node:assert/strict";
import { overlayLines } from "../src/lib/overlay-text.ts";
import { DISPLAY_LAYERS, OVERLAYS } from "../src/lib/overlays-meta.ts";
import { findChrome, launchBrowser } from "./lib/cdp.ts";
import type {
  OverlayAnswer,
  OverlayKind,
  ParcelDetail,
  SearchResult,
  AtResult,
} from "../src/lib/parcel-types.ts";

const BASE = (process.env["VERIFY_BASE_URL"] ?? "http://localhost:8080").replace(/\/$/, "");

async function api<T>(path: string): Promise<{ status: number; body: T }> {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: (await res.json()) as T };
}

async function search(q: string): Promise<SearchResult> {
  const { status, body } = await api<SearchResult>(
    `/api/parcels/search?q=${encodeURIComponent(q)}`,
  );
  assert.equal(status, 200, `search "${q}" returned HTTP ${status}`);
  return body;
}

/** The parcel whose situs address matches exactly (and, when given, whose parcel number does). */
async function detailFor(
  address: string,
  query: string,
  parcelNumber?: string,
): Promise<ParcelDetail> {
  const { results } = await search(query);
  const hit = results.find(
    (r) => r.address === address && (parcelNumber === undefined || r.parcelNumber === parcelNumber),
  );
  assert.ok(
    hit,
    `no search result for ${address}${parcelNumber ? ` (${parcelNumber})` : ""} among ${results.length}`,
  );
  const { status, body } = await api<ParcelDetail>(`/api/parcels/${hit.id}`);
  assert.equal(status, 200);
  return body;
}

function rows(d: ParcelDetail, kind: OverlayKind): OverlayAnswer[] {
  const r = d.overlays.filter((o) => o.kind === kind);
  assert.ok(r.length > 0, `${kind}: the API returned no row (it must always return one)`);
  return r;
}
const status = (d: ParcelDetail, kind: OverlayKind) => rows(d, kind).map((r) => r.status);
function inside(d: ParcelDetail, kind: OverlayKind, code?: string) {
  const hit = rows(d, kind).find(
    (r) => r.status === "inside" && (code === undefined || r.code === code),
  );
  assert.ok(
    hit,
    `${kind}: expected inside${code ? ` ${code}` : ""}, got ${JSON.stringify(rows(d, kind).map((r) => [r.status, r.code]))}`,
  );
}
function outside(d: ParcelDetail, kind: OverlayKind) {
  assert.deepEqual(status(d, kind), ["outside"], `${kind}: expected outside`);
}
function partly(d: ParcelDetail, kind: OverlayKind) {
  assert.ok(
    status(d, kind).includes("partial"),
    `${kind}: expected partial, got ${JSON.stringify(status(d, kind))}`,
  );
}

const checks: { name: string; run: () => Promise<void> }[] = [
  {
    name: "112 S ELGIN AV E → TIF T13, Opportunity Zone; not QCT, not DDA",
    run: async () => {
      const d = await detailFor("112 S ELGIN AV E", "112 S Elgin Ave");
      inside(d, "tif", "T13");
      inside(d, "oz");
      outside(d, "qct");
      outside(d, "dda");
    },
  },
  {
    name: "320 N BOSTON AV E → DDA, TIF T10, Opportunity Zone",
    run: async () => {
      const d = await detailFor("320 N BOSTON AV E", "320 N Boston Ave");
      inside(d, "dda");
      inside(d, "tif", "T10");
      inside(d, "oz");
    },
  },
  {
    name: "18919 W WEKIWA RD S → none of TIF/QCT/DDA/OZ; USDA rural-eligible",
    run: async () => {
      const d = await detailFor("18919 W WEKIWA RD S", "18919 W Wekiwa Rd");
      for (const kind of ["tif", "qct", "dda", "oz"] as const) outside(d, kind);
      inside(d, "usda_rural");
    },
  },
  {
    name: "18919 W WEKIWA RD S readout says it is not in a TIF district, QCT, DDA or OZ",
    run: async () => {
      const d = await detailFor("18919 W WEKIWA RD S", "18919 W Wekiwa Rd");
      const text = overlayLines(d.overlays).map((l) => l.text);
      for (const sentence of [
        "Not in a TIF district.",
        "Not in a Qualified Census Tract.",
        "Not in a Difficult Development Area.",
        "Not in an Opportunity Zone.",
        "In a USDA rural-eligible area (outside USDA's ineligible areas).",
      ]) {
        assert.ok(
          text.includes(sentence),
          `readout is missing "${sentence}"; got ${JSON.stringify(text)}`,
        );
      }
      // It is rural-eligible, so it is in one designation and the summary says which.
      assert.equal(d.designations.message, "This parcel is in: USDA rural-eligible area.");
    },
  },
  {
    name: "305 E IMPERIAL ST S (Broken Arrow) → the plain 'in none of the five' message",
    run: async () => {
      const d = await detailFor("305 E IMPERIAL ST S", "305 E Imperial St", "80177740263420");
      assert.equal(d.designations.inAny, false);
      assert.equal(
        d.designations.message,
        "This parcel is not in a TIF district, Qualified Census Tract, Difficult Development Area, Opportunity Zone or USDA rural-eligible area.",
      );
    },
  },
  {
    name: "2645 E 5 ST S → search returns 7 parcels",
    run: async () => {
      const { results } = await search("2645 E 5th St");
      assert.equal(results.length, 7, `expected 7 parcels, got ${results.length}`);
    },
  },
  {
    name: "2645 E 5 ST S (09175930504070) → QCT partly, Opportunity Zone partly",
    run: async () => {
      const d = await detailFor("2645 E 5 ST S", "2645 E 5th St", "09175930504070");
      partly(d, "qct");
      partly(d, "oz");
    },
  },
  {
    name: "click on a street → surface right_of_way, no parcel",
    run: async () => {
      // A right-of-way parcel near N Elgin Ave and E Archer St, downtown Tulsa.
      const { status: s, body } = await api<AtResult>(
        "/api/parcels/at?lat=36.157462&lng=-95.984740",
      );
      assert.equal(s, 200);
      assert.equal(body.results.length, 0);
      assert.equal(body.surface, "right_of_way");
    },
  },
  {
    name: "point outside the county (Oklahoma City) → no parcel",
    run: async () => {
      const { body } = await api<AtResult>("/api/parcels/at?lat=35.4676&lng=-97.5164");
      assert.equal(body.results.length, 0);
      assert.equal(body.surface, "nothing");
    },
  },
  // Cheap extras that guard the API's own promises.
  {
    name: "outlines refused below zoom 16",
    run: async () => {
      const { status: s } = await api("/api/parcels/outlines?bbox=-96,36.15,-95.98,36.16&zoom=15");
      assert.equal(s, 400);
    },
  },
  {
    name: "outlines at zoom 17 stay under the cap",
    run: async () => {
      const { status: s, body } = await api<{ count: number; cap: number }>(
        "/api/parcels/outlines?bbox=-95.9995,36.1515,-95.9855,36.1555&zoom=17",
      );
      assert.equal(s, 200);
      assert.ok(body.count > 0 && body.count <= body.cap);
    },
  },
  {
    name: "unknown address and unknown parcel number → no results",
    run: async () => {
      assert.equal((await search("9999 Nowhere Blvd")).results.length, 0);
      assert.equal((await search("99999999999999")).results.length, 0);
    },
  },
  {
    name: "all eight sources are loaded with a pull date",
    run: async () => {
      const { body } = await api<{ sources: { sourceKey: string; pulledAt: string }[] }>(
        "/api/sources",
      );
      const keys = body.sources.map((s) => s.sourceKey).sort();
      assert.deepEqual(keys, [
        "cdfi_oz",
        "hud_dda",
        "hud_qct",
        "incog_city_limits",
        "incog_parcels",
        "incog_tif",
        "tulsa_council_districts",
        "usda_rural",
      ]);
      assert.ok(body.sources.every((s) => !Number.isNaN(Date.parse(s.pulledAt))));
    },
  },
];

console.log(`verify against ${BASE}\n`);
let passed = 0;
let failed = 0;
async function run(name: string, fn: () => Promise<void | string>) {
  try {
    const detail = await fn();
    passed++;
    console.log(`PASS  ${name}${detail ? ` (${detail})` : ""}`);
  } catch (error) {
    failed++;
    console.log(`FAIL  ${name}\n      ${(error as Error).message.split("\n")[0]}`);
  }
}

for (const check of checks) await run(check.name, check.run);

// ---------------------------------------------------------------------------------------------
// Browser: every layer toggles on (drawn) and off (removed). Headless Chrome.
// ---------------------------------------------------------------------------------------------
if (process.env["VERIFY_SKIP_BROWSER"]) {
  console.log("SKIP  browser layer-toggle checks (VERIFY_SKIP_BROWSER is set)");
} else if (!findChrome()) {
  failed++;
  console.log(
    "FAIL  browser layer-toggle checks\n      Chrome not found. Install Google Chrome, set CHROME_PATH, or set VERIFY_SKIP_BROWSER=1.",
  );
} else {
  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser({ width: 1440, height: 900 });
    // layers=none: every layer starts off, so each count below starts at zero.
    await browser.goto(`${BASE}/map?layers=none`);
    await browser.waitFor(
      "!!document.querySelector('.leaflet-container') && document.querySelectorAll('label input[type=checkbox]').length >= 10",
      60000,
    );
    await browser.sleep(1500);

    const toggle = (label: string) =>
      browser!.eval(
        `(() => { const l = [...document.querySelectorAll('label')].find((x) => x.innerText.startsWith(${JSON.stringify(label)})); if (!l) throw new Error('no layer row: ${label}'); l.querySelector('input').click(); })()`,
      );

    // How many shapes of this layer are on the map right now.
    const counter = {
      // Database overlays are drawn in their own pane; the City's layers in Leaflet's default pane.
      overlays: "document.querySelector('.leaflet-overlays-pane').querySelectorAll('path').length",
      gis: "document.querySelector('.leaflet-overlay-pane').querySelectorAll('path').length",
      tiles: "document.querySelectorAll('img.leaflet-tile[src*=\"fema.gov\"]').length",
    };

    for (const layer of [...OVERLAYS, ...DISPLAY_LAYERS]) {
      const isOverlay = "group" in layer;
      const where = isOverlay ? "overlays" : layer.tiles ? "tiles" : "gis";
      await run(`layer toggles: ${layer.label}`, async () => {
        const count = counter[where];
        assert.equal(await browser!.eval(count), 0, "should start with nothing drawn");

        // Database overlays must draw exactly the features the API serves.
        const expected = isOverlay
          ? (await api<{ features: unknown[] }>(`/api/overlays/${layer.key}`)).body.features.length
          : null;

        await toggle(layer.label);
        await browser!.waitFor(
          expected === null ? `${count} > 0` : `${count} === ${expected}`,
          90000,
        );
        const drawn = await browser!.eval<number>(count);

        await toggle(layer.label);
        await browser!.waitFor(`${count} === 0`, 15000);
        return `drew ${drawn} ${where === "tiles" ? "map tiles" : "shapes"}, then removed them`;
      });
    }

    await run("no console errors while toggling layers", async () => {
      assert.deepEqual(browser!.consoleErrors, []);
    });
  } catch (error) {
    failed++;
    console.log(
      `FAIL  browser layer-toggle checks\n      ${(error as Error).message.split("\n")[0]}`,
    );
  } finally {
    await browser?.close();
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
