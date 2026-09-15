import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Mail, Crown, Code2, Globe } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { counts } from "@/lib/content";

const CONTACT_EMAIL = "yomtov7.site@gmail.com";

export const metadata: Metadata = {
  title: "אודות",
  description: "אודות פלטפורמת הלימוד של אבי יומטוביאן.",
};

export default function AboutPage() {
  const c = counts();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "ראשי", href: "/" }, { label: "אודות" }]} />
      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <h1 className="text-3xl font-extrabold text-text sm:text-4xl">
            אודות
          </h1>
          <div className="mt-6 space-y-4 text-base leading-7 text-text-muted">
            <p>
              <strong className="text-text">אבי יומטוביאן - פשוט להבין!</strong>{" "}
              פלטפורמה חינמית לסטודנטים ללימודי חשמל, אלקטרוניקה תקבילית
              ואלקטרוניקה ספרתית. המאגר מרכז מבחני מה&quot;ט, מבחני משרד החינוך,
              מטלות, מעבדות ומחשבונים.
            </p>
            <p>
              המטרה: להנגיש חומרי לימוד מקצועיים לסטודנטים בכל שלב הלימודים -
              בממשק מודרני, חיפוש חופשי, פילטרים חכמים וחוויית שימוש מהירה במחשב
              ובנייד.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              <Stat label='מבחני מה"ט' value={c.mahatExams} tone="primary" />
              <Stat label="מבחני משרד החינוך" value={c.ministryExams} tone="accent" />
              <Stat label="מטלות ותרגולים" value={c.assignments} tone="fuchsia" />
              <Stat label="תחומי לימוד" value={c.subjects} tone="emerald" />
            </ul>
            <p className="mt-8">
              שאלה, טעות במאגר או תרומת תוכן?{" "}
              <Link href="/search" className="prose-link">
                התחל בחיפוש
              </Link>{" "}
              או צור קשר ישירות במייל.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary-300 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <Mail className="h-4 w-4" />
              {CONTACT_EMAIL}
            </a>

            <div className="mt-10 overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/80 via-surface to-accent-50/50 shadow-lg shadow-primary-500/5 dark:border-primary-400/20 dark:from-primary-500/10 dark:via-surface dark:to-accent-500/5 dark:shadow-primary-500/10">
              <div className="border-b border-primary-100/60 bg-primary-50/50 px-7 py-4 dark:border-primary-400/15 dark:bg-primary-500/5">
                <h3 className="text-base font-bold text-primary-800 dark:text-primary-200">
                  צוות האתר
                </h3>
              </div>
              <div className="divide-y-2 divide-primary-200 dark:divide-primary-400/30">
                <div className="flex items-center gap-5 px-7 py-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text-subtle">בעלים ומנהל האתר</div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-lg font-bold text-text">אבי יומטוביאן</div>
                      <a
                        href="mailto:yomtov7.site@gmail.com"
                        dir="ltr"
                        className="inline-flex items-center gap-1.5 text-[17px] font-semibold text-primary-600 transition-colors hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                      >
                        <Mail className="h-4.5 w-4.5" />
                        yomtov7.site@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 px-7 py-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text-subtle">פיתוח, עיצוב ובניית האתר</div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-lg font-bold text-text">סער כהן</div>
                      <a
                        href="mailto:saar_cohen@myelectroniclab.com"
                        dir="ltr"
                        className="inline-flex items-center gap-1.5 text-[17px] font-semibold text-accent-600 transition-colors hover:text-accent-800 dark:text-accent-400 dark:hover:text-accent-200"
                      >
                        <Mail className="h-4.5 w-4.5" />
                        saar_cohen@myelectroniclab.com
                      </a>
                    </div>
                    <a
                      href="https://myelectroniclab.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn relative mt-3 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-l from-accent-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-accent-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-500/30 dark:from-accent-500 dark:to-accent-400 dark:shadow-accent-400/20"
                    >
                      <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full" />
                      <Globe className="relative h-4.5 w-4.5" />
                      <span className="relative">בקרו באתר MyElectronicLab.com</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <aside className="md:pt-4">
          <div className="rounded-3xl border border-border bg-surface p-5 text-center">
            <Image
              src="/images/mark.png"
              alt="הסמל של אבי יומטוביאן"
              width={140}
              height={140}
              className="mx-auto h-32 w-32"
            />
            <div className="mt-4 text-sm font-semibold text-text">
              אבי יומטוביאן
            </div>
            <div className="mt-1 text-xs text-accent-600 font-medium">
              פשוט להבין!
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const TONES = {
  primary:
    "border-primary-100 bg-primary-50/70 text-primary-800 dark:border-primary-400/25 dark:bg-primary-500/10 dark:text-primary-200",
  accent:
    "border-cyan-100 bg-cyan-50/70 text-cyan-800 dark:border-cyan-400/25 dark:bg-cyan-500/10 dark:text-cyan-200",
  fuchsia:
    "border-fuchsia-100 bg-fuchsia-50/70 text-fuchsia-800 dark:border-fuchsia-400/25 dark:bg-fuchsia-500/10 dark:text-fuchsia-200",
  emerald:
    "border-emerald-100 bg-emerald-50/70 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200",
} as const;

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONES;
}) {
  return (
    <li className={`rounded-2xl border p-4 ${TONES[tone]}`}>
      <div className="text-xs">{label}</div>
      <div className="mt-1 text-2xl font-extrabold num">{value}</div>
    </li>
  );
}
