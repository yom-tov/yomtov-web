import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getSubject } from "@/lib/content";
import { getSection } from "@/lib/site-content";
import { getCollection } from "@/lib/site-content/youtube";
import FourierEmbed from "./FourierEmbed";
import MathVideos from "./MathVideos";

export const metadata: Metadata = {
  title: "מתמטיקה",
  description:
    "סרטוני הדרכה קצרים במתמטיקה — טריגונומטריה, חשבון דיפרנציאלי ואינטגרלי, גאומטריה ועוד.",
};

export default async function MathPage() {
  const s = getSubject("math");
  if (!s) notFound(); // hidden in the admin
  const [t, videos] = await Promise.all([getSection("math.page"), getCollection("math")]);

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: "ראשי", href: "/" }, { label: s.hebrewTitle }]}
      />

      <header className="mt-6">
        <div
          className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-br ${s.color} px-3 py-1 text-xs font-semibold text-white shadow-sm`}
        >
          תחום לימוד
        </div>
        <h1 className="mt-3 text-3xl font-extrabold text-text sm:text-4xl">
          {s.hebrewTitle}
        </h1>
        <p className="mt-2 max-w-3xl text-base text-text-muted">
          {s.description}
        </p>
      </header>

      {/* Fourier simulator */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-indigo-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M2 12c0-3 2.5-6 4-6s2.5 3 4 3 2.5-6 4-6 2.5 3 4 3 2.5-6 4-6" />
          </svg>
          <h2 className="text-xl font-bold text-text">{t.fourierTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-text-muted">{t.fourierText}</p>
        <div className="mt-4">
          <FourierEmbed />
        </div>
      </section>

      {/* Video tutorials */}
      <section className="mt-10">
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
        <MathVideos videos={videos} />
      </section>
    </div>
  );
}
