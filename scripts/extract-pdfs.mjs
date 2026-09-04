// Fetch every page discovered by crawl-site.mjs, extract Wix PDF ids from
// inline script blocks (Wix leaks doc ids in serialized page JSON even when
// the page uses password-gated components). Match ids to their surrounding
// human-readable labels.
//
// Output: scripts/crawl-output/pdfs.json
//   [{ pageUrl, pageTitle, files: [{ id, ext, url, size?, label? }], solutionLinks: [{href, text}] }]

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'crawl-output');
const PAGES_FILE = join(OUT_DIR, 'pages.json');
const OUT_FILE = join(OUT_DIR, 'pdfs.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const pages = JSON.parse(readFileSync(PAGES_FILE, 'utf8'));
console.log(`Loaded ${pages.length} pages from previous crawl.`);

// Wix file-ID pattern in this site's storage: c511a2_<32hex>[_extra]?.<ext>
const FILE_RE = /c511a2_[a-f0-9]+(?:_[A-Za-z0-9\-.\%]+)?\.(?:pdf|docx?|xlsx?|zip|pptx?)/gi;

// Names that appear inside file-upload-viewer components, wrapped in serialized JSON
// "fileName":"מבחן 2024" etc.
const FILENAME_JSON_RE = /"(?:fileName|name|displayName|title)"\s*:\s*"([^"\\]{2,120})"/g;
// Even better: "fileName":"...","fileType":"pdf","docId":"..."
const DOC_RECORD_RE = /"docId"\s*:\s*"([a-f0-9_]+)"[^}]{0,200}?"name"\s*:\s*"([^"\\]+)"/g;

async function fetchWithRetry(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'he,en;q=0.8' },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function inspectHead(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    const size = Number(r.headers.get('content-length') || 0);
    return { ok: r.ok, status: r.status, size };
  } catch {
    return { ok: false, status: 0, size: 0 };
  }
}

function candidateUrls(id) {
  return [
    `https://docs.wixstatic.com/ugd/${id}`,
    `https://www-e-tv-site.filesusr.com/ugd/${id}`,
    `https://static.wixstatic.com/ugd/${id}`,
  ];
}

async function resolveUrl(id) {
  for (const u of candidateUrls(id)) {
    const info = await inspectHead(u);
    if (info.ok) return { url: u, size: info.size };
  }
  return null;
}

const results = [];
let pageIdx = 0;
for (const page of pages) {
  pageIdx++;
  const t0 = Date.now();
  let html;
  try {
    html = await fetchWithRetry(page.url);
  } catch (e) {
    console.warn(`[${pageIdx}] SKIP fetch failed: ${page.url} - ${e.message}`);
    continue;
  }
  const ids = [...new Set(html.match(FILE_RE) || [])];
  if (ids.length === 0) {
    // No files on this page; still record it to keep pageIdx meaningful
    results.push({ url: page.url, title: page.title, files: [], names: [] });
    console.log(`[${pageIdx}/${pages.length}] 0 files  ${page.url.slice(0, 80)}`);
    continue;
  }

  // Try to pair each id with a plausible label from surrounding JSON.
  // Wix embeds { "docId":"<id>", "name":"מבחן 2024" } records in the page data.
  const docRecords = [];
  for (const m of html.matchAll(DOC_RECORD_RE)) {
    docRecords.push({ docId: m[1], name: m[2] });
  }
  // Fallback: collect all fileName/name candidates in order they appear
  const rawNames = [...html.matchAll(FILENAME_JSON_RE)].map((m) => m[1]);

  // Resolve each ID to a working URL (with size)
  const files = [];
  for (const id of ids) {
    const rec = docRecords.find((r) => id.startsWith(r.docId) || id.includes(r.docId));
    const resolved = await resolveUrl(id);
    files.push({
      id,
      label: rec?.name || null,
      url: resolved?.url || null,
      sizeBytes: resolved?.size || null,
    });
  }
  const dt = Date.now() - t0;
  results.push({
    url: page.url,
    title: page.title,
    depth: page.depth,
    h1: page.h1,
    h2: page.h2,
    linkPairs: page.linkPairs || [],
    files,
    rawNamesSample: rawNames.slice(0, 40),
  });
  console.log(`[${pageIdx}/${pages.length}] ${files.length} files (${dt}ms)  ${page.url.slice(0, 80)}`);

  // persist every 10 pages
  if (pageIdx % 10 === 0) writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8');
}

writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8');
const totalFiles = results.reduce((n, r) => n + r.files.length, 0);
console.log(`\nDONE. Wrote ${results.length} pages, ${totalFiles} total file references.`);
