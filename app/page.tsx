import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Beaker,
  Calculator,
  ClipboardCheck,
  Search,
  Sparkles,
} from "lucide-react";
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
        <div aria-hidden className="pointer-events-none absolute inset-0 hero-halo" />
        <div className="container-page relative py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white/70 px-3 py-1 text-xs font-semibold text-fuchsia-700 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                מאגר לימוד לחשמל ואלקטרוניקה
              </div>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl md:text-6xl">
                כל{" "}
                <span className="bg-gradient-to-l from-primary-700 via-accent-500 to-fuchsia-500 bg-clip-text text-transparent">
                  מבחני מה&quot;ט ומשרד החינוך
                </span>
                , המטלות והמעבדות —{" "}
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-transform hover:-translate-y-0.5"
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

              {/* stat pills — each a different color */}
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-center">
                <StatPill label='מבחני מה"ט' value={stats.mahatExams} tone="primary" />
                <StatPill label="מבחני מ״החינוך" value={stats.ministryExams} tone="cyan" />
                <StatPill label="מטלות" value={stats.assignments} tone="fuchsia" />
              </dl>
            </div>

            {/* logo — living micro-animation */}
            <div className="relative hidden md:block">
              <div
                aria-hidden
                className="absolute -inset-6 rounded-full bg-gradient-to-br from-fuchsia-200 via-amber-200 to-cyan-200 opacity-60 blur-2xl motion-safe:animate-halo-pulse"
              />
              <Image
                src="/images/mark.png"
                alt=""
                width={240}
                height={240}
                priority
                className="relative mx-auto h-auto w-56 drop-shadow-xl motion-safe:animate-hero-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section className="container-page py-14">
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
            gradient="from-rose-500 to-fuchsia-500"
          />
          <ToolCard
            href="/labs"
            icon={<Beaker className="h-5 w-5" />}
            title="מעבדות"
            description="חומרי לימוד ופרוטוקולים למעבדות פרקטיות."
            gradient="from-emerald-500 to-cyan-500"
          />
          <ToolCard
            href="/calculator"
            icon={<Calculator className="h-5 w-5" />}
            title="מחשבון הנדסי"
            description="כלי חישוב ייעודיים למעגלי חשמל ואלקטרוניקה."
            gradient="from-amber-500 to-orange-500"
          />
        </div>
      </section>

      {/* RECENT */}
      <section className="container-page py-14">
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

const PILL_TONES = {
  primary: "border-primary-100 bg-primary-50/80 text-primary-800",
  cyan: "border-cyan-100 bg-cyan-50/80 text-cyan-800",
  fuchsia: "border-fuchsia-100 bg-fuchsia-50/80 text-fuchsia-800",
} as const;

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof PILL_TONES;
}) {
  return (
    <div className={`rounded-2xl border p-3 ${PILL_TONES[tone]}`}>
      <dt className="text-xs opacity-80">{label}</dt>
      <dd className="mt-1 text-xl font-extrabold num">{value}</dd>
    </div>
  );
}

function ToolCard({
  href,
  icon,
  title,
  description,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group card-shine relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/10"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-14 -left-14 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-15 blur-2xl transition-all duration-500 ease-out group-hover:scale-125 group-hover:opacity-40`}
      />
      <div className="relative flex items-start gap-4">
        <div
          className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform duration-300 ease-out group-hover:rotate-6 group-hover:scale-110`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 font-bold text-text">
            {title}
            <ArrowLeft className="h-4 w-4 text-text-subtle transition-all duration-300 ease-out group-hover:-translate-x-1.5 group-hover:text-primary-600" />
          </div>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
      </div>
    </Link>
  );
}
