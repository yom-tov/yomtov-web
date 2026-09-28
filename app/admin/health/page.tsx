import { connection } from "next/server";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GitCommit,
  History,
  Info,
  Rocket,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { db } from "@/lib/db";
import { serviceAccounts } from "@/lib/db/schema";
import { getLatestRun, listOpenAlerts, listResolvedAlerts, runAndStore, type AlertRow } from "@/lib/admin/health/store";
import type { CheckResult } from "@/lib/admin/health/types";
import { daysUntil } from "@/lib/admin/health/util";
import type { DeploymentSummary } from "@/lib/admin/deployments";
import { SERVICES, SERVICE_BY_ID, type ServiceId } from "@/lib/admin/architecture";
import { Badge, Banner, Card, PageHeader, StatusDot, type Status } from "@/components/admin/ui/primitives";
import {
  AckButton,
  RunChecksButton,
  SendTestEmailButton,
  ServiceAccountEditor,
  type ServiceAccountRow,
} from "@/components/admin/health/HealthControls";

export const dynamic = "force-dynamic";

const SEVERITY_META = {
  critical: { icon: AlertOctagon, tone: "danger", label: "דחוף", cls: "border-rose-200 dark:border-rose-500/30" },
  warning: { icon: AlertTriangle, tone: "warn", label: "אזהרה", cls: "border-amber-200 dark:border-amber-500/30" },
  info: { icon: Info, tone: "info", label: "מידע", cls: "border-border" },
} as const;

const DEPLOY_STATE: Record<DeploymentSummary["state"], { label: string; tone: "success" | "danger" | "warn" | "neutral" }> = {
  READY: { label: "עלה", tone: "success" },
  ERROR: { label: "נכשל", tone: "danger" },
  BUILDING: { label: "בונה", tone: "warn" },
  QUEUED: { label: "בתור", tone: "neutral" },
  INITIALIZING: { label: "מאתחל", tone: "warn" },
  CANCELED: { label: "בוטל", tone: "neutral" },
};

function fmt(d: Date | string | number) {
  return new Date(d).toLocaleString("he-IL", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });
}

function serviceName(id: string) {
  return id === "site" ? "האתר" : (SERVICE_BY_ID[id as ServiceId]?.name ?? id);
}

export default async function HealthPage() {
  await connection();

  let run = await getLatestRun().catch(() => null);
  // First visit ever (or tables just created): run the checks right away so the
  // page has something to show.
  if (!run) {
    try {
      const fresh = await runAndStore("manual");
      run = { ranAt: fresh.ranAt, trigger: "manual", results: fresh.results };
    } catch {
      run = null;
    }
  }

  const [open, resolved, accounts] = await Promise.all([
    listOpenAlerts().catch(() => [] as AlertRow[]),
    listResolvedAlerts(15).catch(() => [] as AlertRow[]),
    db.select().from(serviceAccounts).catch(() => []),
  ]);

  const results: CheckResult[] = run?.results ?? [];
  const byId = Object.fromEntries(results.map((r) => [r.id, r]));
  const activeOpen = open.filter((a) => a.severity !== "info");
  const critical = activeOpen.filter((a) => a.severity === "critical").length;
  const warnings = activeOpen.filter((a) => a.severity === "warning").length;

  const deployments = (byId["vercel-deployments"]?.data?.deployments as DeploymentSummary[] | undefined) ?? [];
  const commits =
    (byId["github"]?.data?.commits as
      | { sha: string; message: string; author: string; date: string; url: string; deployed: boolean | null }[]
      | undefined) ?? [];
  const domainExpiry = byId["domain-expiry"]?.data?.expiresAt as string | undefined;

  const accountRows: ServiceAccountRow[] = SERVICES.filter((s) => s.billable).map((s) => {
    const a = accounts.find((x) => x.serviceId === s.id);
    return {
      serviceId: s.id,
      name: s.name,
      defaultPlan: s.defaultPlan,
      dashboardUrl: s.dashboardUrl,
      plan: a?.plan ?? null,
      monthlyCost: a?.monthlyCost ?? null,
      renewalDate: a?.renewalDate ?? null,
      daysLeft: a?.renewalDate ? daysUntil(new Date(`${a.renewalDate}T00:00:00`)) : null,
      remindDaysBefore: a?.remindDaysBefore ?? 14,
      accountHint: a?.accountHint ?? null,
      notes: a?.notes ?? null,
      autoRenewalNote:
        s.id === "namecheap" && domainExpiry
          ? `הדומיין בתוקף עד ${new Date(domainExpiry).toLocaleDateString("he-IL")} (נבדק אוטומטית)`
          : null,
    };
  });

  return (
    <div className="max-w-6xl">
      <PageHeader
        icon={<Activity className="h-5 w-5" />}
        title="מצב המערכת"
        description={
          run
            ? `בדיקה אחרונה: ${fmt(run.ranAt)} · בדיקה אוטומטית רצה כל בוקר ב-08:00, ובכל כניסה לפאנל (אם עברו 15 דקות)`
            : "עוד לא בוצעה בדיקה"
        }
        actions={<RunChecksButton />}
      />

      {/* Summary */}
      {!run ? (
        <Banner tone="warn" icon={<AlertTriangle className="h-5 w-5" />} title="לא ניתן להריץ בדיקות">
          בדוק שמסד הנתונים מחובר ושהטבלאות החדשות נוצרו.
        </Banner>
      ) : critical ? (
        <Banner tone="danger" icon={<AlertOctagon className="h-5 w-5" />} title={`${critical} תקלות דחופות${warnings ? ` ו-${warnings} אזהרות` : ""}`}>
          הבעיות מפורטות למטה, כל אחת עם הסבר מה לעשות.
        </Banner>
      ) : warnings ? (
        <Banner tone="warn" icon={<AlertTriangle className="h-5 w-5" />} title={`${warnings} דברים דורשים תשומת לב`}>
          האתר עובד, אבל כדאי לטפל בנקודות הבאות.
        </Banner>
      ) : (
        <Banner tone="success" icon={<CheckCircle2 className="h-5 w-5" />} title="הכל תקין">
          כל {results.length} הבדיקות עברו בהצלחה.
        </Banner>
      )}

      {/* Open alerts */}
      {open.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-sm font-bold text-text">התראות פתוחות</h2>
          {open.map((a) => {
            const meta = SEVERITY_META[a.severity as keyof typeof SEVERITY_META] ?? SEVERITY_META.info;
            const Icon = meta.icon;
            return (
              <div
                key={a.id}
                className={clsx("rounded-2xl border bg-surface p-4", meta.cls, a.acknowledgedAt && "opacity-70")}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <Icon
                    className={clsx(
                      "mt-0.5 h-5 w-5 shrink-0",
                      a.severity === "critical" ? "text-rose-600" : a.severity === "warning" ? "text-amber-500" : "text-sky-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-text">{a.title}</span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {a.acknowledgedAt && <Badge>סומן כנראה</Badge>}
                    </div>
                    {a.detail && <p className="mt-1 text-sm text-text-muted">{a.detail}</p>}
                    {a.actionHint && (
                      <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-text">
                        <b>מה לעשות: </b>
                        {a.actionHint}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-text-subtle">
                      <span>{serviceName(byId[a.source]?.serviceId ?? a.source)}</span>
                      <span>מאז {fmt(a.firstSeenAt)}</span>
                      {a.link &&
                        (a.link.startsWith("/") ? (
                          <Link href={a.link} prefetch={false} className="font-semibold text-primary-700 hover:underline dark:text-primary-200">
                            פתח ←
                          </Link>
                        ) : (
                          <a
                            href={a.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline dark:text-primary-200"
                          >
                            פתח <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                    </div>
                  </div>
                  {!a.acknowledgedAt && a.severity !== "info" && <AckButton id={a.id} />}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Checks grid */}
      {results.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold text-text">כל הבדיקות</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center gap-2">
                  <StatusDot status={r.status as Status} />
                  <span className="text-sm font-bold text-text">{r.label}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{r.summary}</p>
                <div className="mt-2 text-[10px] text-text-subtle">
                  {serviceName(r.serviceId)} · {(r.durationMs / 1000).toFixed(1)} שנ׳
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Deployments + commits */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card
          title="עדכוני האתר (דיפלויים)"
          icon={<Rocket className="h-4 w-4 text-primary-500" />}
          description="כל שינוי בקוד או בתוכן מ-GitHub בונה גרסה חדשה של האתר"
          actions={
            <a
              href="https://vercel.com/yom-tov/yomtov-web/deployments"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200"
            >
              Vercel ←
            </a>
          }
        >
          {deployments.length ? (
            <ol className="space-y-1.5">
              {deployments.slice(0, 12).map((d) => {
                const st = DEPLOY_STATE[d.state] ?? DEPLOY_STATE.QUEUED;
                return (
                  <li key={d.id}>
                    <a
                      href={d.inspectorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                    >
                      <Badge tone={st.tone} className="w-12 justify-center">
                        {st.label}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-xs text-text" title={d.commitMessage}>
                        {d.commitMessage || d.url}
                      </span>
                      <span className="shrink-0 text-[10px] text-text-subtle">{fmt(d.createdAt)}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-xs text-text-subtle">אין נתונים (בדוק את VERCEL_TOKEN).</p>
          )}
        </Card>

        <Card
          title="שינויים אחרונים (GitHub)"
          icon={<GitCommit className="h-4 w-4 text-primary-500" />}
          description="היסטוריית השינויים בקוד ובתוכן"
          actions={
            byId["github"]?.data?.repoUrl ? (
              <a
                href={`${byId["github"].data.repoUrl as string}/commits`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200"
              >
                GitHub ←
              </a>
            ) : undefined
          }
        >
          {commits.length ? (
            <ol className="space-y-1.5">
              {commits.slice(0, 12).map((c) => (
                <li key={c.sha}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                  >
                    {c.deployed === null ? (
                      <Badge className="w-14 justify-center">?</Badge>
                    ) : c.deployed ? (
                      <Badge tone="success" className="w-14 justify-center">
                        באתר
                      </Badge>
                    ) : (
                      <Badge tone="warn" className="w-14 justify-center">
                        לא עלה
                      </Badge>
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs text-text" title={c.message}>
                      {c.message}
                    </span>
                    <span className="shrink-0 text-[10px] text-text-subtle">{fmt(c.date)}</span>
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-text-subtle">אין נתונים (בדוק את GITHUB_TOKEN).</p>
          )}
        </Card>
      </section>

      {/* Renewals */}
      <section className="mt-8">
        <Card
          title="מנויים וחידושים"
          icon={<Wallet className="h-4 w-4 text-primary-500" />}
          description="הזן תאריך חידוש / חיוב לכל שירות בתשלום — תקבל התראה (ומייל) לפני המועד."
          actions={<SendTestEmailButton />}
        >
          <div className="space-y-2">
            {accountRows.map((row) => (
              <ServiceAccountEditor key={row.serviceId} row={row} />
            ))}
          </div>
        </Card>
      </section>

      {/* History */}
      {resolved.length > 0 && (
        <section className="mt-8">
          <details className="group rounded-2xl border border-border bg-surface p-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-text">
              <History className="h-4 w-4 text-text-subtle" />
              היסטוריה — בעיות שנפתרו ({resolved.length})
            </summary>
            <ul className="mt-3 divide-y divide-border">
              {resolved.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 py-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="min-w-0 flex-1 text-text">{a.title}</span>
                  <span className="text-text-subtle">
                    {fmt(a.firstSeenAt)} ← נפתר {a.resolvedAt ? fmt(a.resolvedAt) : ""}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}
