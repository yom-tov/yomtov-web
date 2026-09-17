import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, GraduationCap, NotebookPen, Wrench, Building2, FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ExamCard } from "@/components/cards/ExamCard";
import { FormulaCard } from "@/components/cards/FormulaCard";
import {
  assignmentsFor,
  examsFor,
  formulasFor,
  getSubject,
  subjects,
  SUBJECT_TITLE_HE,
} from "@/lib/content";
import type { SubjectId } from "@/types/content";
import type { Metadata } from "next";

export function generateStaticParams() {
  return subjects
    .filter((s) => s.id !== "digital" && s.id !== "math" && s.id !== "physics")
    .map((s) => ({ subject: s.id }));
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
  const tech = examsFor(subject, "technician");
  const elecSys = examsFor(subject, "electrical-systems");
  const asg = assignmentsFor(subject);
  const fml = formulasFor(subject);

  const items: {
    key: string;
    title: string;
    description: string;
    href: string;
    count: number;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    linkColor: string;
  }[] = [];
  if (mahat.length > 0) {
    items.push({
      key: "mahat",
      title: 'מבחני מה"ט',
      description: "כל מבחני מה\"ט לתחום, מסודרים לפי שנה ומועד",
      href: `/${subject}/mahat-exams`,
      count: mahat.length,
      icon: <GraduationCap className="h-5 w-5" />,
      gradient: "from-indigo-500 to-blue-500",
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
      linkColor: "text-indigo-600 group-hover:text-indigo-800 dark:text-indigo-300 dark:group-hover:text-white",
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
      gradient: "from-cyan-500 to-teal-500",
      iconBg: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
      linkColor: "text-cyan-600 group-hover:text-cyan-800 dark:text-cyan-300 dark:group-hover:text-white",
    });
  }
  if (tech.length > 0) {
    items.push({
      key: "technician",
      title: "טכנאי חשמל",
      description: "מבחני הסמכה לטכנאי חשמל",
      href: `/${subject}/technician-exams`,
      count: tech.length,
      icon: <Wrench className="h-5 w-5" />,
      gradient: "from-orange-500 to-amber-500",
      iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
      linkColor: "text-orange-600 group-hover:text-orange-800 dark:text-orange-300 dark:group-hover:text-white",
    });
  }
  if (elecSys.length > 0) {
    items.push({
      key: "electrical-systems",
      title: "מערכות חשמל",
      description: "מבחני מערכות חשמל",
      href: `/${subject}/electrical-systems-exams`,
      count: elecSys.length,
      icon: <Building2 className="h-5 w-5" />,
      gradient: "from-rose-500 to-pink-500",
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
      linkColor: "text-rose-600 group-hover:text-rose-800 dark:text-rose-300 dark:group-hover:text-white",
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
      gradient: "from-emerald-500 to-green-500",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
      linkColor: "text-emerald-600 group-hover:text-emerald-800 dark:text-emerald-300 dark:group-hover:text-white",
    });
  }
  if (fml.length > 0) {
    items.push({
      key: "formulas",
      title: "נוסחאונים וסיכומים",
      description: "נוסחאונים, סיכומים וחומרי עזר למבחנים",
      href: `/${subject}/formulas`,
      count: fml.length,
      icon: <FileText className="h-5 w-5" />,
      gradient: "from-amber-500 to-yellow-500",
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
      linkColor: "text-amber-600 group-hover:text-amber-800 dark:text-amber-300 dark:group-hover:text-white",
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
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 dark:text-primary-300"
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
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:border-white/10"
            >
              <div
                aria-hidden
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${it.gradient}`}
              />
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-14 -left-14 h-32 w-32 rounded-full bg-gradient-to-br ${it.gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`}
              />
              <div className="relative flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${it.iconBg}`}>
                  {it.icon}
                </div>
                <span className="text-xs font-semibold text-text-subtle num">
                  {it.count} פריטים
                </span>
              </div>
              <div className="relative mt-6">
                <h3 className="text-lg font-bold text-text">{it.title}</h3>
                <p className="mt-1 text-sm text-text-muted">{it.description}</p>
              </div>
              <div className={`relative mt-5 inline-flex items-center gap-1 text-sm font-semibold ${it.linkColor}`}>
                עיון
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
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

      {fml.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-extrabold text-text">
            נוסחאונים וסיכומים
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fml.map((f) => (
              <FormulaCard key={f.id} formula={f} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
