import { connection } from "next/server";
import Link from "next/link";
import { CheckCircle2, Clock, KeyRound, Lightbulb, Network, Wallet, XCircle, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { serviceAccounts } from "@/lib/db/schema";
import { getLatestRun } from "@/lib/admin/health/store";
import type { CheckResult } from "@/lib/admin/health/types";
import { CONTENT_LOCATIONS, FLOWS, SERVICES, SERVICE_BY_ID, isEnvSet, type ServiceId } from "@/lib/admin/architecture";
import { Badge, Card, DataTable, PageHeader, THead, Td, Th, Tr, type Status } from "@/components/admin/ui/primitives";
import { ArchitectureDiagram } from "@/components/admin/architecture/ArchitectureDiagram";
import type { DiagramService } from "@/components/admin/architecture/ServicePanel";

export const dynamic = "force-dynamic";

// Worst status across a service's checks (errors first; "unknown" only when
// nothing was actually checked).
function serviceStatus(results: CheckResult[]): { status: Status | null; summary: string | null } {
  if (!results.length) return { status: null, summary: null };
  const pick = (s: Status) => results.find((r) => r.status === s);
  const worst = pick("error") ?? pick("warn") ?? pick("ok") ?? results[0];
  return { status: worst.status as Status, summary: worst.summary };
}

export default async function ArchitecturePage() {
  await connection();
  const [run, accounts] = await Promise.all([
    getLatestRun().catch(() => null),
    db
      .select()
      .from(serviceAccounts)
      .catch(() => [] as (typeof serviceAccounts.$inferSelect)[]),
  ]);
  const results = run?.results ?? [];

  const services: DiagramService[] = SERVICES.map((s) => {
    const st = serviceStatus(results.filter((r) => r.serviceId === s.id));
    const acc = accounts.find((a) => a.serviceId === s.id);
    return {
      ...s,
      status: st.status,
      statusSummary: st.summary,
      plan: acc?.plan ?? s.defaultPlan ?? null,
      cost: acc?.monthlyCost ?? null,
    };
  });

  const billable = services.filter((s) => s.billable);

  return (
    <div className="max-w-6xl">
      <PageHeader
        icon={<Network className="h-5 w-5" />}
        title="ארכיטקטורה — איך האתר בנוי"
        description='האתר הוא לא "דבר אחד": הוא בנוי מכמה שירותים חיצוניים שכל אחד עושה תפקיד אחד ועושה אותו טוב. כאן רואים את כולם, מה כל אחד עושה, ואיך הם עובדים ביחד.'
      />

      {/* Three things to remember */}
      <section className="mb-6 grid gap-3 md:grid-cols-3">
        <Remember
          icon={<Lightbulb className="h-5 w-5" />}
          title="הדומיין = הכתובת"
          text="ב-Namecheap אסור לשנות את ה-Nameservers מ-&quot;Namecheap BasicDNS&quot;. כל שינוי DNS נעשה רק ב-Advanced DNS."
        />
        <Remember
          icon={<Zap className="h-5 w-5" />}
          title="שני סוגי עדכונים"
          text="טקסטים, קורסים וסרטוני YouTube מתעדכנים מיד. מבחנים, מטלות, נוסחאונים ומעבדות — אחרי כדקה (האתר נבנה מחדש)."
        />
        <Remember
          icon={<KeyRound className="h-5 w-5" />}
          title="כל המפתחות ב-Vercel"
          text="הסיסמאות והמפתחות לכל השירותים שמורים ב-Vercel → Settings → Environment Variables. אחרי שינוי שם צריך Redeploy."
        />
      </section>

      <ArchitectureDiagram services={services} flows={FLOWS} />

      {/* Where content lives */}
      <section className="mt-8">
        <Card
          title="איפה נשמר כל סוג תוכן?"
          icon={<Clock className="h-4 w-4 text-primary-500" />}
          description="ולכמה זמן לצפות עד שהשינוי מופיע באתר"
          padded={false}
        >
          <div className="px-5 pb-5">
            <DataTable>
              <THead>
                <Th>סוג התוכן</Th>
                <Th>איפה נשמר</Th>
                <Th>מתי מופיע באתר</Th>
                <Th className="w-24" />
              </THead>
              <tbody>
                {CONTENT_LOCATIONS.map((c) => (
                  <Tr key={c.what}>
                    <Td className="font-semibold text-text">{c.what}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {c.where.map((w) => (
                          <Badge key={w}>{SERVICE_BY_ID[w as ServiceId].name}</Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      {c.speed === "instant" ? (
                        <Badge tone="success">מיידי</Badge>
                      ) : (
                        <Badge tone="warn">כדקה (בנייה מחדש)</Badge>
                      )}
                    </Td>
                    <Td>
                      <Link
                        href={c.admin}
                        prefetch={false}
                        className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200"
                      >
                        לניהול ←
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Costs */}
        <Card
          title="תוכניות ועלויות"
          icon={<Wallet className="h-4 w-4 text-primary-500" />}
          description="מה שהזנת בדף מצב המערכת"
          actions={
            <Link href="/admin/health" prefetch={false} className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200">
              עריכה ←
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {billable.map((s) => {
              const acc = accounts.find((a) => a.serviceId === s.id);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="font-semibold text-text">{s.name}</span>
                  <span className="text-text-muted">{s.plan}</span>
                  <span className="ms-auto flex items-center gap-2 text-xs text-text-subtle">
                    {acc?.monthlyCost && <span>{acc.monthlyCost}</span>}
                    {acc?.renewalDate && (
                      <span>חידוש {new Date(`${acc.renewalDate}T00:00:00`).toLocaleDateString("he-IL")}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Keys */}
        <Card
          title="המפתחות הסודיים"
          icon={<KeyRound className="h-4 w-4 text-primary-500" />}
          description="איזה מפתח שייך לאיזה שירות. הערכים עצמם לא מוצגים כאן אף פעם."
        >
          <div className="space-y-3">
            {SERVICES.filter((s) => s.envVars.length).map((s) => (
              <div key={s.id}>
                <div className="mb-1 text-xs font-bold text-text">{s.name}</div>
                <ul className="space-y-1">
                  {s.envVars.map((v) => {
                    const set = isEnvSet(v);
                    return (
                      <li key={v.name} className="flex items-start gap-2 text-xs">
                        {set ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="מוגדר" />
                        ) : (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" aria-label="חסר" />
                        )}
                        <code className="shrink-0 font-mono text-[11px] text-text" dir="ltr">
                          {v.name}
                        </code>
                        <span className="text-text-muted">— {v.purpose}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Remember({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-primary-600 dark:text-primary-300">
        {icon}
        <span className="text-sm font-bold text-text">{title}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">{text}</p>
    </div>
  );
}
