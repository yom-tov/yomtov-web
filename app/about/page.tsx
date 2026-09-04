import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { counts } from "@/lib/content";

export const metadata: Metadata = {
  title: "אודות",
  description: "אודות פלטפורמת הלימוד יומטוב.",
};

export default function AboutPage() {
  const c = counts();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "ראשי", href: "/" }, { label: "אודות" }]} />
      <div className="mt-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">
          אודות יומטוב
        </h1>
        <div className="mt-6 space-y-4 text-base leading-7 text-text-muted">
          <p>
            <strong className="text-text">יומטוב</strong> — פלטפורמה חינמית לסטודנטים
            ללימודי חשמל, אלקטרוניקה תקבילית ואלקטרוניקה ספרתית. המאגר מרכז
            מבחני מה&quot;ט, מבחני משרד החינוך, מטלות, מעבדות ומחשבונים.
          </p>
          <p>
            הגרסה החדשה שוקמה מחדש מאתר הלימוד המקורי{" "}
            <a
              href="https://www.e-tv.site"
              target="_blank"
              rel="noopener"
              className="prose-link"
            >
              e-tv.site
            </a>{" "}
            עם ממשק, ארכיטקטורת מידע וחיפוש מודרניים — תוך שמירה מלאה על התוכן
            והנכסים.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <Stat label='מבחני מה"ט' value={c.mahatExams} />
            <Stat label="מבחני משרד החינוך" value={c.ministryExams} />
            <Stat label="מטלות ותרגולים" value={c.assignments} />
            <Stat label="תחומי לימוד" value={c.subjects} />
          </ul>
          <p className="mt-8">
            שאלה, טעות במאגר או תרומת תוכן?{" "}
            <Link href="/search" className="prose-link">
              התחל בחיפוש
            </Link>{" "}
            או צור קשר עם בעל האתר.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-xs text-text-subtle">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-primary-700 num">
        {value}
      </div>
    </li>
  );
}
