import { NextResponse, type NextRequest } from "next/server";
import redirectsData from "./scripts/crawl-output/redirects.json" with { type: "json" };
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// ----------------------------------------------------------------------------
// Legacy URL redirects (built at content-build time)
// ----------------------------------------------------------------------------
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
    table.set(key, { destination: r.destination, status: r.permanent ? 308 : 307 });
  }
}

// ----------------------------------------------------------------------------
// Admin gate: /admin/* and /api/admin/* require a valid session cookie.
// /admin/login and /admin/login/* are the only exceptions.
// ----------------------------------------------------------------------------
const ADMIN_PUBLIC_PATHS = new Set<string>(["/admin/login"]);

function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/");
}
function isAdminPublic(path: string): boolean {
  if (ADMIN_PUBLIC_PATHS.has(path)) return true;
  // login sub-paths (e.g. server action posts) also public
  if (path.startsWith("/admin/login/")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1) Admin auth gate — runs first, before any redirect table lookup.
  if (isAdminPath(path) && !isAdminPublic(path)) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session) {
      if (path.startsWith("/api/admin/")) {
        return NextResponse.json(
          { error: "UNAUTHENTICATED" },
          { status: 401 }
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      if (path !== "/admin") url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    // Authed — let the request through, no legacy redirect processing.
    const res = NextResponse.next();
    res.headers.set("x-robots-tag", "noindex, nofollow");
    return res;
  }

  // 2) Legacy Hebrew/URL redirect table for the public site.
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
  return res;
}

// Skip static files and Next.js internals. Admin paths ARE matched.
export const config = {
  matcher: [
    "/((?!_next/|pdfs/|images/|favicon.ico|robots.txt|sitemap.xml|icon.png|apple-icon.png).*)",
  ],
};
