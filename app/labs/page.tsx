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
import LabsClient from "./LabsClient";
import CircuitSimulator from "./CircuitSimulator";

export const metadata: Metadata = {
  title: "מעבדות",
  description:
    "סרטוני הדרכה קצרים וחומרי עזר למעבדות פרקטיות בחשמל ואלקטרוניקה — סקופ, מולטימטר, קוד נגדים, קבלים ועוד.",
};

const guides = [
  {
    title: "הנחיות בטיחות במעבדה",
    description: "13 כללי בטיחות חובה לפני כל עבודה במעבדת חשמל ואלקטרוניקה.",
    href: "/pdfs/labs/safety-guidelines.pdf",
    icon: ShieldCheck,
    gradient: "from-rose-500 to-red-600",
    bgLight: "bg-rose-50 dark:bg-rose-500/10",
    textColor: "text-rose-700 dark:text-rose-300",
    label: "צפה ב-PDF",
    labelIcon: ExternalLink,
  },
  {
    title: "קוד צבעים לנגדים",
    description: "טבלת קוד צבעים מלאה — 4, 5 ו-6 פסים, כולל מכפיל וסבילות.",
    href: "/pdfs/labs/resistor-color-code.pdf",
    icon: Palette,
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50 dark:bg-amber-500/10",
    textColor: "text-amber-700 dark:text-amber-300",
    label: "צפה ב-PDF",
    labelIcon: ExternalLink,
  },
  {
    title: "קבלים וסלילים",
    description:
      "מדריך קריאת ערכים, קודי קבלים, טבלת המרה, וקוד צבעים לסלילים.",
    href: "/pdfs/labs/capacitors-inductors.pdf",
    icon: CircuitBoard,
    gradient: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-500/10",
    textColor: "text-emerald-700 dark:text-emerald-300",
    label: "צפה ב-PDF",
    labelIcon: ExternalLink,
  },
  {
    title: "טבלת קודי קבלים",
    description:
      "טבלת המרה מלאה בין פיקופראד, ננופראד, מיקרופראד וקוד קבלים.",
    href: "/pdfs/labs/capacitor-codes.jpeg",
    icon: Table2,
    gradient: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50 dark:bg-blue-500/10",
    textColor: "text-blue-700 dark:text-blue-300",
    label: "צפה בתמונה",
    labelIcon: ImageIcon,
  },
  {
    title: "מבוא ל-Matlab",
    description: "מדריך מבוא לסביבת Matlab — התקנה, ממשק, פקודות בסיסיות וגרפים.",
    href: "/pdfs/labs/matlab-intro.pdf",
    icon: Code2,
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-500/10",
    textColor: "text-violet-700 dark:text-violet-300",
    label: "צפה ב-PDF",
    labelIcon: ExternalLink,
  },
  {
    title: "התפלגות נורמלית",
    description: "סרטון הדמייה מוחשית של עקומת ההתפלגות הנורמלית (גאוסיאנית).",
    href: "/pdfs/labs/normal-distribution.mp4",
    icon: MonitorPlay,
    gradient: "from-cyan-500 to-sky-600",
    bgLight: "bg-cyan-50 dark:bg-cyan-500/10",
    textColor: "text-cyan-700 dark:text-cyan-300",
    label: "צפה בסרטון",
    labelIcon: ExternalLink,
  },
  {
    title: "סימולטור מעגלים",
    description: "סימולטור מעגלים אינטראקטיבי — בנו, בדקו ולמדו מעגלים בזמן אמת.",
    href: "/simulator",
    icon: Cpu,
    gradient: "from-lime-500 to-green-600",
    bgLight: "bg-lime-50 dark:bg-lime-500/10",
    textColor: "text-lime-700 dark:text-lime-300",
    label: "פתח סימולטור",
    labelIcon: ExternalLink,
  },
];

export default function LabsPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: "ראשי", href: "/" }, { label: "מעבדות" }]}
      />

      <header className="mt-6">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">
          מעבדות
        </h1>
        <p className="mt-2 max-w-2xl text-base text-text-muted">
          חומרי עזר וסרטוני הדרכה קצרים למעבדות פרקטיות בחשמל ואלקטרוניקה.
        </p>
      </header>

      {/* ── Circuit Simulator ── */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-bold text-text">סימולטור מעגלים</h2>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          סימולטור מעגלים אינטראקטיבי — בנו מעגלים, הריצו סימולציה וצפו
          בתוצאות בזמן אמת.
        </p>
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
          <h2 className="text-xl font-bold text-text">חומרי עזר למעבדה</h2>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          מדריכים וטבלאות חיוניות — לחצו כדי לצפות
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guides.map((g) => (
            <Link
              key={g.href}
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
          <h2 className="text-xl font-bold text-text">סרטוני הדרכה</h2>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          סרטוני YouTube Shorts קצרים — סקופ, מולטימטר, מחולל אותות, מגבר שרת
          ועוד. לחצו על סרטון כדי לצפות.
        </p>
        <LabsClient labs={labs} />
      </section>
    </div>
  );
}
