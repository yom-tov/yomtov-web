import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הכנה לפסיכומטרי/פסיכוטכני",
  description:
    "סרטון הכנה מקיף לפסיכומטרי ופסיכוטכני — הקבלות מילוליות, סדרות, חשבון, סדרות צורניות, אוצר מילים, הגיון והבנה טכנית.",
};

const VIDEO_ID = "9o_SrVCz4NY";
const VIDEO_TITLE =
  "פסיכומטרי/פסיכוטכני │הקבלות מילוליות, סדרות, חשבון, סדרות צורניות, אוצר מילים, הגיון, הבנה טכנית│חלק 1.0";

export default function PsychometricPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: "ראשי", href: "/" },
          { label: "פסיכומטרי" },
        ]}
      />

      <header className="mt-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          תחום לימוד
        </div>
        <h1 className="mt-3 text-3xl font-extrabold text-text sm:text-4xl">
          הכנה לפסיכומטרי/פסיכוטכני
        </h1>
        <p className="mt-2 max-w-3xl text-base text-text-muted">
          סרטון הכנה מקיף הכולל הקבלות מילוליות, סדרות, חשבון, סדרות צורניות,
          אוצר מילים, הגיון והבנה טכנית.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-text">{VIDEO_TITLE}</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border shadow-lg">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title={VIDEO_TITLE}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900 dark:text-primary-300 dark:hover:text-white"
        >
          חזרה לדף הבית
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
