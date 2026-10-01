/**
 * Minimal headless-Chrome driver over the DevTools protocol, for `npm run verify` and
 * `npm run bench`. No dependencies: Node's global fetch and WebSocket, and a Chrome install.
 *
 * Chrome is found at CHROME_PATH, or the usual macOS / Linux locations.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

export function findChrome(): string | null {
  const fromEnv = process.env["CHROME_PATH"];
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : null;
  return CANDIDATES.find((p) => existsSync(p)) ?? null;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface Browser {
  /** Console errors and uncaught exceptions seen since launch (or the last clear). */
  consoleErrors: string[];
  goto(url: string): Promise<void>;
  /** Evaluate an expression in the page; promises are awaited. */
  eval<T = unknown>(expression: string): Promise<T>;
  /** Poll until the expression is truthy. */
  waitFor(expression: string, timeoutMs?: number): Promise<void>;
  sleep(ms: number): Promise<void>;
  close(): Promise<void>;
}

export async function launchBrowser(
  opts: { width?: number; height?: number } = {},
): Promise<Browser> {
  const chrome = findChrome();
  if (!chrome) {
    throw new Error(
      "Chrome not found. Install Google Chrome or set CHROME_PATH to its executable.",
    );
  }
  const width = opts.width ?? 1440;
  const height = opts.height ?? 900;
  const profile = await mkdtemp(path.join(tmpdir(), "ci-chrome-"));

  const proc: ChildProcess = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--no-first-run",
      // Port 0: Chrome picks a free one and writes it to DevToolsActivePort in the profile.
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      "about:blank",
    ],
    { stdio: "ignore", detached: true },
  );

  let port = 0;
  for (let i = 0; i < 80 && !port; i++) {
    try {
      const text = await readFile(path.join(profile, "DevToolsActivePort"), "utf8");
      port = Number(text.split("\n")[0]);
    } catch {
      await sleep(250);
    }
  }
  if (!port) throw new Error("Chrome did not start (no DevToolsActivePort).");

  let targets: { type: string; webSocketDebuggerUrl: string }[] = [];
  for (let i = 0; i < 40; i++) {
    try {
      targets = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()) as typeof targets;
      if (targets.some((t) => t.type === "page")) break;
    } catch {
      /* not ready yet */
    }
    await sleep(250);
  }
  const page = targets.find((t) => t.type === "page");
  if (!page) throw new Error("Chrome started but exposed no page.");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("Could not connect to Chrome's DevTools socket."));
  });

  let nextId = 0;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  const consoleErrors: string[] = [];

  ws.onmessage = (ev) => {
    const msg = JSON.parse(String(ev.data)) as {
      id?: number;
      result?: unknown;
      error?: unknown;
      method?: string;
      params?: Record<string, any>;
    };
    if (msg.id !== undefined && pending.has(msg.id)) {
      const p = pending.get(msg.id)!;
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params?.["type"] === "error") {
      consoleErrors.push(
        (msg.params["args"] as { value?: unknown; description?: string }[])
          .map((a) => String(a.value ?? a.description))
          .join(" "),
      );
    } else if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params?.["exceptionDetails"] as {
        text: string;
        exception?: { description?: string };
      };
      consoleErrors.push(`EXCEPTION ${d.exception?.description ?? d.text}`);
    }
  };

  const send = <T = unknown>(method: string, params: Record<string, unknown> = {}) =>
    new Promise<T>((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const api: Browser = {
    consoleErrors,
    async goto(url) {
      await send("Page.navigate", { url });
      await sleep(800);
    },
    async eval<T>(expression: string) {
      const r = await send<{
        result: { value: T };
        exceptionDetails?: { text: string; exception?: { description?: string } };
      }>("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails)
        throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    async waitFor(expression, timeoutMs = 20000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        try {
          if (await api.eval(expression)) return;
        } catch {
          /* page still loading */
        }
        await sleep(250);
      }
      throw new Error(`Timed out waiting for: ${expression}`);
    },
    sleep,
    async close() {
      try {
        await send("Browser.close");
      } catch {
        /* already gone */
      }
      try {
        if (proc.pid) process.kill(-proc.pid);
      } catch {
        /* already gone */
      }
      proc.unref();
      await rm(profile, { recursive: true, force: true }).catch(() => undefined);
    },
  };
  return api;
}
