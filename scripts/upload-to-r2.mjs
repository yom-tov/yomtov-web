// One-time upload script — all 176 PDFs uploaded to R2 on 2026-09-15.
// Credentials removed. If you need to re-run, set env vars:
//   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT
//
// Public base URL: https://pub-5c4c7a1391a54e06b807a6a5dd5dfe5d.r2.dev

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

const BUCKET = "yomtov-assets";
const ENDPOINT = process.env.R2_ENDPOINT;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error("Missing env vars: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

function getAllFiles(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...getAllFiles(full, base));
    } else if (extname(full).toLowerCase() === ".pdf") {
      files.push(full);
    }
  }
  return files;
}

async function fileExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const pdfsDir = join(process.cwd(), "public", "pdfs");
  const files = getAllFiles(pdfsDir);

  console.log(`Found ${files.length} PDF files to upload\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const key = "pdfs/" + relative(pdfsDir, file).replace(/\\/g, "/");
    const size = statSync(file).size;

    const exists = await fileExists(key);
    if (exists) {
      skipped++;
      process.stdout.write(`  SKIP ${key} (already exists)\n`);
      continue;
    }

    try {
      const body = readFileSync(file);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: body,
          ContentType: "application/pdf",
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
      uploaded++;
      const sizeMB = (size / 1048576).toFixed(1);
      process.stdout.write(`  OK   ${key} (${sizeMB} MB)\n`);
    } catch (err) {
      failed++;
      console.error(`  FAIL ${key}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
  console.log(`Public base URL: https://pub-5c4c7a1391a54e06b807a6a5dd5dfe5d.r2.dev/pdfs/`);
}

main().catch(console.error);
