import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Palette,
  CircuitBoard,
  Table2,
  FileText,
  ExternalLink,
  ImageIcon,
  MonitorPlay,
  Code2,
  Cpu,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { labs } from "@/lib/content";
import { getAssetUrl } from "@/lib/pdf-url";
import { getSection, visible } from "@/lib/site-content";
import LabsClient from "./LabsClient";
import CircuitSimulator from "./CircuitSimulator";

export const metadata: Metadata = {
  title: "מעבדות",
  description:
    "סרטוני הדרכה קצרים וחומרי עזר למעבדות פרקטיות בחשמל ואלקטרוניקה — סקופ, מולטימטר, קוד נגדים, קבלים ועוד.",
};

// Look of each guide card, by position. Texts and links come from the admin
// ("טקסטים ודפים" → מעבדות).
const GUIDE_STYLES = [
  { icon: ShieldCheck, gradient: "from-rose-500 to-red-600", bgLight: "bg-rose-50 dark:bg-rose-500/10", textColor: "text-rose-700 dark:text-rose-300" },
  { icon: Palette, gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 dark:bg-amber-500/10", textColor: "text-amber-700 dark:text-amber-300" },
  { icon: CircuitBoard, gradient: "from-emerald-500 to-teal-500", bgLight: "bg-emerald-50 dark:bg-emerald-500/10", textColor: "text-emerald-700 dark:text-emerald-300" },
  { icon: Table2, gradient: "from-blue-500 to-indigo-500", bgLight: "bg-blue-50 dark:bg-blue-500/10", textColor: "text-blue-700 dark:text-blue-300" },
  { icon: Code2, gradient: "from-violet-500 to-purple-600", bgLight: "bg-violet-50 dark:bg-violet-500/10", textColor: "text-violet-700 dark:text-violet-300" },
  { icon: MonitorPlay, gradient: "from-cyan-500 to-sky-600", bgLight: "bg-cyan-50 dark:bg-cyan-500/10", textColor: "text-cyan-700 dark:text-cyan-300" },
  { icon: Cpu, gradient: "from-lime-500 to-green-600", bgLight: "bg-lime-50 dark:bg-lime-500/10", textColor: "text-lime-700 dark:text-lime-300" },
];


export default async function LabsPage() {
  const t = await getSection("labs.guides");
  const guides = visible(t.guides).map((g, i) => ({
    ...g,
    ...GUIDE_STYLES[i % GUIDE_STYLES.length],
    href: getAssetUrl(g.href),
    labelIcon: /.(jpe?g|png|webp)$/i.test(g.href) ? ImageIcon : ExternalLink,
  }));
  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: "ראשי", href: "/" }, { label: "מעבדות" }]}
      />

      <header className="mt-6">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">{t.pageTitle}</h1>
        <p className="mt-2 max-w-2xl text-base text-text-muted">{t.pageText}</p>
      </header>

      {/* ── Circuit Simulator ── */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-bold text-text">{t.simulatorTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-text-muted">{t.simulatorText}</p>
        <div className="mt-4">
          <CircuitSimulator />
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="mt-10 border-t border-border" />

      {/* ── Reference Materials ── */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-bold text-text">{t.guidesTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-text-muted">{t.guidesText}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guides.map((g, i) => (
            <Link
              key={i}
              href={g.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-primary-200"
            >
              {/* Gradient halo */}
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-gradient-to-br ${g.gradient} opacity-15 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-35`}
              />

              <div className="relative">
                <div
                  className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${g.gradient} text-white shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}
                >
                  <g.icon className="h-5 w-5" />
                </div>

                <h3 className="font-bold text-text leading-snug">
                  {g.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                  {g.description}
                </p>

                <div
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-lg ${g.bgLight} px-3 py-1.5 text-xs font-semibold ${g.textColor} transition-colors`}
                >
                  <span>{g.label}</span>
                  <g.labelIcon className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="mt-10 border-t border-border" />

      {/* ── Video Tutorials ── */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-red-500"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
            <path d="m9.545 15.568 6.273-3.568-6.273-3.568v7.136z" fill="white" />
          </svg>
          <h2 className="text-xl font-bold text-text">{t.videosTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-text-muted">{t.videosText}</p>
        <LabsClient labs={labs} />
      </section>
    </div>
  );
}
