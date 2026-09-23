import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { videos, packageVideos, contentPackages } from "../lib/db/schema.ts";
import { eq } from "drizzle-orm";

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

const SLUG = "intro-ac-current";

const [pkg] = await db
  .select({ id: contentPackages.id, title: contentPackages.title })
  .from(contentPackages)
  .where(eq(contentPackages.slug, SLUG))
  .limit(1);

console.log(`Package: "${pkg.title}" (${pkg.id})`);

const rows = await db
  .select({
    title: videos.title,
    order: packageVideos.displayOrder,
    playbackId: videos.muxPlaybackId,
  })
  .from(packageVideos)
  .innerJoin(videos, eq(packageVideos.videoId, videos.id))
  .where(eq(packageVideos.packageId, pkg.id))
  .orderBy(packageVideos.displayOrder);

for (const r of rows) {
  console.log(`  ${r.order}. ${r.title}  [${r.playbackId.slice(0, 12)}...]`);
}
