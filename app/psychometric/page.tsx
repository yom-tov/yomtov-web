import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import type { Metadata } from "next";
import { getSection } from "@/lib/site-content";
import { getCollection } from "@/lib/site-content/youtube";

export const metadata: Metadata = {
  title: "הכנה לפסיכומטרי/פסיכוטכני",
  description:
    "סרטון הכנה מקיף לפסיכומטרי ופסיכוטכני — הקבלות מילוליות, סדרות, חשבון, סדרות צורניות, אוצר מילים, הגיון והבנה טכנית.",
};

export default async function PsychometricPage() {
  const [t, videos] = await Promise.all([getSection("psychometric.page"), getCollection("psychometric")]);
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
        <h1 className="mt-3 text-3xl font-extrabold text-text sm:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-3xl text-base text-text-muted">{t.text}</p>
      </header>

      {videos.map((v) => (
        <section key={v.id} className="mt-10">
          <h2 className="text-xl font-extrabold text-text">{v.title}</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border shadow-lg">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${v.youtubeId}`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      ))}

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
