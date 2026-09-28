import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AssignmentCard } from "@/components/cards/AssignmentCard";
import { assignmentsFor, getSubject } from "@/lib/content";
import ShortsRow from "./ShortsRow";
import DigitalSimulator from "./DigitalSimulator";
import type { Metadata } from "next";
import { getSection } from "@/lib/site-content";
import { getCollection } from "@/lib/site-content/youtube";

export const metadata: Metadata = {
  title: "אלקטרוניקה ספרתית",
  description:
    "לוגיקה בוליאנית, שערים, מונים, זיכרונות ומעגלים ספרתיים — חומרי לימוד, נוסחאות וסיכומים.",
};

export default async function DigitalPage() {
  const s = getSubject("digital")!;
  const asg = assignmentsFor("digital");
  const [t, [main], shorts] = await Promise.all([
    getSection("digital.page"),
    getCollection("digital-main"),
    getCollection("digital-shorts"),
  ]);

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

      {/* Main video — 70% width */}
      {main && (
        <section className="mt-10">
          <div className="mx-auto w-full max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${main.youtubeId}`}
                  title={main.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Shorts row */}
      {shorts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-extrabold text-text">{t.shortsTitle}</h2>
          <ShortsRow shorts={shorts.map((v) => ({ id: v.youtubeId, title: v.title }))} />
        </section>
      )}

      {/* Circuit Simulator */}
      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-text">{t.simulatorTitle}</h2>
        <p className="mt-1 text-sm text-text-muted">{t.simulatorText}</p>
        <div className="mt-4">
          <DigitalSimulator />
        </div>
      </section>

      {/* Assignments */}
      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-text">{t.assignmentsTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {asg.slice().reverse().map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      </section>

      <div className="mt-8">
        <Link
          href="/digital/assignments"
          className="group inline-flex items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
            <NotebookPen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-text">{t.linkTitle}</div>
            <div className="text-sm text-text-muted">{t.linkText}</div>
          </div>
          <ArrowLeft className="h-5 w-5 text-text-subtle transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
