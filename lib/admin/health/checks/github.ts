import { recentCommitsWithMeta, githubConfigured, REPO_INFO, type CommitSummary } from "../../github";
import { vercelConfigured } from "../../deployments";
import type { AlertDraft, HealthCheck } from "../types";
import { daysUntil, errMessage, fmtDateHe, minutesSince } from "../util";
import { getProductionDeployments } from "./vercel";

const NOT_DEPLOYED_AFTER_MIN = 15;

export const githubCheck: HealthCheck = {
  id: "github",
  serviceId: "github",
  label: "קוד ותוכן (GitHub)",
  async run(ctx) {
    if (!githubConfigured()) {
      return { status: "unknown", summary: "חסר GITHUB_TOKEN — לא ניתן לבדוק" };
    }

    let commits: CommitSummary[];
    let tokenExpiresAt: Date | null;
    try {
      ({ commits, tokenExpiresAt } = await ctx.memo("github.commits", () => recentCommitsWithMeta(15)));
    } catch (e) {
      const msg = errMessage(e);
      const auth = /401|403|Bad credentials/i.test(msg);
      return {
        status: "error",
        summary: auth ? "הטוקן של GitHub לא תקף" : `לא ניתן להתחבר ל-GitHub: ${msg}`,
        alerts: [
          {
            key: "github.unreachable",
            severity: "warning",
            title: auth ? "הטוקן של GitHub לא תקף או פג תוקף" : "אין חיבור ל-GitHub",
            detail: "בלי חיבור ל-GitHub לא ניתן להוסיף או לערוך מבחנים, מטלות, נוסחאונים ומעבדות מהפאנל.",
            actionHint: auth
              ? "צור טוקן חדש ב-GitHub (Settings → Developer settings → Fine-grained tokens, הרשאת Contents: Read & Write למאגר yomtov-web) ועדכן את GITHUB_TOKEN ב-Vercel."
              : undefined,
            link: "https://github.com/settings/tokens?type=beta",
          },
        ],
      };
    }

    const alerts: AlertDraft[] = [];

    // Token expiry
    if (tokenExpiresAt) {
      const days = daysUntil(tokenExpiresAt);
      if (days <= 14) {
        alerts.push({
          key: `github.token-expiry.${tokenExpiresAt.toISOString().slice(0, 10)}`,
          severity: days <= 3 ? "critical" : "warning",
          title: days < 0 ? "הטוקן של GitHub פג תוקף" : `הטוקן של GitHub יפוג בעוד ${days} ימים`,
          detail: `תוקף הטוקן: ${fmtDateHe(tokenExpiresAt)}. אחרי שיפוג, הפאנל לא יוכל לשמור מבחנים, מטלות ומעבדות.`,
          actionHint: "ב-GitHub: Settings → Developer settings → Fine-grained tokens → Regenerate, ואז עדכן את GITHUB_TOKEN ב-Vercel.",
          link: "https://github.com/settings/tokens?type=beta",
        });
      }
    }

    // Did the latest commit reach the live site?
    let deployedShas = new Set<string>();
    let canCompare = false;
    if (vercelConfigured()) {
      try {
        const deployments = await getProductionDeployments(ctx);
        deployedShas = new Set(deployments.map((d) => d.commitSha).filter((s): s is string => Boolean(s)));
        canCompare = true;
      } catch {
        // deployments check reports this on its own
      }
    }

    const latest = commits[0];
    if (canCompare && latest && !deployedShas.has(latest.sha) && minutesSince(Date.parse(latest.date)) > NOT_DEPLOYED_AFTER_MIN) {
      alerts.push({
        key: `github.not-deployed.${latest.sha}`,
        severity: "warning",
        title: "שינוי אחרון לא עלה לאתר",
        detail: `השינוי "${latest.message}" נשמר ב-GitHub לפני יותר מ-${NOT_DEPLOYED_AFTER_MIN} דקות, אבל Vercel לא בנה ממנו גרסה חדשה.`,
        actionHint: "בדוק ב-Vercel שהחיבור ל-GitHub תקין (Settings → Git). אפשר גם ללחוץ Redeploy על הדיפלוי האחרון.",
        link: "https://vercel.com/yom-tov/yomtov-web/deployments",
      });
    }

    const commitsWithStatus = commits.map((c) => ({ ...c, deployed: canCompare ? deployedShas.has(c.sha) : null }));
    const status = alerts.some((a) => a.severity === "critical") ? "error" : alerts.length ? "warn" : "ok";
    const tokenNote = tokenExpiresAt ? ` · הטוקן בתוקף עד ${fmtDateHe(tokenExpiresAt)}` : "";
    return {
      status,
      summary: latest ? `שינוי אחרון: ${fmtDateHe(latest.date)}${tokenNote}` : "אין קומיטים",
      alerts,
      data: {
        commits: commitsWithStatus,
        repoUrl: `https://github.com/${REPO_INFO.owner}/${REPO_INFO.repo}`,
        tokenExpiresAt: tokenExpiresAt?.toISOString() ?? null,
      },
    };
  },
};
