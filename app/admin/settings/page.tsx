import { CheckCircle2, XCircle, ExternalLink, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

interface Row { label: string; ok: boolean; hint?: string; }

export default async function AdminSettingsPage() {
  const rows: Row[] = [
    { label: "ADMIN_PASSWORD_HASH", ok: !!process.env.ADMIN_PASSWORD_HASH, hint: "bcrypt hash של הסיסמה" },
    { label: "SESSION_SECRET", ok: (process.env.SESSION_SECRET?.length ?? 0) >= 32, hint: "לפחות 32 תווים" },
    { label: "GITHUB_TOKEN", ok: !!process.env.GITHUB_TOKEN, hint: "fine-grained PAT עם Contents:write" },
    { label: "GITHUB_REPO_OWNER", ok: !!process.env.GITHUB_REPO_OWNER, hint: "yom-tov" },
    { label: "GITHUB_REPO_NAME", ok: !!process.env.GITHUB_REPO_NAME, hint: "yomtov-web" },
    { label: "GITHUB_BRANCH", ok: !!process.env.GITHUB_BRANCH, hint: "main (ברירת מחדל)" },
    { label: "VERCEL_TOKEN", ok: !!process.env.VERCEL_TOKEN, hint: "לסטטוס דפלוי" },
    { label: "VERCEL_PROJECT_ID", ok: !!process.env.VERCEL_PROJECT_ID },
    { label: "VERCEL_TEAM_ID", ok: !!process.env.VERCEL_TEAM_ID },
    { label: "BLOB_READ_WRITE_TOKEN", ok: !!process.env.BLOB_READ_WRITE_TOKEN, hint: "מתחבר אוטומטית עם Blob store" },
  ];

  const allOk = rows.every((r) => r.ok);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">הגדרות</h1>
        <p className="mt-1 text-sm text-text-muted">מצב משתני הסביבה של פאנל האדמין.</p>
      </div>

      <div className={`rounded-2xl border p-4 ${allOk ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}>
        <div className={`inline-flex items-center gap-2 text-sm font-semibold ${allOk ? "text-emerald-800" : "text-amber-800"}`}>
          {allOk ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {allOk ? "כל משתני הסביבה מוגדרים" : "חסרים משתני סביבה"}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60 text-right">
            <tr>
              <th className="px-3 py-2 text-xs font-bold text-text-muted">משתנה</th>
              <th className="px-3 py-2 text-xs font-bold text-text-muted">סטטוס</th>
              <th className="px-3 py-2 text-xs font-bold text-text-muted">הערה</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-border">
                <td className="px-3 py-2.5 font-mono text-xs">{r.label}</td>
                <td className="px-3 py-2.5">
                  {r.ok ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> מוגדר
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                      <XCircle className="h-3.5 w-3.5" /> חסר
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs text-text-muted">{r.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-text">
          <KeyRound className="h-4 w-4" /> שינוי סיסמה
        </div>
        <ol className="mt-3 list-decimal space-y-1.5 pr-5 text-sm text-text-muted">
          <li>מקומית: <code className="font-mono text-xs">node scripts/hash-password.mjs &quot;NEW_PASSWORD&quot;</code></li>
          <li>העתק את ה־hash שיודפס.</li>
          <li>ב־Vercel Dashboard: Project Settings → Environment Variables → <code className="font-mono">ADMIN_PASSWORD_HASH</code> → הדבק והחלף.</li>
          <li>Redeploy (או Trigger Redeploy) כדי שהערך יקח.</li>
        </ol>
        <a
          href="https://vercel.com/yom-tov/yomtov-web/settings/environment-variables"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900"
        >
          פתח ב־Vercel Dashboard <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
