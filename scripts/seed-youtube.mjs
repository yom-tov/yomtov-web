#!/usr/bin/env node
// One-time import of the YouTube videos that used to be hardcoded in the
// pages into the youtube_videos table. Idempotent: a collection that already
// has rows (visible or hidden) is left untouched.
//
// Usage: node --env-file=.env.local scripts/seed-youtube.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const SHORTS = new Set(["digital-shorts", "math"]);
const url = process.env.POSTGRES_URL ?? process.env.yomtob_database_POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set");
  process.exit(1);
}
const sql = neon(url);
const defaults = JSON.parse(readFileSync(new URL("../lib/site-content/youtube-defaults.json", import.meta.url), "utf8"));

for (const [collection, videos] of Object.entries(defaults)) {
  const [{ n }] = await sql.query("SELECT COUNT(*)::int AS n FROM youtube_videos WHERE collection = $1", [collection]);
  if (n > 0) {
    console.log(`skip ${collection} (${n} rows already)`);
    continue;
  }
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    await sql.query(
      "INSERT INTO youtube_videos (collection, youtube_id, title, is_short, display_order) VALUES ($1, $2, $3, $4, $5)",
      [collection, v.youtubeId, v.title, SHORTS.has(collection), i + 1],
    );
  }
  console.log(`seeded ${collection}: ${videos.length} videos`);
}
