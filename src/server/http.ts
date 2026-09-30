/** Small helpers for the JSON API routes. */

export function json(data: unknown, init: { status?: number; cache?: string } = {}): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": init.cache ?? "no-store",
    },
  });
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
