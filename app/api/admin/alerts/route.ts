import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getLatestRun, listOpenAlerts } from "@/lib/admin/health/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Summary for the header bell / sidebar badge. Info-level alerts are listed
// but not counted.
export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  try {
    const [alerts, lastRun] = await Promise.all([listOpenAlerts(), getLatestRun()]);
    const active = alerts.filter((a) => !a.acknowledgedAt);
    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        key: a.key,
        source: a.source,
        severity: a.severity,
        title: a.title,
        detail: a.detail,
        actionHint: a.actionHint,
        link: a.link,
        firstSeenAt: a.firstSeenAt,
        lastSeenAt: a.lastSeenAt,
        acknowledgedAt: a.acknowledgedAt,
      })),
      critical: active.filter((a) => a.severity === "critical").length,
      warning: active.filter((a) => a.severity === "warning").length,
      lastRunAt: lastRun?.ranAt ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
