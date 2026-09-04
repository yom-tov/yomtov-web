import { NextResponse, type NextRequest } from "next/server";
import redirectsData from "./scripts/crawl-output/redirects.json" with { type: "json" };

// Middleware handles the redirects Next's config `redirects()` can't reliably
// match: paths containing non-ASCII characters (Hebrew) and paths whose
// encoded/decoded shapes differ. We build a lookup keyed by the DECODED
// pathname (what `req.nextUrl.pathname` gives us).
type Entry = { source: string; destination: string; permanent: boolean };

const table: Map<string, { destination: string; status: number }> = new Map();
for (const r of redirectsData as Entry[]) {
  let key = r.source;
  try {
    key = decodeURIComponent(r.source);
  } catch {
    // leave as-is
  }
  if (!key.startsWith("/")) key = "/" + key;
  if (!table.has(key)) {
    table.set(key, {
      destination: r.destination,
      status: r.permanent ? 308 : 307,
    });
  }
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {}
  const hit = table.get(decoded) || table.get(path);
  const res = hit
    ? NextResponse.redirect(
        (() => {
          const u = req.nextUrl.clone();
          u.pathname = hit.destination;
          return u;
        })(),
        hit.status
      )
    : NextResponse.next();
  res.headers.set("x-yomtov-mw", hit ? "hit" : "miss");
  res.headers.set("x-yomtov-mw-path", path);
  res.headers.set("x-yomtov-mw-decoded", decoded);
  return res;
}

// Skip static files, API, and Next.js internals.
export const config = {
  matcher: ["/((?!_next/|api/|pdfs/|images/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
