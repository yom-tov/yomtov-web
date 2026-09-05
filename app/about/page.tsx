import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { counts } from "@/lib/content";

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
              או פנה ליוצר האתר.
            </p>
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
