import { Resend } from "resend";

export interface EmailProvider {
  sendVerificationEmail(
    to: string,
    token: string,
    name: string,
  ): Promise<void>;
  sendPasswordResetEmail(
    to: string,
    token: string,
    name: string,
  ): Promise<void>;
  sendWelcomeEmail(to: string, name: string): Promise<void>;
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3001";
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">אבי יומטוביאן</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">פשוט להבין!</p>
  </div>
  <div style="padding:32px;">
    ${content}
  </div>
  <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">yomtovian.com | אבי יומטוביאן</p>
  </div>
</div>
</body>
</html>`;
}

function actionButton(url: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0;">
  <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#6d28d9);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:700;">${label}</a>
</div>`;
}

class ResendEmailProvider implements EmailProvider {
  private resend: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.resend = new Resend(apiKey);
    this.from = from;
  }

  async sendVerificationEmail(to: string, token: string, name: string): Promise<void> {
    const url = `${getBaseUrl()}/verify-email?token=${token}`;
    const html = emailWrapper(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">שלום ${name},</h2>
      <p style="color:#475569;font-size:15px;line-height:1.7;">
        תודה שנרשמת לאתר! כדי להשלים את ההרשמה, לחץ על הכפתור:
      </p>
      ${actionButton(url, "אימות כתובת המייל")}
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
        הלינק תקף ל-24 שעות. אם לא נרשמת לאתר, ניתן להתעלם מהודעה זו.
      </p>
    `);

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: "אימות כתובת המייל - אבי יומטוביאן",
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const url = `${getBaseUrl()}/reset-password?token=${token}`;
    const html = emailWrapper(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">שלום ${name},</h2>
      <p style="color:#475569;font-size:15px;line-height:1.7;">
        קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור כדי לבחור סיסמה חדשה:
      </p>
      ${actionButton(url, "איפוס סיסמה")}
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
        הלינק תקף לשעה אחת. אם לא ביקשת איפוס סיסמה, ניתן להתעלם מהודעה זו.
      </p>
    `);

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: "איפוס סיסמה - אבי יומטוביאן",
      html,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = emailWrapper(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">ברוך הבא, ${name}!</h2>
      <p style="color:#475569;font-size:15px;line-height:1.7;">
        ההרשמה הושלמה בהצלחה. מעכשיו תוכל לגשת לתכנים בתשלום באתר.
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.7;">
        כדי לרכוש גישה לקורסים, היכנס לאזור האישי ובחר את החבילה שמתאימה לך.
      </p>
      ${actionButton(`${getBaseUrl()}/courses`, "לצפייה בקורסים")}
      <p style="color:#94a3b8;font-size:13px;">בהצלחה בלימודים!</p>
    `);

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: "ברוך הבא לאתר - אבי יומטוביאן",
      html,
    });
  }
}

class ConsoleEmailProvider implements EmailProvider {
  async sendVerificationEmail(to: string, token: string, name: string): Promise<void> {
    const url = `${getBaseUrl()}/verify-email?token=${token}`;
    console.log(`[EMAIL] Verification email to ${to} (${name}):\n  ${url}`);
  }

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const url = `${getBaseUrl()}/reset-password?token=${token}`;
    console.log(`[EMAIL] Password reset email to ${to} (${name}):\n  ${url}`);
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    console.log(`[EMAIL] Welcome email to ${to} (${name})`);
  }
}

let _provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!_provider) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const from = process.env.EMAIL_FROM || "אבי יומטוביאן <noreply@yomtovian.com>";
      _provider = new ResendEmailProvider(apiKey, from);
    } else {
      console.warn("[EMAIL] RESEND_API_KEY not set — using console fallback");
      _provider = new ConsoleEmailProvider();
    }
  }
  return _provider;
}

// ---------------------------------------------------------------------------
// Admin alert emails (daily health digest + "send test" button)
// ---------------------------------------------------------------------------
export interface AdminAlertEmailItem {
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string | null;
  actionHint: string | null;
  link: string | null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteLink(link: string): string {
  return link.startsWith("/") ? `${getBaseUrl()}${link}` : link;
}

export function renderAdminAlertEmail(items: AdminAlertEmailItem[], opts: { test?: boolean } = {}): {
  subject: string;
  html: string;
} {
  const critical = items.filter((i) => i.severity === "critical").length;
  const subject = opts.test
    ? "בדיקה: מייל ההתראות של yomtovian.com"
    : critical
      ? `🔴 yomtovian.com: ${critical} תקלות דחופות${items.length > critical ? ` ועוד ${items.length - critical} אזהרות` : ""}`
      : `🟡 yomtovian.com: ${items.length} דברים דורשים תשומת לב`;

  const rows = items
    .map((i) => {
      const color = i.severity === "critical" ? "#e11d48" : i.severity === "warning" ? "#d97706" : "#0284c7";
      const label = i.severity === "critical" ? "דחוף" : i.severity === "warning" ? "אזהרה" : "מידע";
      return `<div style="border:1px solid #e5e7eb;border-right:4px solid ${color};border-radius:10px;padding:14px 16px;margin:0 0 12px;">
  <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:4px;">${label}</div>
  <div style="font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(i.title)}</div>
  ${i.detail ? `<div style="font-size:13px;color:#475569;line-height:1.6;margin-top:6px;">${escapeHtml(i.detail)}</div>` : ""}
  ${i.actionHint ? `<div style="font-size:13px;color:#0f172a;line-height:1.6;margin-top:8px;background:#f8fafc;border-radius:8px;padding:8px 10px;"><b>מה לעשות:</b> ${escapeHtml(i.actionHint)}</div>` : ""}
  ${i.link ? `<div style="margin-top:8px;"><a href="${escapeHtml(absoluteLink(i.link))}" style="font-size:13px;color:#1e40af;">לפרטים ←</a></div>` : ""}
</div>`;
    })
    .join("\n");

  const intro = opts.test
    ? "זה מייל בדיקה. כך ייראה מייל ההתראות היומי כשתהיה בעיה באתר."
    : "הבדיקה היומית של האתר מצאה את הדברים הבאים:";

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">דוח מצב האתר</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">${intro}</p>
    ${rows}
    ${actionButton(`${getBaseUrl()}/admin/health`, "למצב המערכת בפאנל")}
    <p style="color:#94a3b8;font-size:12px;line-height:1.6;">
      המייל נשלח רק כשיש בעיה פתוחה. לחיצה על "ראיתי" בפאנל עוצרת את התזכורת עבור אותה בעיה.
    </p>
  `);
  return { subject, html };
}

/**
 * Send an email to the site owner. Tries the configured sender first and
 * falls back to Resend's shared sender (which works even when the site's
 * domain isn't verified in Resend yet).
 */
export async function sendOwnerEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[EMAIL] RESEND_API_KEY not set — owner email "${subject}" to ${to} not sent`);
    return { ok: false, error: "RESEND_API_KEY לא מוגדר" };
  }
  const resend = new Resend(apiKey);
  const primaryFrom = process.env.EMAIL_FROM || "אבי יומטוביאן <noreply@yomtovian.com>";
  const first = await resend.emails.send({ from: primaryFrom, to, subject, html });
  if (!first.error) return { ok: true };

  const fallback = await resend.emails.send({ from: "Yomtovian Alerts <onboarding@resend.dev>", to, subject, html });
  if (!fallback.error) return { ok: true };
  console.error("[EMAIL] owner email failed", first.error, fallback.error);
  return { ok: false, error: fallback.error.message || first.error.message };
}
