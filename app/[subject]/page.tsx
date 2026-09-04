import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, GraduationCap, NotebookPen } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ExamCard } from "@/components/cards/ExamCard";
import { AssignmentCard } from "@/components/cards/AssignmentCard";
import {
  assignmentsFor,
  examsFor,
  getSubject,
  subjects,
  SUBJECT_TITLE_HE,
} from "@/lib/content";
import type { SubjectId } from "@/types/content";
import type { Metadata } from "next";

export function generateStaticParams() {
  return subjects.map((s) => ({ subject: s.id }));
}

type Params = Promise<{ subject: string }>;

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const { subject } = await params;
  const s = getSubject(subject as SubjectId);
  if (!s) return {};
  return {
    title: s.hebrewTitle,
    description: s.description,
  };
}

export default async function SubjectPage({ params }: { params: Params }) {
  const { subject: subjectRaw } = await params;
  const subject = subjectRaw as SubjectId;
  const s = getSubject(subject);
  if (!s) notFound();

  const mahat = examsFor(subject, "mahat");
  const edu = examsFor(subject, "education");
  const asg = assignmentsFor(subject);

  const items: {
    key: string;
    title: string;
    description: string;
    href: string;
    count: number;
    icon: React.ReactNode;
  }[] = [];
  if (mahat.length > 0) {
    items.push({
      key: "mahat",
      title: 'מבחני מה"ט',
      description: "כל מבחני מה\"ט לתחום, מסודרים לפי שנה ומועד",
      href: `/${subject}/mahat-exams`,
      count: mahat.length,
      icon: <GraduationCap className="h-5 w-5" />,
    });
  }
  if (edu.length > 0) {
    items.push({
      key: "education",
      title: "מבחני משרד החינוך",
      description: "מבחני משרד החינוך בתחום",
      href: `/${subject}/ministry-exams`,
      count: edu.length,
      icon: <ClipboardCheck className="h-5 w-5" />,
    });
  }
  if (asg.length > 0) {
    items.push({
      key: "assignments",
      title: "עבודות ותרגולים",
      description: "מטלות ותרגילים לתרגול עצמי",
      href: `/${subject}/assignments`,
      count: asg.length,
      icon: <NotebookPen className="h-5 w-5" />,
    });
  }

  const featured = mahat.slice(0, 3);

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: "ראשי", href: "/" }, { label: s.hebrewTitle }]}
      />
      <header className="mt-6">
        <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-br ${s.color} px-3 py-1 text-xs font-semibold text-white shadow-sm`}>
          תחום לימוד
        </div>
        <h1 className="mt-3 text-3xl font-extrabold text-text sm:text-4xl">
          {s.hebrewTitle}
        </h1>
        <p className="mt-2 max-w-3xl text-base text-text-muted">
          {s.description}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-surface-2/50 p-10 text-center">
          <h2 className="text-lg font-bold text-text">
            תכנים לתחום זה נמצאים בהכנה
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            בקרוב נעלה מבחנים, מטלות ומעבדות עבור {s.hebrewTitle}.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-700"
          >
            חזרה לדף הבית
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  {it.icon}
                </div>
                <span className="text-xs font-semibold text-text-subtle num">
                  {it.count} פריטים
                </span>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-bold text-text">{it.title}</h3>
                <p className="mt-1 text-sm text-text-muted">{it.description}</p>
              </div>
              <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 group-hover:text-primary-900">
                עיון
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {featured.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-extrabold text-text">
            מבחנים אחרונים ב{SUBJECT_TITLE_HE[subject]}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
          </div>
        </section>
      )}

      {asg.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-extrabold text-text">מטלות מומלצות</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {asg.slice(0, 3).map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
