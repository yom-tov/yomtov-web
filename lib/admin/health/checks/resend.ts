import { Resend } from "resend";
import type { HealthCheck } from "../types";
import { SITE_DOMAIN, errMessage } from "../util";

export const resendCheck: HealthCheck = {
  id: "resend",
  serviceId: "resend",
  label: "שליחת מיילים (Resend)",
  async run() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return {
        status: "error",
        summary: "מיילים לא נשלחים — חסר RESEND_API_KEY",
        alerts: [
          {
            key: "resend.no-key",
            severity: "critical",
            title: "מיילים לא נשלחים",
            detail: "חסר RESEND_API_KEY, ולכן מיילי אימות ואיפוס סיסמה לא נשלחים בפועל (הם נכתבים רק ללוג).",
            actionHint: "צור מפתח ב-Resend → API Keys והוסף אותו כ-RESEND_API_KEY במשתני הסביבה ב-Vercel.",
            link: "https://resend.com/api-keys",
          },
        ],
      };
    }
    try {
      const resend = new Resend(key);
      const { data, error } = await resend.domains.list();
      if (error) {
        if (error.name === "restricted_api_key") {
          // Sending-only key: can send but can't read domain status. That's fine.
          return { status: "ok", summary: "מחובר (מפתח לשליחה בלבד)" };
        }
        const auth = error.name === "invalid_api_key" || error.name === "missing_api_key";
        return {
          status: "error",
          summary: auth ? "המפתח של Resend לא תקף" : `שגיאה: ${error.message}`,
          alerts: [
            {
              key: "resend.error",
              severity: auth ? "critical" : "warning",
              title: auth ? "המפתח של Resend לא תקף — מיילים לא נשלחים" : "בעיה בשירות המיילים",
              detail: error.message,
              link: "https://resend.com/api-keys",
            },
          ],
        };
      }
      const domain = data?.data.find((d) => d.name === SITE_DOMAIN || SITE_DOMAIN.endsWith(`.${d.name}`));
      if (!domain || domain.status !== "verified") {
        return {
          status: "warn",
          summary: domain ? `הדומיין ב-Resend: ${domain.status}` : "הדומיין לא מוגדר ב-Resend",
          data: { domainStatus: domain?.status ?? null },
          alerts: [
            {
              key: "resend.domain-unverified",
              severity: "warning",
              title: "הדומיין לא מאומת ב-Resend",
              detail: `כדי לשלוח מיילים מ-noreply@${SITE_DOMAIN} צריך לאמת את הדומיין ב-Resend. בלי זה, מיילי אימות ואיפוס סיסמה עלולים לא להגיע למשתמשים.`,
              actionHint: `Resend → Domains → Add Domain (${SITE_DOMAIN}), ואז הוסף את רשומות ה-DNS שהם נותנים ב-Namecheap → Advanced DNS (בלי לשנות את ה-Nameservers!).`,
              link: "https://resend.com/domains",
            },
          ],
        };
      }
      return { status: "ok", summary: `מחובר · ${SITE_DOMAIN} מאומת`, data: { domainStatus: domain.status } };
    } catch (e) {
      return { status: "unknown", summary: `לא ניתן לבדוק: ${errMessage(e)}` };
    }
  },
};
