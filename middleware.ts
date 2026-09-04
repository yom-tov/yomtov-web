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
  const hit = table.get(path);
  if (!hit) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = hit.destination;
  return NextResponse.redirect(url, hit.status);
}

// Skip static files, API, and Next.js internals.
export const config = {
  matcher: ["/((?!_next/|api/|pdfs/|images/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
