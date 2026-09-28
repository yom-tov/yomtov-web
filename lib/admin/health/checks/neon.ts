import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { HealthCheck } from "../types";
import { errMessage } from "../util";

// Neon free tier storage. Override with NEON_STORAGE_LIMIT_MB after upgrading.
const LIMIT_MB = Number(process.env.NEON_STORAGE_LIMIT_MB) || 512;

export const neonCheck: HealthCheck = {
  id: "neon",
  serviceId: "neon",
  label: "מסד הנתונים (Neon)",
  async run() {
    if (!process.env.POSTGRES_URL && !process.env.yomtob_database_POSTGRES_URL) {
      return {
        status: "error",
        summary: "חסר POSTGRES_URL",
        alerts: [
          {
            key: "neon.not-configured",
            severity: "critical",
            title: "מסד הנתונים לא מחובר",
            detail: "משתנה הסביבה POSTGRES_URL חסר — משתמשים, קורסים וטקסטים לא זמינים.",
            link: "https://vercel.com/yom-tov/yomtov-web/settings/environment-variables",
          },
        ],
      };
    }
    const started = Date.now();
    try {
      const res = await db.execute<{ size: string }>(sql`SELECT pg_database_size(current_database())::text AS size`);
      const ms = Date.now() - started;
      const bytes = Number(res.rows[0]?.size ?? 0);
      const mb = bytes / 1024 / 1024;
      const pct = Math.round((mb / LIMIT_MB) * 100);
      const data = { ms, sizeMb: Math.round(mb * 10) / 10, limitMb: LIMIT_MB, pct };
      if (pct >= 80) {
        return {
          status: pct >= 95 ? "error" : "warn",
          summary: `${data.sizeMb}MB מתוך ${LIMIT_MB}MB (${pct}%)`,
          data,
          alerts: [
            {
              key: "neon.storage",
              severity: pct >= 95 ? "critical" : "warning",
              title: `מסד הנתונים מלא ב-${pct}%`,
              detail: `בשימוש ${data.sizeMb}MB מתוך ${LIMIT_MB}MB בתוכנית הנוכחית. כשהוא יתמלא, הרשמה, צפייה ושמירת תוכן יפסיקו לעבוד.`,
              actionHint: "שדרג את התוכנית ב-Neon (Billing), או נקה נתוני פעילות ישנים.",
              link: "https://console.neon.tech/",
            },
          ],
        };
      }
      return { status: ms > 3000 ? "warn" : "ok", summary: `מחובר · ${data.sizeMb}MB מתוך ${LIMIT_MB}MB`, data };
    } catch (e) {
      return {
        status: "error",
        summary: "אין חיבור למסד הנתונים",
        alerts: [
          {
            key: "neon.unreachable",
            severity: "critical",
            title: "אין חיבור למסד הנתונים",
            detail: `${errMessage(e)}. משתמשים לא יכולים להתחבר או לצפות בקורסים.`,
            actionHint: "בדוק בקונסולה של Neon שהפרויקט פעיל ולא הושהה, ושאין בעיית תשלום.",
            link: "https://console.neon.tech/",
          },
        ],
      };
    }
  },
};
