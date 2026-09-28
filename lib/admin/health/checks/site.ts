import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentPackages, packageVideos, videos } from "@/lib/db/schema";
import { exams, assignments, formulas, searchIndex } from "@/lib/content";
import { SERVICES, isEnvSet } from "../../architecture";
import type { AlertDraft, HealthCheck } from "../types";

export const envCheck: HealthCheck = {
  id: "env",
  serviceId: "site",
  label: "משתני סביבה (מפתחות)",
  async run() {
    const missing = SERVICES.flatMap((s) =>
      s.envVars.filter((v) => !isEnvSet(v)).map((v) => ({ ...v, service: s.name })),
    );
    if (!missing.length) return { status: "ok", summary: "כל המפתחות מוגדרים" };
    const critical = missing.filter((m) => m.critical);
    return {
      status: critical.length ? "error" : "warn",
      summary: `חסרים ${missing.length} משתני סביבה`,
      data: { missing: missing.map((m) => ({ name: m.name, service: m.service, purpose: m.purpose })) },
      alerts: missing.map((m) => ({
        key: `env.missing.${m.name}`,
        severity: m.critical ? "critical" : "warning",
        title: `חסר משתנה סביבה: ${m.name}`,
        detail: `${m.service} — ${m.purpose}.`,
        actionHint: "הוסף אותו ב-Vercel → Settings → Environment Variables (Production), ואז הרץ Redeploy.",
        link: "https://vercel.com/yom-tov/yomtov-web/settings/environment-variables",
      })),
    };
  },
};

export const contentCheck: HealthCheck = {
  id: "content",
  serviceId: "site",
  label: "תקינות התוכן",
  async run() {
    const alerts: AlertDraft[] = [];

    // Search index built into this deployment vs the content it should contain.
    const expected = exams.length + assignments.length + formulas.length;
    if (searchIndex.length !== expected) {
      alerts.push({
        key: "content.search-index",
        severity: "warning",
        title: "אינדקס החיפוש לא מעודכן",
        detail: `בחיפוש באתר יש ${searchIndex.length} פריטים, אבל קיימים ${expected} מבחנים, מטלות ונוסחאונים גלויים. חלק מהתוכן לא יימצא בחיפוש.`,
        actionHint: "שמירה של פריט כלשהו (מבחן, מטלה או נוסחאון) בפאנל בונה את האינדקס מחדש.",
      });
    }

    // Published courses without any visible video.
    try {
      const empty = await db
        .select({ id: contentPackages.id, title: contentPackages.title })
        .from(contentPackages)
        .where(
          and(
            eq(contentPackages.published, true),
            sql`NOT EXISTS (
              SELECT 1 FROM ${packageVideos}
              INNER JOIN ${videos} ON ${videos.id} = ${packageVideos.videoId}
              WHERE ${packageVideos.packageId} = ${contentPackages.id} AND ${videos.hidden} = false
            )`,
          ),
        );
      for (const p of empty) {
        alerts.push({
          key: `content.empty-course.${p.id}`,
          severity: "warning",
          title: `הקורס "${p.title}" מפורסם אבל אין בו סרטונים`,
          detail: "גולשים רואים את הקורס באתר, אבל אין בו אף סרטון גלוי (וגם לא פרומו).",
          actionHint: "הוסף סרטונים לקורס, או העבר אותו לטיוטה.",
          link: `/admin/packages/${p.id}/edit`,
        });
      }
    } catch {
      // Neon check reports DB problems
    }

    return {
      status: alerts.length ? "warn" : "ok",
      summary: alerts.length ? `${alerts.length} בעיות תוכן` : `${expected} פריטי תוכן תקינים`,
      alerts,
    };
  },
};
