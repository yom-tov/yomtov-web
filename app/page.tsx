import Link from "next/link";
import { ArrowLeft, Beaker, Calculator, ClipboardCheck, Search, ScrollText } from "lucide-react";
import { SubjectCard } from "@/components/cards/SubjectCard";
import { ExamCard } from "@/components/cards/ExamCard";
import { subjects, counts, recentExams, examsFor } from "@/lib/content";

export default function Home() {
  const stats = counts();
  const recent = recentExams(6);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgba(34,211,238,0.25),transparent),radial-gradient(40rem_25rem_at_100%_10%,rgba(30,64,175,0.18),transparent)]"
        />
        <div className="container-page relative py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-primary-700 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              מאגר לימוד לחשמל ואלקטרוניקה
            </div>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl md:text-6xl">
              כל <span className="text-primary-700">מבחני מה&quot;ט ומשרד החינוך</span>, המטלות והמעבדות —{" "}
              <span className="whitespace-nowrap text-accent-600">במקום אחד.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-text-muted">
              מאגר של <span className="num font-semibold text-text">{stats.exams}</span> מבחנים,{" "}
              <span className="num font-semibold text-text">{stats.assignments}</span> מטלות ותרגולים ועוד — לסטודנטים
              ללימודי חשמל, אלקטרוניקה תקבילית וספרתית. חינם, מהיר, ומאורגן להפליא.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-700"
              >
                <Search className="h-4 w-4" />
                חיפוש במאגר
              </Link>
              <Link
                href="/exams"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-text transition-colors hover:border-border-strong"
              >
                עיון בכל המבחנים
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            {/* stat pills */}
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-center">
              <div className="rounded-xl border border-border bg-surface p-3">
                <dt className="text-xs text-text-subtle">מבחני מה&quot;ט</dt>
                <dd className="mt-1 text-lg font-bold text-primary-700 num">{stats.mahatExams}</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <dt className="text-xs text-text-subtle">מבחני מ&quot;החינוך</dt>
                <dd className="mt-1 text-lg font-bold text-primary-700 num">{stats.ministryExams}</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <dt className="text-xs text-text-subtle">מטלות</dt>
                <dd className="mt-1 text-lg font-bold text-primary-700 num">{stats.assignments}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-text sm:text-3xl">תחומי הלימוד</h2>
            <p className="mt-1 text-sm text-text-muted">בחר תחום כדי לראות את כל התכנים</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {subjects.map((s) => {
            const nMahat = examsFor(s.id, "mahat").length;
            const nEdu = examsFor(s.id, "education").length;
            const parts: string[] = [];
            if (nMahat) parts.push(`${nMahat} מבחני מה"ט`);
            if (nEdu) parts.push(`${nEdu} מבחני מ"החינוך`);
            return (
              <SubjectCard
                key={s.id}
                subject={s}
                size="lg"
                stats={parts.join(" · ") || "בקרוב"}
              />
            );
          })}
        </div>
      </section>

      {/* TOOLS */}
      <section className="container-page py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <ToolCard
            href="/exams"
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="כל המבחנים"
            description="מבחני מה״ט ומשרד החינוך בכל השנים, מפולחים בפילטרים חכמים."
          />
          <ToolCard
            href="/labs"
            icon={<Beaker className="h-5 w-5" />}
            title="מעבדות"
            description="חומרי לימוד ופרוטוקולים למעבדות פרקטיות."
          />
          <ToolCard
            href="/calculator"
            icon={<Calculator className="h-5 w-5" />}
            title="מחשבון הנדסי"
            description="כלי חישוב ייעודיים למעגלי חשמל ואלקטרוניקה."
          />
        </div>
      </section>

      {/* RECENT */}
      <section className="container-page py-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-text sm:text-3xl">מבחנים אחרונים</h2>
            <p className="mt-1 text-sm text-text-muted">התכנים החדשים ביותר במאגר</p>
          </div>
          <Link
            href="/exams"
            className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900"
          >
            לכל המבחנים
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      </section>
    </>
  );
}

function ToolCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary-200"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 font-bold text-text">
          {title}
          <ArrowLeft className="h-4 w-4 text-text-subtle transition-transform group-hover:-translate-x-1 group-hover:text-primary-600" />
        </div>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
    </Link>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unusedForExports = ScrollText;
