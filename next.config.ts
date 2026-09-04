import type { NextConfig } from "next";
import redirectsData from "./scripts/crawl-output/redirects.json" with { type: "json" };

type Redirect = { source: string; destination: string; permanent: boolean };

const nextConfig: NextConfig = {
  // Serve /pdfs/* with long cache; content is immutable per Wix ID naming.
  async headers() {
    return [
      {
        source: "/pdfs/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    // Legacy e-tv.site URL preservation: every crawled Hebrew URL redirects to
    // its new English counterpart with a 301 so external inbound links keep
    // working. Deduplicated by `source`.
    const seen = new Set<string>();
    const uniq: Redirect[] = [];
    for (const r of redirectsData as Redirect[]) {
      if (seen.has(r.source)) continue;
      seen.add(r.source);
      uniq.push(r);
    }
    return uniq;
  },
};

export default nextConfig;
