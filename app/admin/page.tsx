import Link from "next/link";
import { FileText, NotebookPen, Beaker, Palette, ExternalLink, GitCommit } from "lucide-react";
import { readExams, readAssignments, readLabs, readSubjects } from "@/lib/admin/content-io";
import { recentCommits, REPO_INFO } from "@/lib/admin/github";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [{ data: exams }, { data: assignments }, { data: labs }, { data: subjects }] =
    await Promise.all([readExams(), readAssignments(), readLabs(), readSubjects()]);

  let commits: Awaited<ReturnType<typeof recentCommits>> = [];
  let commitsError: string | null = null;
  try {
    commits = await recentCommits(8);
  } catch (e) {
    commitsError = (e as Error).message;
  }

  const stats = [
    { label: "מבחנים", value: exams.length, href: "/admin/exams", icon: FileText, tone: "primary" },
    { label: "מטלות", value: assignments.length, href: "/admin/assignments", icon: NotebookPen, tone: "fuchsia" },
    { label: "מעבדות", value: labs.length, href: "/admin/labs", icon: Beaker, tone: "emerald" },
    { label: "קטגוריות", value: subjects.length, href: "/admin/subjects", icon: Palette, tone: "amber" },
  ] as const;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-extrabold text-text sm:text-3xl">שלום 👋</h1>
      <p className="mt-1 text-sm text-text-muted">
        לוח הבקרה של אבי יומטוביאן. כאן מוסיפים, עורכים ומוחקים תוכן.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon, tone }) => (
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
              GitHub ↗
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
