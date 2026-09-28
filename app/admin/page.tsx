import { connection } from "next/server";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  Beaker,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GitCommit,
  MonitorPlay,
  NotebookPen,
  Package,
  PenLine,
  Play,
  Plus,
  Rocket,
  Sigma,
  TrendingUp,
  Upload,
  Users,
  Video,
} from "lucide-react";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { readIndexedContent, readLabs } from "@/lib/admin/content-io";
import { db } from "@/lib/db";
import { contentPackages, userActivity, userPurchases, users, videoProgress, videos, youtubeVideos } from "@/lib/db/schema";
import { getLatestRun, listOpenAlerts, type AlertRow } from "@/lib/admin/health/store";
import type { CheckResult } from "@/lib/admin/health/types";
import type { DeploymentSummary } from "@/lib/admin/deployments";
import { SERVICES } from "@/lib/admin/architecture";
import { Badge, Banner, Card, StatCard, StatusDot, type Status } from "@/components/admin/ui/primitives";

export const dynamic = "force-dynamic";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const MONTH = 30 * 24 * 60 * 60 * 1000;

function fmt(d: Date | string | number) {
  return new Date(d).toLocaleString("he-IL", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });
}

async function userStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK);
  const monthAgo = new Date(now.getTime() - MONTH);
  const [aggregates] = await db
    .select({
      totalUsers: sql<number>`(SELECT COUNT(*)::int FROM ${users})`,
      activeSubscriptions: sql<number>`(
        SELECT COUNT(*)::int FROM ${userPurchases}
        WHERE ${userPurchases.status} = 'active'
        AND (${userPurchases.expiresAt} IS NULL OR ${userPurchases.expiresAt} > NOW())
      )`,
      totalVideoViews: sql<number>`(SELECT COUNT(*)::int FROM ${videoProgress})`,
      totalPromoViews: sql<number>`(SELECT COUNT(*)::int FROM ${userActivity} WHERE ${userActivity.eventType} = 'promo_view')`,
      loginsThisWeek: sql<number>`(
        SELECT COUNT(*)::int FROM ${userActivity}
        WHERE ${userActivity.eventType} = 'login' AND ${userActivity.createdAt} >= ${weekAgo}
      )`,
      newUsersThisWeek: sql<number>`(SELECT COUNT(*)::int FROM ${users} WHERE ${users.createdAt} >= ${weekAgo})`,
      newUsersThisMonth: sql<number>`(SELECT COUNT(*)::int FROM ${users} WHERE ${users.createdAt} >= ${monthAgo})`,
      videoStartsThisWeek: sql<number>`(
        SELECT COUNT(*)::int FROM ${userActivity}
        WHERE ${userActivity.eventType} = 'video_start' AND ${userActivity.createdAt} >= ${weekAgo}
      )`,
      funnelPromoViewers: sql<number>`(
        SELECT COUNT(DISTINCT ${userActivity.userId})::int FROM ${userActivity} WHERE ${userActivity.eventType} = 'promo_view'
      )`,
      funnelPurchasers: sql<number>`(
        SELECT COUNT(DISTINCT ${userPurchases.userId})::int FROM ${userPurchases} WHERE ${userPurchases.status} = 'active'
      )`,
      funnelWatchers: sql<number>`(SELECT COUNT(DISTINCT ${videoProgress.userId})::int FROM ${videoProgress})`,
      packages: sql<number>`(SELECT COUNT(*)::int FROM ${contentPackages})`,
      publishedPackages: sql<number>`(SELECT COUNT(*)::int FROM ${contentPackages} WHERE ${contentPackages.published} = true)`,
      courseVideos: sql<number>`(SELECT COUNT(*)::int FROM ${videos})`,
      youtube: sql<number>`(SELECT COUNT(*)::int FROM ${youtubeVideos} WHERE ${youtubeVideos.hidden} = false)`,
    })
    .from(sql`(SELECT 1) AS _`);

  const [mostWatched, inactive] = await Promise.all([
    db
      .select({
        videoId: videoProgress.videoId,
        videoTitle: videos.title,
        viewerCount: sql<number>`COUNT(DISTINCT ${videoProgress.userId})::int`,
      })
      .from(videoProgress)
      .innerJoin(videos, eq(videoProgress.videoId, videos.id))
      .groupBy(videoProgress.videoId, videos.title)
      .orderBy(sql`COUNT(DISTINCT ${videoProgress.userId}) DESC`)
      .limit(5),
    db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .innerJoin(userPurchases, eq(users.id, userPurchases.userId))
      .where(
        and(
          eq(userPurchases.status, "active"),
          or(isNull(userPurchases.expiresAt), gt(userPurchases.expiresAt, now)),
          sql`NOT EXISTS (SELECT 1 FROM ${userActivity} WHERE ${userActivity.userId} = ${users.id} AND ${userActivity.createdAt} >= ${weekAgo})`,
          sql`NOT EXISTS (SELECT 1 FROM ${videoProgress} WHERE ${videoProgress.userId} = ${users.id} AND ${videoProgress.updatedAt} >= ${weekAgo})`,
        ),
      )
      .groupBy(users.id, users.firstName, users.lastName, users.email)
      .limit(10),
  ]);
  return { aggregates, mostWatched, inactive };
}

// Content from GitHub (the admin's source of truth, may be newer than the deployed site).
async function contentCounts() {
  try {
    const [{ exams, assignments, formulas }, { data: labs }] = await Promise.all([readIndexedContent(), readLabs()]);
    return { exams: exams.length, assignments: assignments.length, formulas: formulas.length, labs: labs.length, error: null };
  } catch (e) {
    return { exams: 0, assignments: 0, formulas: 0, labs: 0, error: (e as Error).message };
  }
}

export default async function AdminDashboard() {
  await connection();

  const [{ aggregates: a, mostWatched, inactive }, content, run, openAlerts] = await Promise.all([
    userStats(),
    contentCounts(),
    getLatestRun().catch(() => null),
    listOpenAlerts().catch(() => [] as AlertRow[]),
  ]);

  const active = openAlerts.filter((x) => x.severity !== "info" && !x.acknowledgedAt);
  const critical = active.filter((x) => x.severity === "critical");
  const results: CheckResult[] = run?.results ?? [];
  const deployments = (results.find((r) => r.id === "vercel-deployments")?.data?.deployments as DeploymentSummary[] | undefined) ?? [];

  const serviceStatus = SERVICES.filter((s) => results.some((r) => r.serviceId === s.id)).map((s) => {
    const rs = results.filter((r) => r.serviceId === s.id);
    const worst = rs.find((r) => r.status === "error") ?? rs.find((r) => r.status === "warn") ?? rs.find((r) => r.status === "ok") ?? rs[0];
    return { id: s.id, name: s.name, status: worst.status as Status, summary: worst.summary };
  });

  const funnel = [
    { label: "צפו בפרומו", value: a.funnelPromoViewers, color: "bg-fuchsia-500" },
    { label: "רכשו קורס", value: a.funnelPurchasers, color: "bg-amber-500" },
    { label: "צפו בסרטון", value: a.funnelWatchers, color: "bg-emerald-500" },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text sm:text-3xl">שלום 👋</h1>
        <p className="mt-1 text-sm text-text-muted">כל האתר במקום אחד — מצב המערכת, התוכן והתלמידים.</p>
      </div>

      {/* Alerts */}
      {critical.length > 0 ? (
        <Banner
          tone="danger"
          icon={<AlertOctagon className="h-5 w-5" />}
          title={`${critical.length} תקלות דחופות באתר`}
          action={
            <Link href="/admin/health" prefetch={false} className="text-xs font-bold underline">
              לפרטים ←
            </Link>
          }
        >
          {critical.slice(0, 3).map((x) => x.title).join(" · ")}
        </Banner>
      ) : active.length > 0 ? (
        <Banner
          tone="warn"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={`${active.length} דברים דורשים תשומת לב`}
          action={
            <Link href="/admin/health" prefetch={false} className="text-xs font-bold underline">
              לפרטים ←
            </Link>
          }
        >
          {active.slice(0, 3).map((x) => x.title).join(" · ")}
        </Banner>
      ) : run ? (
        <Banner tone="success" icon={<CheckCircle2 className="h-5 w-5" />} title="האתר תקין">
          בדיקה אחרונה: {fmt(run.ranAt)}
        </Banner>
      ) : null}

      {/* Service status strip */}
      {serviceStatus.length > 0 && (
        <Link
          href="/admin/health"
          prefetch={false}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2/40"
        >
          {serviceStatus.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 text-xs text-text" title={s.summary}>
              <StatusDot status={s.status} pulse={false} />
              {s.name}
            </span>
          ))}
        </Link>
      )}

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { href: "/admin/exams/new", label: "מבחן חדש", icon: FileText },
          { href: "/admin/assignments/new", label: "מטלה חדשה", icon: NotebookPen },
          { href: "/admin/formulas/new", label: "נוסחאון חדש", icon: Sigma },
          { href: "/admin/videos/new", label: "העלאת סרטון", icon: Upload },
          { href: "/admin/youtube", label: "סרטון YouTube / Short", icon: MonitorPlay },
          { href: "/admin/site/home", label: "עריכת דף הבית", icon: PenLine },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className="group flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-text transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">{label}</span>
            <Plus className="h-3.5 w-3.5 text-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </section>

      {/* Students */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-primary-600" />}
          value={a.totalUsers}
          label="משתמשים רשומים"
          sub={`+${a.newUsersThisWeek} השבוע · +${a.newUsersThisMonth} החודש`}
          href="/admin/users"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
          value={a.activeSubscriptions}
          label="גישות פעילות לקורסים"
          sub={`${a.loginsThisWeek} כניסות השבוע`}
          href="/admin/users"
        />
        <StatCard
          icon={<Play className="h-5 w-5 text-emerald-600" />}
          value={a.totalVideoViews}
          label="סרטוני קורס שנצפו"
          sub={`${a.videoStartsThisWeek} צפיות השבוע`}
        />
        <StatCard icon={<Eye className="h-5 w-5 text-fuchsia-600" />} value={a.totalPromoViews} label="צפיות בפרומו" />
      </section>

      {/* Content */}
      <Card title="התוכן באתר" description={content.error ? `לא ניתן לקרוא מ-GitHub: ${content.error}` : undefined}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {[
            { label: "מבחנים", value: content.exams, href: "/admin/exams", icon: FileText },
            { label: "מטלות", value: content.assignments, href: "/admin/assignments", icon: NotebookPen },
            { label: "נוסחאונים", value: content.formulas, href: "/admin/formulas", icon: Sigma },
            { label: "מעבדות", value: content.labs, href: "/admin/labs", icon: Beaker },
            { label: "קורסים", value: a.packages, href: "/admin/packages", icon: Package, sub: `${a.publishedPackages} מפורסמים` },
            { label: "סרטוני קורס", value: a.courseVideos, href: "/admin/videos", icon: Video },
            { label: "YouTube", value: a.youtube, href: "/admin/youtube", icon: MonitorPlay },
            { label: "טקסטים", value: "✎", href: "/admin/site", icon: PenLine },
          ].map(({ label, value, href, icon: Icon, sub }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="rounded-xl border border-border p-3 transition-colors hover:border-primary-300 hover:bg-surface-2/40"
            >
              <Icon className="h-4 w-4 text-text-subtle" />
              <div className="num mt-1.5 text-2xl font-extrabold text-text">{value}</div>
              <div className="text-[11px] font-semibold text-text-muted">{label}</div>
              {sub && <div className="text-[10px] text-text-subtle">{sub}</div>}
            </Link>
          ))}
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Card title="מהפרומו לצפייה">
          <div className="flex items-end gap-3">
            {funnel.map((f, i) => {
              const pct = a.totalUsers > 0 ? Math.round((f.value / a.totalUsers) * 100) : 0;
              return (
                <div key={f.label} className="flex flex-1 items-end gap-3">
                  {i > 0 && <span className="pb-6 text-text-subtle">←</span>}
                  <div className="flex-1 text-center">
                    <div className="num text-2xl font-extrabold text-text">{f.value}</div>
                    <div className="text-xs font-semibold text-text-muted">{f.label}</div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${f.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="num mt-0.5 text-[10px] text-text-subtle">{pct}% מהמשתמשים</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Deployments */}
        <Card
          title="עדכונים אחרונים לאתר"
          icon={<Rocket className="h-4 w-4 text-primary-500" />}
          actions={
            <Link href="/admin/health" prefetch={false} className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200">
              הכל ←
            </Link>
          }
        >
          {deployments.length ? (
            <ul className="space-y-1.5">
              {deployments.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-xs">
                  <Badge tone={d.state === "READY" ? "success" : d.state === "ERROR" ? "danger" : "warn"} className="w-12 justify-center">
                    {d.state === "READY" ? "עלה" : d.state === "ERROR" ? "נכשל" : "בונה"}
                  </Badge>
                  <GitCommit className="h-3.5 w-3.5 shrink-0 text-text-subtle" />
                  <span className="min-w-0 flex-1 truncate text-text" title={d.commitMessage}>
                    {d.commitMessage || d.url}
                  </span>
                  <span className="shrink-0 text-[10px] text-text-subtle">{fmt(d.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-subtle">אין נתונים עדיין (מתעדכן בבדיקת המערכת).</p>
          )}
        </Card>

        {/* Most watched */}
        <Card title="סרטוני הקורס הנצפים ביותר" icon={<Video className="h-4 w-4 text-primary-500" />}>
          {mostWatched.length ? (
            <ol className="space-y-1.5">
              {mostWatched.map((v, i) => (
                <li key={v.videoId} className="flex items-center gap-3 text-xs">
                  <span className="num w-5 text-center font-bold text-text-subtle">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-text">{v.videoTitle}</span>
                  <span className="num text-text-muted">{v.viewerCount} צופים</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-text-subtle">אין צפיות עדיין.</p>
          )}
        </Card>

        {/* Inactive buyers */}
        <Card title="רכשו אבל לא נכנסו שבוע" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>
          {inactive.length ? (
            <ul className="space-y-1">
              {inactive.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    prefetch={false}
                    className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-2/50"
                  >
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="min-w-0 flex-1 truncate font-medium text-text">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="text-[10px] text-text-subtle" dir="ltr">
                      {u.email}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-subtle">כל מי שרכש פעיל.</p>
          )}
        </Card>
      </section>
    </div>
  );
}
