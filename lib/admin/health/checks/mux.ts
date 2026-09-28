import { getMuxClient } from "@/lib/mux/client";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import type { AlertDraft, HealthCheck } from "../types";
import { errMessage } from "../util";

const MAX_ASSETS = 500;

export const muxCheck: HealthCheck = {
  id: "mux",
  serviceId: "mux",
  label: "סרטוני הקורסים (Mux)",
  async run(ctx) {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return { status: "unknown", summary: "חסרים MUX_TOKEN_ID / MUX_TOKEN_SECRET — לא ניתן לבדוק" };
    }
    const alerts: AlertDraft[] = [];
    const assets = new Map<string, { status: string; playbackIds: string[] }>();
    try {
      const mux = getMuxClient();
      for await (const a of mux.video.assets.list({ limit: 100 }, { signal: ctx.signal })) {
        assets.set(a.id, { status: a.status, playbackIds: (a.playback_ids ?? []).map((p) => p.id) });
        if (assets.size >= MAX_ASSETS) break;
      }
    } catch (e) {
      const msg = errMessage(e);
      const auth = /401|403|unauthori/i.test(msg);
      return {
        status: "error",
        summary: auth ? "המפתחות של Mux לא תקפים" : `אין חיבור ל-Mux: ${msg}`,
        alerts: [
          {
            key: "mux.unreachable",
            severity: auth ? "critical" : "warning",
            title: auth ? "המפתחות של Mux לא תקפים" : "אין חיבור ל-Mux",
            detail: "הפאנל לא מצליח לדבר עם Mux. אם הבעיה בחשבון (למשל תשלום), גם הסרטונים באתר עלולים להפסיק לעבוד.",
            actionHint: auth ? "בדוק ב-Mux → Settings → Access Tokens שהטוקן פעיל, ועדכן את MUX_TOKEN_ID / MUX_TOKEN_SECRET ב-Vercel." : undefined,
            link: "https://dashboard.mux.com/",
          },
        ],
      };
    }

    const errored = [...assets.entries()].filter(([, a]) => a.status === "errored");
    for (const [id] of errored) {
      alerts.push({
        key: `mux.asset-errored.${id}`,
        severity: "warning",
        title: "סרטון נכשל בעיבוד ב-Mux",
        detail: `הסרטון ${id} במצב שגיאה ב-Mux ולא ניתן לצפייה.`,
        actionHint: "פתח אותו בדשבורד של Mux כדי לראות את הסיבה. בדרך כלל צריך להעלות את הקובץ מחדש.",
        link: `https://dashboard.mux.com/`,
      });
    }

    // Videos in the site DB whose Mux asset no longer exists.
    let missing = 0;
    try {
      const rows = await db.select({ id: videos.id, title: videos.title, muxAssetId: videos.muxAssetId }).from(videos);
      if (assets.size < MAX_ASSETS) {
        for (const v of rows) {
          if (!assets.has(v.muxAssetId)) {
            missing++;
            alerts.push({
              key: `mux.missing-asset.${v.id}`,
              severity: "warning",
              title: `הסרטון "${v.title}" לא נמצא ב-Mux`,
              detail: "הסרטון רשום באתר, אבל הקובץ שלו לא קיים יותר ב-Mux — הוא לא יתנגן.",
              actionHint: "ערוך את הסרטון בפאנל והעלה אותו מחדש, או מחק אותו מהקורס.",
              link: `/admin/videos/${v.id}/edit`,
            });
          }
        }
      }
    } catch {
      // DB problems are reported by the Neon check
    }

    const ready = [...assets.values()].filter((a) => a.status === "ready").length;
    return {
      status: alerts.length ? "warn" : "ok",
      summary: `${ready} סרטונים מוכנים ב-Mux${errored.length ? ` · ${errored.length} בשגיאה` : ""}${missing ? ` · ${missing} חסרים` : ""}`,
      alerts,
      data: { total: assets.size, ready, errored: errored.length, missing },
    };
  },
};
