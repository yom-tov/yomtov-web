import { NextResponse, type NextRequest } from "next/server";
import { runAndStore, alertsToEmail, markEmailed, pruneOldAlerts } from "@/lib/admin/health/store";
import { getAdminSettings, getAlertRecipient } from "@/lib/admin/admin-settings";
import { renderAdminAlertEmail, sendOwnerEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily health check (scheduled in vercel.json). Runs every check, records the
// alerts, and emails the owner when something needs attention.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { results } = await runAndStore("cron");
  await pruneOldAlerts().catch(() => {});

  const settings = await getAdminSettings();
  const to = await getAlertRecipient();
  const pending = await alertsToEmail();

  let email: { sent: boolean; to?: string; error?: string } = { sent: false };
  if (pending.length && settings.dailyEmailEnabled && to) {
    const { subject, html } = renderAdminAlertEmail(pending);
    const res = await sendOwnerEmail(to, subject, html);
    if (res.ok) await markEmailed(pending.map((a) => a.id));
    email = { sent: res.ok, to, error: res.error };
  }

  return NextResponse.json({
    ok: true,
    checks: results.map((r) => ({ id: r.id, status: r.status, alerts: r.alerts.length, failed: r.failed })),
    openForEmail: pending.length,
    email,
  });
}
