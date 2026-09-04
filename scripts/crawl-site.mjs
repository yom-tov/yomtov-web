// Crawl e-tv.site with a headless browser, extract every page + every asset link.
// Output: scripts/crawl-output/pages.json, assets.json.
//
// Strategy:
//   1. Start at homepage + the 6 top-level Hebrew URLs.
//   2. BFS on same-origin links (max depth 4).
//   3. On every page, wait for network idle, then dump: all <a> hrefs, all <img> srcs,
//      any Wix filesusr.com/ugd document links, and page title/h1/h2.
//   4. Persist incrementally after each page so partial progress survives a crash.

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'crawl-output');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const PAGES_FILE = join(OUT_DIR, 'pages.json');
const ASSETS_FILE = join(OUT_DIR, 'assets.json');
const VISITED_FILE = join(OUT_DIR, 'visited.json');

const START_URLS = [
  'https://www.e-tv.site/',
  'https://www.e-tv.site/חשמל',
  'https://www.e-tv.site/אלקטרוניקה-תקבילית',
  'https://www.e-tv.site/אלקטרוניקה-ספרתית',
  'https://www.e-tv.site/מעבדות',
  'https://www.e-tv.site/מחשבון',
  'https://www.e-tv.site/מבחנים',
];

const ORIGIN = 'https://www.e-tv.site';
const MAX_DEPTH = 4;
const CONCURRENCY = 3;

function loadJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}
function saveJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

const pages = loadJson(PAGES_FILE, []); // [{ url, depth, title, h1, h2, links, images, docs }]
const assets = loadJson(ASSETS_FILE, { images: [], documents: [] });
const visited = new Set(loadJson(VISITED_FILE, []));

function isInternal(url) {
  try {
    const u = new URL(url);
    return u.origin === ORIGIN || u.origin === 'https://e-tv.site';
  } catch {
    return false;
  }
}

function normalize(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    // decode Hebrew paths for cleaner keys
    return u.toString();
  } catch {
    return null;
  }
}

async function extractFromPage(page) {
  return await page.evaluate(() => {
    const links = new Set();
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (!href) continue;
      try {
        const abs = new URL(href, location.href).toString();
        links.add(abs);
      } catch {}
    }
    const images = new Set();
    for (const img of document.querySelectorAll('img')) {
      const src = img.currentSrc || img.getAttribute('src') || '';
      if (src) images.add(src);
    }
    // Wix stores document downloads under wixstatic media or filesusr.com/ugd
    const docs = new Set();
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href') || '';
      if (
        /\.pdf(\?|$)/i.test(href) ||
        /\.docx?(\?|$)/i.test(href) ||
        /\.xlsx?(\?|$)/i.test(href) ||
        /filesusr\.com\/ugd\//i.test(href) ||
        /wixstatic\.com\/media\//i.test(href) && /\.(pdf|docx?|xlsx?)/i.test(href)
      ) {
        try {
          const abs = new URL(href, location.href).toString();
          docs.add(abs);
        } catch {}
      }
    }
    // Also inspect any [data-*] with document URLs (Wix sometimes uses these)
    for (const el of document.querySelectorAll('[data-document-target], [data-document-url]')) {
      const v = el.getAttribute('data-document-target') || el.getAttribute('data-document-url') || '';
      if (v) docs.add(v);
    }

    // page metadata
    const h1s = [...document.querySelectorAll('h1')].map((h) => h.innerText.trim()).filter(Boolean);
    const h2s = [...document.querySelectorAll('h2')].map((h) => h.innerText.trim()).filter(Boolean);
    // Extract text of every link so we can pair labels with URLs
    const linkPairs = [];
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href') || '';
      const text = (a.innerText || '').trim().replace(/\s+/g, ' ');
      if (href) linkPairs.push({ href, text });
    }
    return {
      title: document.title,
      h1: h1s,
      h2: h2s,
      links: [...links],
      images: [...images],
      docs: [...docs],
      linkPairs,
    };
  });
}

async function collectFilesFromNetwork(page) {
  // Also observe network requests that look like document downloads
  const found = new Set();
  page.on('response', (res) => {
    const u = res.url();
    if (
      /\.pdf(\?|$)/i.test(u) ||
      /filesusr\.com\/ugd\//i.test(u) ||
      /wixstatic\.com\/media\/.+\.(pdf|docx?|xlsx?)/i.test(u)
    ) {
      found.add(u);
    }
  });
  return found;
}

async function crawlOne(browser, url, depth) {
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'he-IL',
  });
  const page = await ctx.newPage();
  const netDocs = await collectFilesFromNetwork(page);
  const nav = [];
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    nav.push({ status: resp?.status?.() });
    // Wix keeps polling — networkidle never fires. Wait for a fixed window
    // for SPA to hydrate PDF blocks and Wix dynamic elements.
    try {
      await page.waitForLoadState('load', { timeout: 15000 });
    } catch {}
    await page.waitForTimeout(3500);
    const data = await extractFromPage(page);
    data.docs = [...new Set([...(data.docs || []), ...netDocs])];
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: String(err), nav };
  } finally {
    await ctx.close();
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const queue = [];
  for (const u of START_URLS) {
    const n = normalize(u);
    if (n && !visited.has(n)) queue.push({ url: n, depth: 0 });
  }

  console.log(`Starting crawl. Seed: ${queue.length}. Already visited: ${visited.size}.`);

  let inFlight = 0;
  let done = 0;
  const results = pages.slice();

  await new Promise((resolve) => {
    const tick = async () => {
      while (inFlight < CONCURRENCY && queue.length > 0) {
        const task = queue.shift();
        if (!task) break;
        if (visited.has(task.url)) continue;
        visited.add(task.url);
        inFlight++;
        (async () => {
          const t0 = Date.now();
          const r = await crawlOne(browser, task.url, task.depth);
          const dt = Date.now() - t0;
          done++;
          if (r.ok) {
            const rec = { url: task.url, depth: task.depth, ms: dt, ...r.data };
            results.push(rec);
            // enqueue links
            if (task.depth < MAX_DEPTH) {
              for (const l of r.data.links) {
                if (!isInternal(l)) continue;
                const n = normalize(l);
                if (!n || visited.has(n)) continue;
                // skip file-like URLs from the traversal
                if (/\.(pdf|docx?|xlsx?|png|jpe?g|svg|webp|avif|css|js|ico)(\?|$)/i.test(n)) continue;
                queue.push({ url: n, depth: task.depth + 1 });
              }
            }
            // dedupe assets
            for (const im of r.data.images) assets.images.push(im);
            for (const doc of r.data.docs) assets.documents.push(doc);
            console.log(`[${done}] d${task.depth} ${dt}ms  ${task.url.slice(0, 100)}  (+${r.data.links.length} links, ${r.data.docs.length} docs)`);
          } else {
            console.warn(`[!] failed ${task.url}: ${r.error}`);
          }
          // persist every 5 pages
          if (done % 5 === 0) {
            saveJson(PAGES_FILE, results);
            saveJson(ASSETS_FILE, {
              images: [...new Set(assets.images)],
              documents: [...new Set(assets.documents)],
            });
            saveJson(VISITED_FILE, [...visited]);
          }
          inFlight--;
          if (queue.length === 0 && inFlight === 0) {
            saveJson(PAGES_FILE, results);
            saveJson(ASSETS_FILE, {
              images: [...new Set(assets.images)],
              documents: [...new Set(assets.documents)],
            });
            saveJson(VISITED_FILE, [...visited]);
            resolve();
          } else {
            tick();
          }
        })();
      }
    };
    tick();
  });

  await browser.close();
  console.log(`\nDONE. pages=${results.length}, images=${new Set(assets.images).size}, docs=${new Set(assets.documents).size}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
