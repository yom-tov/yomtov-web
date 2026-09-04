import Link from "next/link";

const SECTIONS = [
  {
    title: "תחומי לימוד",
    links: [
      { href: "/electricity", label: "חשמל" },
      { href: "/analog", label: "אלקטרוניקה תקבילית" },
      { href: "/digital", label: "אלקטרוניקה ספרתית" },
    ],
  },
  {
    title: "כלים",
    links: [
      { href: "/labs", label: "מעבדות" },
      { href: "/calculator", label: "מחשבון" },
      { href: "/exams", label: "כל המבחנים" },
    ],
  },
  {
    title: "מידע",
    links: [
      { href: "/search", label: "חיפוש" },
      { href: "/about", label: "אודות" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="text-lg font-extrabold text-primary-900">יומטוב</div>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              פלטפורמת לימוד מקצועית לסטודנטים ללימודי חשמל ואלקטרוניקה — מבחני מה&quot;ט,
              מבחני משרד החינוך, מטלות, מעבדות ומחשבונים.
            </p>
          </div>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="text-sm font-semibold text-text">{s.title}</div>
              <ul className="mt-3 space-y-2">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-text-muted transition-colors hover:text-primary-700"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-text-subtle sm:flex-row">
          <div>
            © {new Date().getFullYear()} יומטוב · כל הזכויות שמורות.
          </div>
          <div>
            עיצוב וממשק חדשים — התוכן מקורו באתר הלימוד המקורי.
          </div>
        </div>
      </div>
    </footer>
  );
}
