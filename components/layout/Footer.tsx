import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

const CONTACT_EMAIL = "yomtov7@gmail.com";

const SOCIALS = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/@yomtov7",
    style: "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 dark:hover:text-rose-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
        <path d="m9.545 15.568 6.273-3.568-6.273-3.568v7.136z" fill="white" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@avi_yomtovian",
    style: "bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 hover:text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:hover:bg-fuchsia-500/20 dark:hover:text-fuchsia-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.18z" />
      </svg>
    ),
  },
  {
    label: "אימייל",
    href: `mailto:${CONTACT_EMAIL}`,
    style: "bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20 dark:hover:text-sky-300",
    icon: <Mail className="h-6 w-6" />,
  },
];

const SECTIONS = [
  {
    title: "תחומי לימוד",
    links: [
      { href: "/electricity", label: "חשמל" },
      { href: "/analog", label: "אלקטרוניקה תקבילית" },
      { href: "/digital", label: "אלקטרוניקה ספרתית" },
      { href: "/psychometric", label: "פסיכומטרי" },
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
      { href: "/accessibility", label: "הצהרת נגישות" },
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
                <span className="text-base font-extrabold text-primary-900 dark:text-white">
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
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith("mailto") ? undefined : "_blank"}
                  rel={s.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                  aria-label={s.label}
                  className={`grid h-12 w-12 place-items-center rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${s.style}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="text-sm font-semibold text-text">{s.title}</div>
              <ul className="mt-3 space-y-2">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-text-muted transition-colors hover:text-primary-700 dark:hover:text-primary-300"
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
