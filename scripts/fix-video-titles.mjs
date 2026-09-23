import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { videos } from "../lib/db/schema.ts";

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const db = drizzle(sql);

const TITLE_FIXES = [
  {
    oldTitle: "חשמל 2026 חלק 1 - תרגילים ראשוניים",
    newTitle: "חלק 1 - תרגילים ראשוניים",
  },
  {
    oldTitle: "חשמל 2026 חלק 2 - הכרת נוסחאות היסוד ותירגולן",
    newTitle: "חלק 2 - הכרת נוסחאות היסוד ותירגולן",
  },
  {
    oldTitle: "חשמל 2026 חלק 3 - מעגלים מעורבים, מקם הספק ושיפורו, משפט מילמן",
    newTitle: "חלק 3 - מעגלים מעורבים, מקם הספק ושיפורו, משפט מילמן",
  },
  {
    oldTitle: "חשמל 2026 חלק 4 - משפט מילמן, מתחי צמתים, מציאת כיוון הזרם האמיתי",
    newTitle: "חלק 4 - משפט מילמן, מתחי צמתים, מציאת כיוון הזרם האמיתי",
  },
  {
    oldTitle: "חשמל 2026 חלק 5 - תאוריה-מה עומד מאחורי הנוסחאות",
    newTitle: "חלק 5 - תאוריה - מה עומד מאחורי הנוסחאות",
  },
  {
    oldTitle: "חשמל 2026 חלק 6 - שיפור מקדם הספק במעגל פשוט",
    newTitle: "חלק 6 - שיפור מקדם הספק במעגל פשוט",
  },
  {
    oldTitle: "חשמל 2026 חלק 7 - מודל חתונה (חיבור וקטורי)",
    newTitle: "חלק 7 - מודל חתונה (חיבור וקטורי)",
  },
  {
    oldTitle: "חשמל 2026 חלק 8 - שיפור מקדם הספק במפעל",
    newTitle: "חלק 8 - שיפור מקדם הספק במפעל",
  },
  {
    oldTitle: "חשמל 2026 חלק 9 - זרמי חוגים + אלגברה",
    newTitle: "חלק 9 - זרמי חוגים + אלגברה",
  },
];

async function main() {
  let updated = 0;
  for (const fix of TITLE_FIXES) {
    const [row] = await db
      .select({ id: videos.id, title: videos.title })
      .from(videos)
      .where(eq(videos.title, fix.oldTitle))
      .limit(1);

    if (!row) {
      console.log(`[SKIP] Not found: "${fix.oldTitle}"`);
      continue;
    }

    await db
      .update(videos)
      .set({ title: fix.newTitle })
      .where(eq(videos.id, row.id));

    console.log(`[OK] "${fix.oldTitle}" → "${fix.newTitle}"`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} titles.`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
