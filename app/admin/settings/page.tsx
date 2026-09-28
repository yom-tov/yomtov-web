import { connection } from "next/server";
import { Bell, CheckCircle2, ExternalLink, KeyRound, Settings, XCircle } from "lucide-react";
import { SERVICES, isEnvSet } from "@/lib/admin/architecture";
import { getAdminSettings } from "@/lib/admin/admin-settings";
import { Banner, Card, PageHeader } from "@/components/admin/ui/primitives";
import { AlertSettingsForm } from "@/components/admin/AlertSettingsForm";

export const dynamic = "force-dynamic";

const ENV_URL = "https://vercel.com/yom-tov/yomtov-web/settings/environment-variables";

export default async function AdminSettingsPage() {
  await connection();
  const settings = await getAdminSettings();

  const groups = SERVICES.filter((s) => s.envVars.length).map((s) => ({
    service: s,
    vars: s.envVars.map((v) => ({ ...v, ok: isEnvSet(v) })),
  }));
  const missing = groups.flatMap((g) => g.vars.filter((v) => !v.ok));

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader icon={<Settings className="h-5 w-5" />} title="הגדרות" description="התראות, מפתחות סודיים וסיסמת הפאנל." />

      <Card title="מייל התראות" icon={<Bell className="h-4 w-4 text-primary-500" />}>
        <AlertSettingsForm
          alertEmail={settings.alertEmail}
          dailyEmailEnabled={settings.dailyEmailEnabled}
          envFallback={process.env.ADMIN_ALERT_EMAIL ?? null}
        />
      </Card>

      <Card
        title="מפתחות סודיים (משתני סביבה)"
        icon={<KeyRound className="h-4 w-4 text-primary-500" />}
        description="הערכים עצמם שמורים ב-Vercel ולא מוצגים כאן. כאן רואים רק אם כל מפתח קיים."
        actions={
          <a href={ENV_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200">
            לניהול ב-Vercel <ExternalLink className="h-3 w-3" />
          </a>
        }
      >
        {missing.length === 0 ? (
          <Banner tone="success" icon={<CheckCircle2 className="h-5 w-5" />} title="כל המפתחות מוגדרים" />
        ) : (
          <Banner tone="warn" icon={<XCircle className="h-5 w-5" />} title={`חסרים ${missing.length} מפתחות`}>
            אחרי הוספת מפתח ב-Vercel צריך לעשות Redeploy כדי שייכנס לתוקף.
          </Banner>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {groups.map(({ service, vars }) => (
            <div key={service.id} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-text">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: service.color }} />
                {service.name}
              </div>
              <ul className="space-y-1.5">
                {vars.map((v) => (
                  <li key={v.name} className="flex items-start gap-2 text-xs">
                    {v.ok ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="מוגדר" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" aria-label="חסר" />
                    )}
                    <div className="min-w-0">
                      <code className="font-mono text-[11px] text-text" dir="ltr">
                        {v.name}
                      </code>
                      <div className="text-text-subtle">{v.purpose}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card title="שינוי סיסמת הפאנל" icon={<KeyRound className="h-4 w-4 text-primary-500" />}>
        <ol className="list-decimal space-y-1.5 pr-5 text-sm text-text-muted">
          <li>
            במחשב, בתיקיית הפרויקט:{" "}
            <code className="font-mono text-xs" dir="ltr">
              node scripts/hash-password.mjs &quot;הסיסמה-החדשה&quot;
            </code>
          </li>
          <li>מעתיקים את הקוד (hash) שמודפס.</li>
          <li>
            ב-Vercel → Settings → Environment Variables → <code className="font-mono">ADMIN_PASSWORD_HASH</code> → מדביקים ושומרים.
          </li>
          <li>עושים Redeploy כדי שהסיסמה החדשה תיכנס לתוקף.</li>
          <li>
            כדי שגם הפאנל המקומי יעבוד עם אותה סיסמה:{" "}
            <code className="font-mono text-xs" dir="ltr">
              node scripts/set-local-admin-password.mjs &quot;הסיסמה-החדשה&quot;
            </code>
          </li>
        </ol>
        <a
          href={ENV_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200"
        >
          פתח ב-Vercel <ExternalLink className="h-3 w-3" />
        </a>
      </Card>
    </div>
  );
}
