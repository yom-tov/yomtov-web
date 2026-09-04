// Turn the crawled pages + extracted PDFs into typed content JSON files
// for the app, plus a manifest that download-assets.mjs can consume.
//
// Reads:   scripts/crawl-output/pdfs.json
// Writes:  content/*.json  (loaded at build time by app)
//          scripts/crawl-output/download-manifest.json
//          scripts/crawl-output/redirects.json

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'content');
const CRAWL_DIR = join(__dirname, 'crawl-output');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const raw = JSON.parse(readFileSync(join(CRAWL_DIR, 'pdfs.json'), 'utf8'));

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const decode = (u) => {
  try { return decodeURIComponent(u); } catch { return u; }
};

// slug from Hebrew title: transliterate common seasons/years, drop rest
const SEASON_MAP = { קיץ: 'summer', אביב: 'spring', חורף: 'winter', סתיו: 'fall' };
const VERSION_MAP = { א: 'a', ב: 'b', 'א/ב': 'combined', 'ב/א': 'combined' };
const SUBJECT_MAP = {
  תקבילית: 'analog', ספרתית: 'digital', חשמל: 'electricity',
};

// title parser: extract { season, year, version, subject? }
function parseExamTitle(title) {
  const t = title.replace(/[״"]/g, '').trim();
  const year = (t.match(/\b(19|20)\d{2}\b/) || [])[0];
  let season = null;
  for (const [heb, en] of Object.entries(SEASON_MAP)) if (t.includes(heb)) { season = en; break; }
  let version = null;
  const vmatch = t.match(/[אב]\/?[אב]?/g);
  if (vmatch) {
    const vs = vmatch.join('');
    if (VERSION_MAP[vs]) version = VERSION_MAP[vs];
    else if (vs.includes('א') && vs.includes('ב')) version = 'combined';
    else if (vs === 'א') version = 'a';
    else if (vs === 'ב') version = 'b';
  }
  let subject = null;
  for (const [heb, en] of Object.entries(SUBJECT_MAP)) if (t.includes(heb)) { subject = en; break; }
  return { year: year ? Number(year) : null, season, version, subject };
}

// build a URL-safe english slug for an item.
function toEnglishSlug(parts) {
  const s = parts.filter(Boolean).join('-');
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function hashSlug(title) {
  return crypto.createHash('sha1').update(title).digest('hex').slice(0, 8);
}

// slug for assignments/labs: try to find English hint in the URL, else hash
function titleToSlug(hebTitle, urlPathSegment) {
  const parsed = parseExamTitle(hebTitle);
  const seg = decode(urlPathSegment.split('/').pop() || '');
  // If the last URL segment is already English/numeric, use it
  if (/^[a-z0-9\-]+$/i.test(seg) && seg.length > 1) return seg.toLowerCase();
  const engParts = [parsed.season, parsed.year, parsed.version].filter(Boolean);
  if (engParts.length >= 2) return toEnglishSlug(engParts);
  return `item-${hashSlug(hebTitle)}`;
}

const BASE = 'https://www.e-tv.site';
const pageByUrl = new Map(raw.map((p) => [p.url, p]));

// -----------------------------------------------------------------------------
// Build subjects + categories mapping
// -----------------------------------------------------------------------------
const SUBJECTS = [
  {
    id: 'electricity',
    hebrewTitle: 'חשמל',
    description: 'מבחני מה"ט ומשרד החינוך, מטלות ותרגולים במעגלי חשמל DC/AC.',
    icon: 'Zap',
    color: 'from-blue-600 to-cyan-500',
    hebrewOriginalPath: '/חשמל',
  },
  {
    id: 'analog',
    hebrewTitle: 'אלקטרוניקה תקבילית',
    description: 'מגברים, טרנזיסטורים, דיודות, מסננים ומעגלים אנלוגיים.',
    icon: 'CircuitBoard',
    color: 'from-indigo-600 to-purple-500',
    hebrewOriginalPath: '/אלקטרוניקה-תקבילית',
  },
  {
    id: 'digital',
    hebrewTitle: 'אלקטרוניקה ספרתית',
    description: 'לוגיקה בוליאנית, שערים, מונים, זיכרונות ומעגלים ספרתיים.',
    icon: 'Binary',
    color: 'from-cyan-600 to-teal-500',
    hebrewOriginalPath: '/אלקטרוניקה-ספרתית',
  },
];

// URL scheme used by e-tv.site:
//   list pages:
//     /tests-mahat                       (mahat exams, currently all electricity)
//     /tests-education                   (education-ministry, currently all electricity)
//     /assignments-electricity
//     /assignments-analog-electronics
//     /assignments-digital-electronics
//     /labs                              (we haven't seen these paths yet — probably JS-only)
//   subject hubs (top-level Hebrew paths):
//     /חשמל  → 3 subpages via H2
//     ...
//
// Because the original site currently exposes mahat + education tests only under
// electricity, we assign every discovered exam to `electricity` for now. Analog &
// digital assignment lists have their own paths. Labs live inside individual
// pages we didn't crawl deeply.

const SECTION_MAP = {
  'tests-mahat': { subject: 'electricity', type: 'exam-mahat', title: 'מבחני מה"ט' },
  'tests-education': { subject: 'electricity', type: 'exam-education', title: 'מבחני משרד החינוך' },
  'assignments-electricity': { subject: 'electricity', type: 'assignments', title: 'עבודות ותרגולים' },
  'assignments-analog-electronics': { subject: 'analog', type: 'assignments', title: 'עבודות ותרגולים' },
};

// Build items
const exams = [];      // { id, slug, subject, source, title, year, season, version, examUrl, examSize, solutionUrl?, solutionSize?, originalListUrl, originalDetailUrl? }
const assignments = []; // { id, slug, subject, title, files:[{url,size,label}], originalListUrl, originalDetailUrl? }
const downloadManifest = []; // { srcUrl, destPath, sizeBytes, sha }
const redirects = [];   // { source, destination, permanent:true }

for (const page of raw) {
  const path = new URL(page.url).pathname.replace(/^\/+|\/+$/g, '');
  const seg = decode(path.split('/')[0]);
  const sub = decode(path.split('/')[1] || '');
  const mapping = SECTION_MAP[seg];
  if (!mapping) continue;

  const isList = !sub;
  if (isList) {
    // pair H2 titles with files, positionally
    const h2 = page.h2 || [];
    const files = page.files || [];
    const solutionSubpageLinks = (page.linkPairs || [])
      .filter((l) => /להצגת הפתרון|פתרון/.test(l.text || ''))
      .map((l) => l.href);
    const count = Math.min(h2.length, files.length);
    for (let i = 0; i < count; i++) {
      const title = h2[i];
      const file = files[i];
      if (!file || !file.url) continue;
      const parsed = parseExamTitle(title);
      // Build slug: prefer year/season/version composition for exams;
      // fall back to sub-page URL segment (often English) for assignments.
      const subUrlForSlug = solutionSubpageLinks[i];
      let slug = toEnglishSlug([parsed.season, parsed.year, parsed.version]);
      if (!slug && subUrlForSlug) {
        const segEnd = decode(new URL(subUrlForSlug).pathname.split('/').filter(Boolean).pop() || '');
        if (/^[a-zA-Z0-9\-]+$/.test(segEnd)) slug = segEnd.toLowerCase();
      }
      if (!slug) slug = `item-${hashSlug(title)}`;
      const uniqueId = `${mapping.subject}/${mapping.type}/${slug}`;
      // Attempt to find solution PDF via the linked sub-page
      const subUrl = solutionSubpageLinks[i];
      let solution = null;
      if (subUrl) {
        const subPage = pageByUrl.get(subUrl);
        if (subPage && subPage.files && subPage.files.length > 1) {
          // subpage typically has [examId, solutionId] — find the file that is NOT the exam file
          const notExam = subPage.files.find((f) => f.id !== file.id) || subPage.files[1];
          if (notExam?.url) {
            solution = { url: notExam.url, sizeBytes: notExam.sizeBytes, id: notExam.id };
          }
        } else if (subPage && subPage.files && subPage.files.length === 1) {
          // Only 1 file — might be solution-only or dup of exam; keep only if different
          const only = subPage.files[0];
          if (only.id !== file.id) {
            solution = { url: only.url, sizeBytes: only.sizeBytes, id: only.id };
          }
        }
      }

      if (mapping.type.startsWith('exam')) {
        const source = mapping.type === 'exam-mahat' ? 'mahat' : 'education';
        const item = {
          id: uniqueId,
          slug,
          subject: mapping.subject,
          source,
          title,
          year: parsed.year,
          season: parsed.season,
          version: parsed.version,
          topic: parsed.subject, // e.g. 'analog' subgroup within mahat electricity
          exam: {
            url: file.url,
            path: `/pdfs/${source}/${mapping.subject}/${slug}.pdf`,
            sizeBytes: file.sizeBytes,
            id: file.id,
          },
          solution: solution
            ? {
                url: solution.url,
                path: `/pdfs/${source}/${mapping.subject}/${slug}-solution.pdf`,
                sizeBytes: solution.sizeBytes,
                id: solution.id,
              }
            : null,
          originalListUrl: page.url,
          originalDetailUrl: subUrl || null,
        };
        exams.push(item);
        downloadManifest.push({ srcUrl: file.url, destPath: item.exam.path, sizeBytes: file.sizeBytes });
        if (solution) {
          downloadManifest.push({ srcUrl: solution.url, destPath: item.solution.path, sizeBytes: solution.sizeBytes });
        }
        // redirects: map old URLs to new
        const newExamUrl = `/${mapping.subject}/${source === 'mahat' ? 'mahat-exams' : 'ministry-exams'}/${slug}`;
        if (subUrl) {
          redirects.push({ source: new URL(subUrl).pathname, destination: newExamUrl, permanent: true });
        }
      } else {
        // assignment
        const item = {
          id: uniqueId,
          slug,
          subject: mapping.subject,
          title,
          topic: parsed.subject,
          files: [
            {
              url: file.url,
              path: `/pdfs/assignments/${mapping.subject}/${slug}.pdf`,
              sizeBytes: file.sizeBytes,
              id: file.id,
            },
          ],
          originalListUrl: page.url,
          originalDetailUrl: subUrl || null,
        };
        if (solution) {
          item.files.push({
            url: solution.url,
            path: `/pdfs/assignments/${mapping.subject}/${slug}-solution.pdf`,
            sizeBytes: solution.sizeBytes,
            id: solution.id,
          });
        }
        assignments.push(item);
        for (const f of item.files) {
          downloadManifest.push({ srcUrl: f.url, destPath: f.path, sizeBytes: f.sizeBytes });
        }
        if (subUrl) {
          const newUrl = `/${mapping.subject}/assignments/${slug}`;
          redirects.push({ source: new URL(subUrl).pathname, destination: newUrl, permanent: true });
        }
      }
    }
    // Also add redirect for the list page itself
    const listRedir = {
      'tests-mahat': '/electricity/mahat-exams',
      'tests-education': '/electricity/ministry-exams',
      'assignments-electricity': '/electricity/assignments',
      'assignments-analog-electronics': '/analog/assignments',
    }[seg];
    if (listRedir) {
      redirects.push({ source: `/${seg}`, destination: listRedir, permanent: true });
    }
  }
}

// Additional redirects: Hebrew top-level subject URLs → new English routes.
// Register BOTH the decoded and percent-encoded forms so we match no matter
// how the browser sends the request.
function pushHebrewRedirect(hebPath, destination) {
  redirects.push({ source: hebPath, destination, permanent: true });
  const enc = encodeURI(hebPath);
  if (enc !== hebPath) {
    redirects.push({ source: enc, destination, permanent: true });
  }
}
for (const s of SUBJECTS) {
  pushHebrewRedirect(s.hebrewOriginalPath, `/${s.id}`);
}
pushHebrewRedirect('/מבחנים', '/exams');
pushHebrewRedirect('/מעבדות', '/labs');
pushHebrewRedirect('/מחשבון', '/calculator');

// Deduplicate items (some list pages have partial dupes)
function dedupe(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, item);
  }
  return [...map.values()];
}
const uniqExams = dedupe(exams, (e) => `${e.subject}|${e.source}|${e.slug}`);
const uniqAssignments = dedupe(assignments, (a) => `${a.subject}|${a.slug}`);

// Sort exams by year desc (then session order: summer > spring > winter)
const SEASON_ORDER = { summer: 3, spring: 2, winter: 1, fall: 0, null: -1 };
uniqExams.sort((a, b) => {
  if ((b.year || 0) !== (a.year || 0)) return (b.year || 0) - (a.year || 0);
  return (SEASON_ORDER[b.season] || 0) - (SEASON_ORDER[a.season] || 0);
});
uniqAssignments.sort((a, b) => a.title.localeCompare(b.title, 'he'));

// -----------------------------------------------------------------------------
// Write output
// -----------------------------------------------------------------------------
writeFileSync(join(OUT_DIR, 'subjects.json'), JSON.stringify(SUBJECTS, null, 2), 'utf8');
writeFileSync(join(OUT_DIR, 'exams.json'), JSON.stringify(uniqExams, null, 2), 'utf8');
writeFileSync(join(OUT_DIR, 'assignments.json'), JSON.stringify(uniqAssignments, null, 2), 'utf8');
writeFileSync(join(OUT_DIR, 'labs.json'), JSON.stringify([], null, 2), 'utf8');

// Search index (lightweight)
const searchIndex = [
  ...uniqExams.map((e) => ({
    id: e.id,
    type: e.source === 'mahat' ? 'exam-mahat' : 'exam-education',
    title: e.title,
    subject: e.subject,
    year: e.year,
    season: e.season,
    version: e.version,
    url: `/${e.subject}/${e.source === 'mahat' ? 'mahat-exams' : 'ministry-exams'}/${e.slug}`,
  })),
  ...uniqAssignments.map((a) => ({
    id: a.id,
    type: 'assignment',
    title: a.title,
    subject: a.subject,
    url: `/${a.subject}/assignments/${a.slug}`,
  })),
];
writeFileSync(join(OUT_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2), 'utf8');

// download manifest + redirects (dedupe by destPath)
const seen = new Set();
const dedupedManifest = downloadManifest.filter((d) => {
  if (seen.has(d.destPath)) return false;
  seen.add(d.destPath);
  return true;
});
writeFileSync(join(CRAWL_DIR, 'download-manifest.json'), JSON.stringify(dedupedManifest, null, 2), 'utf8');
writeFileSync(join(CRAWL_DIR, 'redirects.json'), JSON.stringify(redirects, null, 2), 'utf8');

const totalSize = dedupedManifest.reduce((n, d) => n + (d.sizeBytes || 0), 0);
console.log(`\nBuild summary:`);
console.log(`  subjects:    ${SUBJECTS.length}`);
console.log(`  exams:       ${uniqExams.length}`);
console.log(`  assignments: ${uniqAssignments.length}`);
console.log(`  search index: ${searchIndex.length}`);
console.log(`  downloads:   ${dedupedManifest.length}  (${(totalSize / 1024 / 1024).toFixed(1)} MB total)`);
console.log(`  redirects:   ${redirects.length}`);
