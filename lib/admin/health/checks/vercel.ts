import {
  listDeployments,
  getTeam,
  vercelConfigured,
  VercelApiError,
  type DeploymentSummary,
} from "../../deployments";
import type { AlertDraft, CheckContext, HealthCheck } from "../types";
import { SITE_URL, errMessage, minutesSince, fmtDateTimeHe } from "../util";

const VERCEL_PROJECT_URL = "https://vercel.com/yom-tov/yomtov-web";
const STUCK_AFTER_MIN = 20;
const RECENT_FAILURE_DAYS = 7;

export function getProductionDeployments(ctx: CheckContext): Promise<DeploymentSummary[]> {
  return ctx.memo("vercel.deployments", () => listDeployments({ limit: 20, target: "production", signal: ctx.signal }));
}

function notConfigured() {
  return {
    status: "unknown" as const,
    summary: "חסרים VERCEL_TOKEN / VERCEL_PROJECT_ID — לא ניתן לבדוק",
  };
}

function tokenAlert(e: unknown): AlertDraft | null {
  if (e instanceof VercelApiError && (e.status === 401 || e.status === 403)) {
    return {
      key: "vercel.token-invalid",
      severity: "warning",
      title: "הטוקן של Vercel לא תקף",
      detail: "הפאנל לא מצליח לקרוא נתונים מ-Vercel (סטטוס דיפלויים והתראות).",
      actionHint: "צור טוקן חדש ב-Vercel → Account Settings → Tokens, ועדכן את VERCEL_TOKEN במשתני הסביבה של הפרויקט.",
      link: "https://vercel.com/account/tokens",
    };
  }
  return null;
}

export const deploymentsCheck: HealthCheck = {
  id: "vercel-deployments",
  serviceId: "vercel",
  label: "דיפלויים (עדכוני האתר)",
  async run(ctx) {
    if (!vercelConfigured()) return notConfigured();
    let deployments: DeploymentSummary[];
    try {
      deployments = await getProductionDeployments(ctx);
    } catch (e) {
      const alert = tokenAlert(e);
      return { status: "unknown", summary: `לא ניתן לקרוא דיפלויים: ${errMessage(e)}`, alerts: alert ? [alert] : [] };
    }

    const alerts: AlertDraft[] = [];
    const latest = deployments[0];
    const data = { deployments };
    if (!latest) return { status: "unknown", summary: "אין דיפלויים", data };

    // Newest-first: a failure is "fixed" if any later (newer) deployment is READY.
    const cutoff = Date.now() - RECENT_FAILURE_DAYS * 24 * 60 * 60 * 1000;
    deployments.forEach((d, i) => {
      if (d.state !== "ERROR" || d.createdAt < cutoff) return;
      const fixed = deployments.slice(0, i).some((n) => n.state === "READY");
      const commit = d.commitMessage ? `"${d.commitMessage}"` : "";
      if (i === 0) {
        alerts.push({
          key: `vercel.deploy.failed.${d.id}`,
          severity: "critical",
          title: "העדכון האחרון של האתר נכשל",
          detail: `הבנייה של ${commit || "השינוי האחרון"} נכשלה (${fmtDateTimeHe(d.createdAt)}). האתר ממשיך לעבוד על הגרסה הקודמת, אבל השינוי לא עלה.`,
          actionHint: "פתח את הדיפלוי ב-Vercel כדי לראות את השגיאה. אם זה שינוי מהפאנל — נסה לשמור שוב; אם זה שינוי בקוד — צריך לתקן את הקוד.",
          link: d.inspectorUrl ?? VERCEL_PROJECT_URL,
        });
      } else if (!fixed) {
        alerts.push({
          key: `vercel.deploy.failed.${d.id}`,
          severity: "warning",
          title: "דיפלוי נכשל",
          detail: `הבנייה של ${commit || "שינוי"} נכשלה (${fmtDateTimeHe(d.createdAt)}).`,
          link: d.inspectorUrl ?? VERCEL_PROJECT_URL,
        });
      } else {
        alerts.push({
          key: `vercel.deploy.failed.${d.id}`,
          severity: "info",
          title: "דיפלוי נכשל ותוקן",
          detail: `הבנייה של ${commit || "שינוי"} נכשלה (${fmtDateTimeHe(d.createdAt)}), ועדכון מאוחר יותר עלה בהצלחה.`,
          link: d.inspectorUrl ?? VERCEL_PROJECT_URL,
        });
      }
    });

    for (const d of deployments) {
      if (["BUILDING", "QUEUED", "INITIALIZING"].includes(d.state) && minutesSince(d.createdAt) > STUCK_AFTER_MIN) {
        alerts.push({
          key: `vercel.deploy.stuck.${d.id}`,
          severity: "warning",
          title: "דיפלוי תקוע",
          detail: `דיפלוי שהתחיל ב-${fmtDateTimeHe(d.createdAt)} עדיין לא הסתיים אחרי יותר מ-${STUCK_AFTER_MIN} דקות.`,
          actionHint: "פתח אותו ב-Vercel ובדוק. אפשר לבטל ולהריץ מחדש (Redeploy).",
          link: d.inspectorUrl ?? VERCEL_PROJECT_URL,
        });
      }
    }

    const lastReady = deployments.find((d) => d.state === "READY");
    const status = latest.state === "ERROR" ? "error" : alerts.some((a) => a.severity === "warning") ? "warn" : "ok";
    const summary =
      latest.state === "ERROR"
        ? "העדכון האחרון נכשל"
        : latest.state === "READY"
          ? `עודכן לאחרונה ${fmtDateTimeHe(latest.readyAt ?? latest.createdAt)}`
          : `עדכון בתהליך… (${lastReady ? `הגרסה החיה מ-${fmtDateTimeHe(lastReady.createdAt)}` : ""})`;
    return { status, summary, alerts, data };
  },
};

export const accountCheck: HealthCheck = {
  id: "vercel-account",
  serviceId: "vercel",
  label: "חשבון Vercel",
  async run(ctx) {
    if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_TEAM_ID) {
      return { status: "unknown", summary: "חסרים VERCEL_TOKEN / VERCEL_TEAM_ID — לא ניתן לבדוק" };
    }
    try {
      const team = await getTeam(ctx.signal);
      if (!team) return { status: "unknown", summary: "לא נמצא צוות" };
      const planLabel = team.plan ? `תוכנית ${team.plan}` : "תוכנית לא ידועה";
      if (team.softBlock) {
        return {
          status: "error",
          summary: `החשבון חסום (${planLabel})`,
          data: { plan: team.plan },
          alerts: [
            {
              key: "vercel.account.blocked",
              severity: "critical",
              title: "חשבון Vercel חסום",
              detail: `Vercel חסמו את החשבון${team.softBlock.reason ? ` (סיבה: ${team.softBlock.reason})` : ""}. בדרך כלל זה קורה כשחורגים ממגבלות השימוש של התוכנית או כשיש בעיית תשלום.`,
              actionHint: "היכנס ל-Vercel → Settings → Billing / Usage, בדוק מה חרג ושדרג תוכנית או הסדר תשלום.",
              link: "https://vercel.com/yom-tov/~/settings/billing",
            },
          ],
        };
      }
      return { status: "ok", summary: `פעיל · ${planLabel}`, data: { plan: team.plan } };
    } catch (e) {
      const alert = tokenAlert(e);
      return { status: "unknown", summary: `לא ניתן לבדוק: ${errMessage(e)}`, alerts: alert ? [alert] : [] };
    }
  },
};

export const siteUpCheck: HealthCheck = {
  id: "site-up",
  serviceId: "vercel",
  label: "האתר עולה",
  async run(ctx) {
    const started = Date.now();
    try {
      const res = await fetch(`${SITE_URL}/`, {
        signal: ctx.signal,
        cache: "no-store",
        headers: { "user-agent": "yomtov-health-check" },
      });
      const ms = Date.now() - started;
      if (res.ok) {
        return {
          status: ms > 5000 ? "warn" : "ok",
          summary: `האתר עלה תוך ${(ms / 1000).toFixed(1)} שניות`,
          data: { ms },
        };
      }
      return {
        status: "error",
        summary: `האתר מחזיר שגיאה ${res.status}`,
        alerts: [
          {
            key: "site.down",
            severity: "critical",
            title: "האתר לא עולה",
            detail: `${SITE_URL} מחזיר שגיאה ${res.status}.`,
            actionHint: "בדוק את מצב הדיפלוי האחרון ב-Vercel ואת בדיקת ה-DNS למטה.",
            link: "https://vercel.com/yom-tov/yomtov-web",
          },
        ],
      };
    } catch (e) {
      return {
        status: "error",
        summary: "האתר לא עונה",
        alerts: [
          {
            key: "site.down",
            severity: "critical",
            title: "האתר לא עולה",
            detail: `לא התקבלה תשובה מ-${SITE_URL} (${errMessage(e)}).`,
            actionHint: "בדוק קודם את בדיקת ה-DNS (Namecheap) — זו הסיבה הנפוצה. אחר כך את מצב הדיפלוי ב-Vercel.",
            link: "https://vercel.com/yom-tov/yomtov-web",
          },
        ],
      };
    }
  },
};
