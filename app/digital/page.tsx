import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AssignmentCard } from "@/components/cards/AssignmentCard";
import { assignmentsFor, getSubject } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אלקטרוניקה ספרתית",
  description:
    "לוגיקה בוליאנית, שערים, מונים, זיכרונות ומעגלים ספרתיים — חומרי לימוד, נוסחאות וסיכומים.",
};

export default function DigitalPage() {
  const s = getSubject("digital")!;
  const asg = assignmentsFor("digital");

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

      <section className="mt-10">
        <h2 className="text-xl font-extrabold text-text">
          אלקטרוניקה ספרתית
        </h2>
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
            <div className="text-base font-bold text-text">
              עבודות ותרגולים
            </div>
            <div className="text-sm text-text-muted">
              כל חומרי הלימוד לאלקטרוניקה ספרתית
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 text-text-subtle transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
