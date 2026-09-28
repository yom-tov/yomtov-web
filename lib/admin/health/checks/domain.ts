import { getDomainConfig, vercelConfigured } from "../../deployments";
import type { AlertDraft, HealthCheck } from "../types";
import { SITE_DOMAIN, SITE_WWW, daysUntil, dohQuery, errMessage, fmtDateHe } from "../util";

const NAMECHEAP_DOMAIN_URL = `https://ap.www.namecheap.com/domains/domaincontrolpanel/${SITE_DOMAIN}/domain`;
const NAMECHEAP_DNS_URL = `https://ap.www.namecheap.com/domains/domaincontrolpanel/${SITE_DOMAIN}/advancedns`;

// Vercel's anycast IPs for apex domains (current + legacy range).
function isVercelIp(ip: string): boolean {
  return ip === "76.76.21.21" || ip.startsWith("216.198.79.") || ip.startsWith("76.76.21.");
}
// Namecheap's parking page — what the domain resolves to when the
// nameservers are switched away from BasicDNS (the Sept-2026 outage).
function isNamecheapParking(ip: string): boolean {
  return ip.startsWith("198.54.117.") || ip.startsWith("162.255.119.");
}

export const dnsCheck: HealthCheck = {
  id: "dns",
  serviceId: "namecheap",
  label: "DNS (הפניית הדומיין לאתר)",
  async run(ctx) {
    const alerts: AlertDraft[] = [];
    try {
      const [ns, apexA, wwwCname] = await Promise.all([
        dohQuery(SITE_DOMAIN, "NS", ctx.signal),
        dohQuery(SITE_DOMAIN, "A", ctx.signal),
        dohQuery(SITE_WWW, "CNAME", ctx.signal),
      ]);

      const nsOk = ns.length > 0 && ns.every((n) => n.endsWith("registrar-servers.com"));
      if (!nsOk) {
        alerts.push({
          key: "dns.nameservers",
          severity: "critical",
          title: "ה-Nameservers של הדומיין שונו",
          detail: `הדומיין לא מנוהל יותר ע"י Namecheap BasicDNS (כרגע: ${ns.join(", ") || "אין"}). זו בדיוק התקלה שהפילה את האתר בספטמבר 2026.`,
          actionHint: "Namecheap → Domain List → yomtovian.com → Manage → בשורה NAMESERVERS בחר \"Namecheap BasicDNS\" ולחץ על ה-✓. אל תבחר \"Custom DNS\".",
          link: NAMECHEAP_DOMAIN_URL,
        });
      }

      const apexOk = apexA.length > 0 && apexA.some(isVercelIp);
      if (!apexOk) {
        const parking = apexA.some(isNamecheapParking);
        alerts.push({
          key: "dns.apex-a",
          severity: "critical",
          title: parking ? "הדומיין מפנה לדף חניה של Namecheap" : "הדומיין לא מפנה ל-Vercel",
          detail: `yomtovian.com מפנה ל-${apexA.join(", ") || "שום כתובת"} במקום לשרת של Vercel (76.76.21.21).`,
          actionHint: parking
            ? "בדוק קודם שה-Nameservers על \"Namecheap BasicDNS\". אחר כך ב-Advanced DNS ודא שיש A Record עם Host @ ו-Value 76.76.21.21."
            : "Namecheap → Advanced DNS: ודא שיש A Record עם Host @ ו-Value 76.76.21.21.",
          link: NAMECHEAP_DNS_URL,
        });
      }

      const wwwOk = wwwCname.some((c) => c.includes("vercel-dns"));
      if (!wwwOk) {
        alerts.push({
          key: "dns.www-cname",
          severity: "critical",
          title: "www.yomtovian.com לא מפנה ל-Vercel",
          detail: `הרשומה של www מפנה ל-${wwwCname.join(", ") || "שום כתובת"} במקום ל-Vercel.`,
          actionHint: "Namecheap → Advanced DNS: ודא שיש CNAME Record עם Host www שמצביע על הכתובת ש-Vercel נתן (…vercel-dns…com).",
          link: NAMECHEAP_DNS_URL,
        });
      }

      return {
        status: alerts.length ? "error" : "ok",
        summary: alerts.length ? "הדומיין לא מוגדר נכון" : "הדומיין מפנה נכון ל-Vercel",
        alerts,
        data: { ns, apexA, wwwCname },
      };
    } catch (e) {
      return { status: "unknown", summary: `בדיקת DNS נכשלה: ${errMessage(e)}` };
    }
  },
};

export const vercelDomainCheck: HealthCheck = {
  id: "vercel-domain",
  serviceId: "namecheap",
  label: "הדומיין ב-Vercel ותעודת האבטחה",
  async run(ctx) {
    if (!vercelConfigured()) return { status: "unknown", summary: "חסר VERCEL_TOKEN — לא ניתן לבדוק" };
    try {
      const [apex, www] = await Promise.all([
        getDomainConfig(SITE_DOMAIN, ctx.signal),
        getDomainConfig(SITE_WWW, ctx.signal),
      ]);
      const bad = [apex.misconfigured && SITE_DOMAIN, www.misconfigured && SITE_WWW].filter(Boolean) as string[];
      if (bad.length) {
        return {
          status: "error",
          summary: "Vercel מדווח שהדומיין לא מוגדר נכון",
          alerts: [
            {
              key: "vercel.domain.misconfigured",
              severity: "critical",
              title: "Vercel מדווח על הגדרת דומיין שגויה",
              detail: `${bad.join(" ו-")} לא מוגדר נכון, ולכן Vercel לא יכול להגיש את האתר או לחדש את תעודת ה-HTTPS.`,
              actionHint: "פתח ב-Vercel את Settings → Domains כדי לראות מה חסר, ותקן ב-Namecheap → Advanced DNS.",
              link: "https://vercel.com/yom-tov/yomtov-web/settings/domains",
            },
          ],
        };
      }
      return { status: "ok", summary: "מוגדר ומאובטח (HTTPS)" };
    } catch (e) {
      return { status: "unknown", summary: `לא ניתן לבדוק: ${errMessage(e)}` };
    }
  },
};

export const domainExpiryCheck: HealthCheck = {
  id: "domain-expiry",
  serviceId: "namecheap",
  label: "תוקף הדומיין",
  async run(ctx) {
    try {
      // RDAP is the public, key-less successor of WHOIS.
      const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${SITE_DOMAIN}`, {
        signal: ctx.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`RDAP ${res.status}`);
      const json = (await res.json()) as { events?: { eventAction: string; eventDate: string }[] };
      const exp = json.events?.find((e) => e.eventAction === "expiration")?.eventDate;
      if (!exp) return { status: "unknown", summary: "תאריך התפוגה לא ידוע" };
      const expiresAt = new Date(exp);
      const days = daysUntil(expiresAt);
      const data = { expiresAt: expiresAt.toISOString(), daysLeft: days };
      if (days <= 30) {
        return {
          status: days <= 7 ? "error" : "warn",
          summary: `הדומיין פג בעוד ${days} ימים`,
          data,
          alerts: [
            {
              key: `domain.expiry.${exp.slice(0, 10)}`,
              severity: days <= 7 ? "critical" : "warning",
              title: days < 0 ? "הדומיין פג תוקף!" : `הדומיין yomtovian.com פג בעוד ${days} ימים`,
              detail: `תאריך תפוגה: ${fmtDateHe(expiresAt)}. אם לא יחודש — האתר והמיילים יפסיקו לעבוד.`,
              actionHint: "Namecheap → Domain List → yomtovian.com → Renew. מומלץ להפעיל גם Auto-Renew.",
              link: NAMECHEAP_DOMAIN_URL,
            },
          ],
        };
      }
      return { status: "ok", summary: `בתוקף עד ${fmtDateHe(expiresAt)}`, data };
    } catch (e) {
      return { status: "unknown", summary: `לא ניתן לבדוק: ${errMessage(e)}` };
    }
  },
};
