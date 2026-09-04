// Download every PDF listed in download-manifest.json to public/pdfs.
// Skip files already present with matching size (idempotent restart).

import { createWriteStream, existsSync, statSync, mkdirSync, readFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST = join(__dirname, 'crawl-output', 'download-manifest.json');
const PUBLIC = join(ROOT, 'public');

const items = JSON.parse(readFileSync(MANIFEST, 'utf8'));
console.log(`Manifest: ${items.length} files.`);

let done = 0, skipped = 0, failed = 0, downloaded = 0, bytes = 0;

const CONCURRENCY = 4;

async function downloadOne(item) {
  const dest = join(PUBLIC, item.destPath.replace(/^\//, ''));
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (existsSync(dest)) {
    const st = statSync(dest);
    if (item.sizeBytes && st.size === item.sizeBytes) {
      skipped++;
      return;
    }
  }
  const res = await fetch(item.srcUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows) yomtov-web-migrator/1.0',
      'Accept': 'application/pdf, */*',
    },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  downloaded++;
  const st = statSync(dest);
  bytes += st.size;
}

const queue = [...items];
async function worker(n) {
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    try {
      await downloadOne(item);
    } catch (e) {
      failed++;
      console.warn(`  fail ${item.destPath}: ${e.message}`);
    } finally {
      done++;
      if (done % 10 === 0 || done === items.length) {
        console.log(`  progress ${done}/${items.length}  downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
      }
    }
  }
}

const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i));
await Promise.all(workers);

console.log('');
console.log(`DONE.  downloaded=${downloaded}  skipped=${skipped}  failed=${failed}`);
console.log(`Bytes downloaded: ${(bytes / 1024 / 1024).toFixed(1)} MB`);
