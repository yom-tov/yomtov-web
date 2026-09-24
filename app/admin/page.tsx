import { connection } from "next/server";
import Link from "next/link";
import {
  FileText, NotebookPen, Beaker, Palette, ExternalLink, GitCommit,
  Users, Video, Eye, Play, TrendingUp, Clock, AlertTriangle,
} from "lucide-react";
import { readExams, readAssignments, readLabs, readSubjects } from "@/lib/admin/content-io";
import { recentCommits, REPO_INFO } from "@/lib/admin/github";
import { db } from "@/lib/db";
import {
  users, userPurchases, videoProgress, userActivity,
  contentPackages, videos, packageVideos,
} from "@/lib/db/schema";
import { sql, eq, and, gte, or, isNull, gt, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await connection();
  const [{ data: exams }, { data: assignments }, { data: labs }, { data: subjects }] =
    await Promise.all([readExams(), readAssignments(), readLabs(), readSubjects()]);

  let commits: Awaited<ReturnType<typeof recentCommits>> = [];
  let commitsError: string | null = null;
  try {
    commits = await recentCommits(8);
  } catch (e) {
    commitsError = (e as Error).message;
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [aggregates] = await db
    .select({
      totalUsers: sql<number>`(SELECT COUNT(*)::int FROM ${users})`,
      verifiedUsers: sql<number>`(SELECT COUNT(*)::int FROM ${users} WHERE ${users.emailVerified} = true)`,
      activeSubscriptions: sql<number>`(
        SELECT COUNT(*)::int FROM ${userPurchases}
        WHERE ${userPurchases.status} = 'active'
        AND (${userPurchases.expiresAt} IS NULL OR ${userPurchases.expiresAt} > NOW())
      )`,
      totalVideoViews: sql<number>`(SELECT COUNT(*)::int FROM ${videoProgress})`,
      totalPromoViews: sql<number>`(
        SELECT COUNT(*)::int FROM ${userActivity}
        WHERE ${userActivity.eventType} = 'promo_view'
      )`,
      loginsThisWeek: sql<number>`(
        SELECT COUNT(*)::int FROM ${userActivity}
        WHERE ${userActivity.eventType} = 'login'
        AND ${userActivity.createdAt} >= ${weekAgo}
      )`,
      newUsersThisWeek: sql<number>`(
        SELECT COUNT(*)::int FROM ${users}
        WHERE ${users.createdAt} >= ${weekAgo}
      )`,
      newUsersThisMonth: sql<number>`(
        SELECT COUNT(*)::int FROM ${users}
        WHERE ${users.createdAt} >= ${monthAgo}
      )`,
      videoStartsThisWeek: sql<number>`(
        SELECT COUNT(*)::int FROM ${userActivity}
        WHERE ${userActivity.eventType} = 'video_start'
        AND ${userActivity.createdAt} >= ${weekAgo}
      )`,
    })
    .from(sql`(SELECT 1) AS _`);

  const mostWatchedVideos = await db
    .select({
      videoId: videoProgress.videoId,
      videoTitle: videos.title,
      viewerCount: sql<number>`COUNT(DISTINCT ${videoProgress.userId})::int`,
    })
    .from(videoProgress)
    .innerJoin(videos, eq(videoProgress.videoId, videos.id))
    .groupBy(videoProgress.videoId, videos.title)
    .orderBy(sql`COUNT(DISTINCT ${videoProgress.userId}) DESC`)
    .limit(5);

  const inactiveUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .innerJoin(userPurchases, eq(users.id, userPurchases.userId))
    .where(
      and(
        eq(userPurchases.status, "active"),
        or(isNull(userPurchases.expiresAt), gt(userPurchases.expiresAt, now)),
        sql`NOT EXISTS (
          SELECT 1 FROM ${userActivity}
          WHERE ${userActivity.userId} = ${users.id}
          AND ${userActivity.createdAt} >= ${weekAgo}
        )`,
        sql`NOT EXISTS (
          SELECT 1 FROM ${videoProgress}
          WHERE ${videoProgress.userId} = ${users.id}
          AND ${videoProgress.updatedAt} >= ${weekAgo}
        )`,
      ),
    )
    .groupBy(users.id, users.firstName, users.lastName, users.email)
    .limit(10);

  const funnelPromoViewers = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${userActivity.userId})::int`,
    })
    .from(userActivity)
    .where(eq(userActivity.eventType, "promo_view"));

  const funnelPurchasers = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${userPurchases.userId})::int`,
    })
    .from(userPurchases)
    .where(eq(userPurchases.status, "active"));

  const funnelWatchers = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${videoProgress.userId})::int`,
    })
    .from(videoProgress);

  const contentStats = [
    { label: "מבחנים", value: exams.length, href: "/admin/exams", icon: FileText, tone: "primary" },
    { label: "מטלות", value: assignments.length, href: "/admin/assignments", icon: NotebookPen, tone: "fuchsia" },
    { label: "מעבדות", value: labs.length, href: "/admin/labs", icon: Beaker, tone: "emerald" },
    { label: "קטגוריות", value: subjects.length, href: "/admin/subjects", icon: Palette, tone: "amber" },
  ] as const;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-extrabold text-text sm:text-3xl">שלום</h1>
      <p className="mt-1 text-sm text-text-muted">
        לוח הבקרה של אבי יומטוביאן
      </p>

      {/* User & engagement stats */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashCard
          icon={<Users className="h-5 w-5 text-primary-600" />}
          value={aggregates.totalUsers}
          label="משתמשים רשומים"
          sub={`+${aggregates.newUsersThisWeek} השבוע`}
          href="/admin/users"
        />
        <DashCard
          icon={<Play className="h-5 w-5 text-emerald-600" />}
          value={aggregates.totalVideoViews}
          label="סרטונים שנצפו"
          sub={`${aggregates.videoStartsThisWeek} צפיות השבוע`}
        />
        <DashCard
          icon={<Eye className="h-5 w-5 text-fuchsia-600" />}
          value={aggregates.totalPromoViews}
          label="צפיות פרומו"
        />
        <DashCard
          icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
          value={aggregates.activeSubscriptions}
          label="מנויים פעילים"
          sub={`${aggregates.loginsThisWeek} כניסות השבוע`}
        />
      </section>

      {/* Funnel */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold text-text">Funnel — מהפרומו לצפייה</h2>
        <div className="mt-4 flex items-end gap-3">
          <FunnelStep
            label="צפו בפרומו"
            value={funnelPromoViewers[0]?.count ?? 0}
            total={aggregates.totalUsers}
            color="bg-fuchsia-500"
          />
          <FunnelArrow />
          <FunnelStep
            label="רכשו חבילה"
            value={funnelPurchasers[0]?.count ?? 0}
            total={aggregates.totalUsers}
            color="bg-amber-500"
          />
          <FunnelArrow />
          <FunnelStep
            label="צפו בסרטון"
            value={funnelWatchers[0]?.count ?? 0}
            total={aggregates.totalUsers}
            color="bg-emerald-500"
          />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Most watched */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold text-text">
            <Video className="inline h-4 w-4 text-primary-500" /> סרטונים הכי נצפים
          </h2>
          {mostWatchedVideos.length > 0 ? (
            <div className="mt-3 space-y-2">
              {mostWatchedVideos.map((v, i) => (
                <div key={v.videoId} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2/50">
                  <span className="num text-xs font-bold text-text-subtle w-5 text-center">{i + 1}</span>
                  <span className="flex-1 truncate text-xs font-medium text-text">{v.videoTitle}</span>
                  <span className="num text-xs text-text-muted">{v.viewerCount} צופים</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-text-subtle">אין צפיות עדיין.</p>
          )}
        </div>

        {/* Inactive users */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold text-text">
            <AlertTriangle className="inline h-4 w-4 text-amber-500" /> רכשו אבל לא פעילים (שבוע+)
          </h2>
          {inactiveUsers.length > 0 ? (
            <div className="mt-3 space-y-2">
              {inactiveUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2/50"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span className="flex-1 truncate text-xs font-medium text-text">
                    {u.firstName} {u.lastName}
                  </span>
                  <span className="text-[10px] text-text-subtle">{u.email}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-text-subtle">כל המשתמשים הרוכשים פעילים.</p>
          )}
        </div>
      </section>

      {/* Content stats */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {contentStats.map(({ label, value, href, icon: Icon, tone }) => (
          <Link
            key={label}
            href={href}
            className={`group relative overflow-hidden rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
              tone === "primary"
                ? "border-primary-100 bg-primary-50/60"
                : tone === "fuchsia"
                  ? "border-fuchsia-100 bg-fuchsia-50/60"
                  : tone === "emerald"
                    ? "border-emerald-100 bg-emerald-50/60"
                    : "border-amber-100 bg-amber-50/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 opacity-80" />
              <ExternalLink className="h-3.5 w-3.5 text-text-subtle transition-transform group-hover:-translate-x-0.5" />
            </div>
            <div className="mt-3 text-3xl font-extrabold num text-text">{value}</div>
            <div className="text-xs font-semibold text-text-muted">{label}</div>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold text-text">מה עושים כאן?</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>
              <Link href="/admin/exams/new" className="prose-link">
                הוסף מבחן חדש
              </Link>{" "}
              - מעלים PDF, בוחרים שנה/מועד/גרסה, שומרים, ותוך דקה זה בפרודקשן.
            </li>
            <li>
              <Link href="/admin/assignments/new" className="prose-link">
                הוסף מטלה
              </Link>{" "}
              - קובץ אחד או יותר, לפי קטגוריה.
            </li>
            <li>
              <Link href="/admin/subjects" className="prose-link">
                ערוך קטגוריה
              </Link>{" "}
              - כותרת/תיאור/צבע/אייקון.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text">שינויים אחרונים</h2>
            <a
              href={`https://github.com/${REPO_INFO.owner}/${REPO_INFO.repo}/commits/${REPO_INFO.branch}`}
              target="_blank"
              rel="noopener"
              className="text-xs font-semibold text-primary-700 hover:text-primary-900"
            >
              GitHub
            </a>
          </div>
          {commitsError ? (
            <div className="mt-3 text-xs text-rose-700">שגיאה: {commitsError}</div>
          ) : (
            <ul className="mt-3 space-y-2">
              {commits.map((c) => (
                <li key={c.sha}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener"
                    className="flex gap-2 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2"
                  >
                    <GitCommit className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-subtle" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-text" title={c.message}>
                        {c.message}
                      </div>
                      <div className="text-[10px] text-text-subtle">
                        {c.author} · {new Date(c.date).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function DashCard({
  icon, value, label, sub, href,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  sub?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2">{icon}</div>
      <div className="mt-2 text-3xl font-extrabold num text-text">{value}</div>
      <div className="text-xs font-semibold text-text-muted">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] text-text-subtle">{sub}</div>}
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function FunnelStep({
  label, value, total, color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex-1 text-center">
      <div className="text-2xl font-extrabold num text-text">{value}</div>
      <div className="text-xs font-semibold text-text-muted">{label}</div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-0.5 text-[10px] text-text-subtle num">{pct}%</div>
    </div>
  );
}

function FunnelArrow() {
  return (
    <div className="flex h-8 w-6 shrink-0 items-center justify-center text-text-subtle">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
