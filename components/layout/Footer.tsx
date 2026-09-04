import Link from "next/link";
import Image from "next/image";

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
      <div
        aria-hidden
        className="h-[3px] w-full bg-gradient-to-r from-fuchsia-400 via-indigo-400 via-cyan-400 via-emerald-400 via-amber-400 to-rose-400"
      />
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <Image
                src="/images/mark.png"
                alt=""
                width={40}
                height={40}
                className="h-9 w-9"
              />
              <div className="flex flex-col leading-none">
                <span className="text-base font-extrabold text-primary-900">
                  אבי יומטוביאן
                </span>
                <span className="text-xs font-semibold text-accent-600">
                  פשוט להבין!
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-text-muted">
              מאגר לימוד לסטודנטים ללימודי חשמל ואלקטרוניקה - מבחני מה&quot;ט,
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
        <div className="mt-10 border-t border-border pt-6 text-xs text-text-subtle">
          © {new Date().getFullYear()} אבי יומטוביאן · כל הזכויות שמורות.
        </div>
      </div>
    </footer>
  );
}
