/** Small helpers for the JSON API routes. */
import { gzipSync } from "node:zlib";

/** Bodies smaller than this are not worth compressing. */
const GZIP_MIN_BYTES = 4096;

export function json(
  data: unknown,
  init: { status?: number; cache?: string; request?: Request } = {},
): Response {
  const body = JSON.stringify(data);
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": init.cache ?? "no-store",
    vary: "accept-encoding",
  };
  const acceptsGzip = /\bgzip\b/.test(init.request?.headers.get("accept-encoding") ?? "");
  if (acceptsGzip && body.length >= GZIP_MIN_BYTES) {
    headers["content-encoding"] = "gzip";
    return new Response(new Uint8Array(gzipSync(body)), { status: init.status ?? 200, headers });
  }
  return new Response(body, { status: init.status ?? 200, headers });
}

export function problem(status: number, message: string): Response {
  return json({ error: message }, { status });
}

/** Runs a handler; database or unexpected failures become a plain 503/500 rather than a stack trace. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    const code = (error as { code?: string }).code;
    if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "57P03") {
      return problem(503, "The parcel database is not reachable. Is it running? (npm run db:up)");
    }
    return problem(500, "Something went wrong answering this request.");
  }
}
