import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { eq, sql } from "drizzle-orm";
import {
  Accessibility,
  ArrowLeft,
  Binary,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  FlaskConical,
  GraduationCap,
  History,
  LayoutDashboard,
  Mail,
  Moon,
  Play,
  PlayCircle,
  Plus,
  School,
  Search,
  Smartphone,
  Sparkles,
  Video,
  Waves,
} from "lucide-react";
import { db } from "@/lib/db";
import { subjectIcon } from "@/lib/subject-icons";
import { contentPackages, packageVideos } from "@/lib/db/schema";
import {
  assignmentsFor,
  counts,
  examSubtitle,
  exams,
  examsFor,
  formatSize,
  formulas,
  formulasFor,
  labs,
  subjects,
  SOURCE_TITLE_HE,
  SUBJECT_TITLE_HE,
} from "@/lib/content";
import type { Exam, ExamSource, SubjectId } from "@/types/content";
import { LandingEffects } from "./_landing/LandingEffects";
import { CountUp } from "./_landing/CountUp";
import { HeroVisual } from "./_landing/HeroVisual";
import { CircuitBackdrop } from "./_landing/CircuitBackdrop";
import { ExamStory, type StoryExam } from "./_landing/ExamStory";
import { LedTicker } from "./_landing/ToolWidgets";
import { CircuitArt, FourierArt, TrafficLightArt } from "./_landing/ToolArt";
import { StartSteps, type StartStep } from "./_landing/StartSteps";
import "./_landing/landing.css";

// `absolute` bypasses the root layout's "%s | אבי יומטוביאן" title
// template — the home page (and only the home page) shows just the brand
// line in the browser tab.
export const metadata: Metadata = {
  title: { absolute: "אבי יומטוביאן - פשוט להבין!" },
  description:
    'כל מבחני מה"ט ומשרד החינוך עם פתרונות, מטלות, נוסחאונים, מעבדות, מחשבון הנדסי, סימולטורים וקורסי וידאו — במקום אחד. המאגר פתוח וחינמי.',
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "אבי יומטוביאן - פשוט להבין!",
    description:
      'מבחני מה"ט ומשרד החינוך עם פתרונות, מעבדות, סימולטורים וקורסי וידאו בחשמל ואלקטרוניקה.',
  },
};

// Content counts come from the bundled JSON; only the course list hits the
// DB, and it changes rarely — an hourly refresh is plenty.
export const revalidate = 3600;

const LESSONS_EMAIL = "lessons@yomtovian.com";
const CONTACT_EMAIL = "contact@yomtovian.com";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  videoCount: number;
  totalDurationSeconds: number;
};

async function getCourses(): Promise<CourseRow[]> {
  try {
    return await db
      .select({
        id: contentPackages.id,
        slug: contentPackages.slug,
        title: contentPackages.title,
        videoCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${packageVideos}
          WHERE ${packageVideos.packageId} = ${contentPackages.id}
        )`,
        totalDurationSeconds: sql<number>`(
          SELECT COALESCE(SUM("videos"."duration_seconds"), 0)::int FROM "package_videos"
          INNER JOIN "videos" ON "videos"."id" = "package_videos"."video_id"
          WHERE "package_videos"."package_id" = "content_packages"."id"
        )`,
      })
      .from(contentPackages)
      .where(eq(contentPackages.published, true))
      .orderBy(contentPackages.displayOrder);
  } catch (e) {
    // The landing page must render even when the DB is unreachable — the
    // courses block just falls back to a plain CTA.
    console.error("landing: failed to load courses", e);
    return [];
  }
}

function durationLabel(sec: number): string | null {
  if (!sec) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.ceil((sec % 3600) / 60);
  return h > 0 ? `${h} שע׳ ${m} דק׳` : `${m} דק׳`;
}

/** Short human label for an exam, without repeating the source in the title. */
function examLabel(e: Exam): string {
  const subj = SUBJECT_TITLE_HE[e.subject];
  if (e.source === "mahat") return `מה"ט ${subj} · ${e.title}`;
  if (e.source === "education") return `משרד החינוך · ${subj}${e.year ? ` ${e.year}` : ""}`;
  return e.title;
}

const SOURCE_DOT: Record<ExamSource, string> = {
  mahat: "text-primary-600 dark:text-primary-300",
  education: "text-cyan-600 dark:text-cyan-300",
  technician: "text-orange-600 dark:text-orange-300",
  "electrical-systems": "text-rose-600 dark:text-rose-300",
};

// What each subject page offers beyond the countable JSON content.
const SUBJECT_EXTRAS: Record<SubjectId, string[]> = {
  electricity: ["סימולטור מעגלים"],
  analog: ["סימולטור מעגלים"],
  digital: ["סימולטור ספרתי", "סרטונים קצרים"],
  math: ["סימולטור פורייה", "סרטוני הדרכה"],
  physics: ["סרטוני הדרכה"],
};

const SUBJECT_SPANS: Record<SubjectId, string> = {
  electricity: "md:col-span-2 lg:col-span-2 lg:row-span-2",
  analog: "lg:col-span-2",
  digital: "",
  math: "",
  physics: "lg:col-span-2",
};

const LAB_GUIDES = [
  { title: "הנחיות בטיחות במעבדה", dot: "bg-rose-500" },
  { title: "קוד צבעים לנגדים", dot: "bg-amber-500" },
  { title: "קבלים וסלילים", dot: "bg-emerald-500" },
  { title: "טבלת קודי קבלים", dot: "bg-blue-500" },
  { title: "מבוא ל-Matlab", dot: "bg-violet-500" },
  { title: "התפלגות נורמלית", dot: "bg-cyan-500" },
];

const COURSE_TONES = [
  "from-amber-400 via-orange-500 to-rose-500",
  "from-cyan-400 via-sky-500 to-primary-500",
  "from-fuchsia-400 via-violet-500 to-indigo-500",
  "from-emerald-400 via-teal-500 to-cyan-500",
];

export default async function Home() {
  const c = counts();
  const years = exams.map((e) => e.year).filter((y): y is number => y != null);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const yearSpan = maxYear - minYear + 1;
  const solutionPct = Math.round((exams.filter((e) => e.solution).length / exams.length) * 100);
  const techAndSystems = exams.filter((e) => e.source === "technician" || e.source === "electrical-systems").length;

  const byRecent = exams
    .filter((e) => e.year != null)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  const latestMahat = byRecent.find((e) => e.source === "mahat") ?? byRecent[0];

  const courses = await getCourses();

  // ---- ExamStory data (all real content) ----
  const storyExams: StoryExam[] = byRecent.map((e) => ({
    label: examLabel(e),
    sub: examSubtitle(e),
    solved: !!e.solution,
  }));
  const filterResults = byRecent
    .filter((e) => e.subject === latestMahat.subject && e.source === "mahat" && e.year === latestMahat.year)
    .slice(0, 3)
    .map((e) => ({ label: examLabel(e), sub: examSubtitle(e), solved: !!e.solution }));
  const examSubjects = Array.from(new Set(exams.map((e) => e.subject)));
  const recentYears = Array.from(new Set(years)).sort((a, b) => b - a).slice(0, 5);

  // ---- Subject tiles ----
  const subjectTiles = subjects.map((s) => {
    const nExams = exams.filter((e) => e.subject === s.id).length;
    const nAsg = assignmentsFor(s.id).length;
    const nFml = formulasFor(s.id).length;
    const chips: string[] = [];
    if (s.id === "electricity") {
      for (const src of ["mahat", "education", "technician", "electrical-systems"] as ExamSource[]) {
        const n = examsFor(s.id, src).length;
        if (n) chips.push(`${n} ${SOURCE_TITLE_HE[src].replace("מבחני ", "")}`);
      }
    } else if (nExams) {
      chips.push(`${nExams} מבחנים`);
    }
    if (nAsg) chips.push(`${nAsg} תרגולים`);
    if (nFml) chips.push(`${nFml} נוסחאונים`);
    chips.push(...SUBJECT_EXTRAS[s.id]);
    return { s, total: nExams + nAsg + nFml, chips };
  });

  const marqueeExams = byRecent.slice(0, 18);
  const recentElectricity = byRecent.filter((e) => e.subject === "electricity").slice(0, 3);

  const startSteps: StartStep[] = [
    {
      title: "בוחרים תחום או מחפשים",
      text: "חשמל, אלקטרוניקה תקבילית, ספרתית, מתמטיקה או פיסיקה, או פשוט מקלידים בחיפוש את מה שצריך.",
      links: [
        { href: "/search", label: "חיפוש במאגר" },
        { href: "/electricity", label: "חשמל" },
        { href: "/analog", label: "תקבילית" },
      ],
    },
    {
      title: "פותחים מבחן, פותרים ובודקים",
      text: "צופים במבחן ישר בדפדפן או מורידים PDF, פותרים, ובודקים את עצמכם מול קובץ הפתרון.",
      links: [
        { href: "/exams", label: "כל המבחנים" },
        { href: "/labs", label: "מעבדות" },
        { href: "/calculator", label: "מחשבון הנדסי" },
      ],
    },
    {
      title: "רוצים ליווי? מעמיקים",
      text: "קורסי וידאו עם 30 דקות ראשונות בחינם, או שיעור פרטי בזום, אחד על אחד.",
      links: [
        { href: "/courses", label: "קורסי וידאו" },
        { href: "/register", label: "הרשמה לאתר" },
      ],
    },
  ];

  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: "השימוש באתר עולה כסף?",
      a: "לא. המאגר (מבחנים, פתרונות, מטלות, נוסחאונים, חומרי מעבדה, המחשבון והסימולטורים) פתוח וחינמי. קורסי הווידאו והשיעורים הפרטיים הם בתשלום.",
    },
    {
      q: "יש פתרונות למבחנים?",
      a:
        solutionPct === 100
          ? "כן. לכל מבחן במאגר מצורף קובץ פתרון, לצפייה ישר בדפדפן ולהורדה."
          : `כן. ${solutionPct}% מהמבחנים במאגר מגיעים עם קובץ פתרון, לצפייה ישר בדפדפן ולהורדה.`,
    },
    {
      q: "אפשר לראות קורס לפני שרוכשים?",
      a: "כן. ב־30 הדקות הראשונות של הקורס אפשר לצפות בחינם, בלי הרשמה, דרך כפתור הפרומו בעמוד הקורס.",
    },
    {
      q: "איך רוכשים קורס?",
      a: (
        <>
          נרשמים לאתר, ובעמוד הקורס לוחצים על &quot;לרכישה&quot;. הרכישה מתבצעת בפנייה במייל. אחרי הרכישה הקורס
          מופיע באזור האישי, ואפשר לצפות בו ולהמשיך מהנקודה שבה עצרתם.
        </>
      ),
    },
    {
      q: "איך מתאמים שיעור פרטי?",
      a: (
        <>
          שולחים מייל ל־
          <a href={`mailto:${LESSONS_EMAIL}`} className="prose-link" dir="ltr">
            {LESSONS_EMAIL}
          </a>{" "}
          עם שם מלא, החומר המבוקש לשיעור, פרטים נוספים (רמת ידע, מועד מבחן) ומספר טלפון.
        </>
      ),
    },
    {
      q: "אפשר להתקין את האתר כאפליקציה?",
      a: 'כן. בנייד אפשר להוסיף את האתר למסך הבית ("הוסף למסך הבית") ולקבל אייקון כמו של אפליקציה.',
    },
  ];

  return (
    <div className="relative overflow-x-clip">
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}`}</style>
      </noscript>
      <LandingEffects />

      {/* ================================================================ HERO */}
      <section aria-labelledby="lp-hero-title" className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="lp-aurora">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="lp-grid" />
          <CircuitBackdrop />
        </div>

        <div className="container-page relative flex min-h-[calc(100svh-67px)] flex-col justify-center py-14 lg:py-12">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8">
            <div>
              <div
                className="lp-rise inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-fuchsia-700 shadow-sm backdrop-blur dark:border-fuchsia-400/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 sm:text-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-500" />
                </span>
                פלטפורמת לימוד לחשמל ואלקטרוניקה
              </div>

              <h1
                id="lp-hero-title"
                className="mt-6 font-extrabold leading-[1.05] tracking-tight text-text"
              >
                <span className="block text-4xl sm:text-5xl xl:text-6xl">
                  <span className="lp-word" style={{ "--d": "120ms" } as React.CSSProperties}>
                    חשמל
                  </span>{" "}
                  <span className="lp-word" style={{ "--d": "230ms" } as React.CSSProperties}>
                    ואלקטרוניקה.
                  </span>
                </span>
                <span className="mt-2 block text-[3.25rem] sm:text-7xl xl:text-8xl">
                  <span className="lp-shimmer" style={{ "--d": "380ms" } as React.CSSProperties}>
                    פשוט להבין!
                  </span>
                </span>
              </h1>

              <p
                className="lp-rise mt-7 max-w-xl text-lg leading-8 text-text-muted sm:text-xl sm:leading-9"
                style={{ "--d": "560ms" } as React.CSSProperties}
              >
                כל מבחני מה&quot;ט ומשרד החינוך עם פתרונות, מטלות, נוסחאונים, מעבדות, סימולטורים וקורסי וידאו.
                הכול מסודר במקום אחד. <strong className="whitespace-nowrap font-bold text-text">המאגר פתוח וחינמי.</strong>
              </p>

              <div
                className="lp-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
                style={{ "--d": "700ms" } as React.CSSProperties}
              >
                <Link
                  href="/exams"
                  className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-l from-primary-700 via-primary-600 to-accent-500 px-7 text-base font-bold text-white shadow-xl shadow-primary-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent-500/30"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                  <span className="relative">התחילו ללמוד, בחינם</span>
                  <ArrowLeft className="relative h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-surface/70 px-6 text-base font-bold text-text backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/10"
                >
                  <Search className="h-5 w-5 text-primary-500 dark:text-primary-200" />
                  חיפוש במאגר
                </Link>
                <Link
                  href="/courses"
                  className="group inline-flex h-14 items-center justify-center gap-2 px-3 text-base font-bold text-primary-700 transition-colors hover:text-primary-900 dark:text-primary-200 dark:hover:text-white"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-50 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-500/15">
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                  קורסי וידאו
                </Link>
              </div>

              <ul
                className="lp-rise mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-muted"
                style={{ "--d": "860ms" } as React.CSSProperties}
              >
                <li className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary-500 dark:text-primary-200" />
                  <span>
                    <b className="num font-extrabold text-text">{c.exams}</b> מבחנים
                  </span>
                </li>
                <li className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span>
                    <b className="num font-extrabold text-text">{solutionPct}%</b> עם פתרון
                  </span>
                </li>
                <li className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    שנים <b className="num font-extrabold text-text">{minYear}–{maxYear}</b>
                  </span>
                </li>
              </ul>
            </div>

            <div className="lp-rise" style={{ "--d": "250ms" } as React.CSSProperties}>
              <HeroVisual
                latestExam={`${SUBJECT_TITLE_HE[latestMahat.subject]} · ${latestMahat.title}`}
                labsCount={c.labs}
                formulasCount={formulas.length}
              />
            </div>
          </div>

          <a
            href="#lp-what"
            className="lp-rise absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold text-text-subtle transition-colors hover:text-text md:flex"
            style={{ "--d": "1200ms" } as React.CSSProperties}
          >
            <span className="lp-mouse" aria-hidden />
            גללו למטה
          </a>
        </div>
      </section>

      {/* ============================================================= MARQUEE */}
      <div aria-hidden className="relative border-y border-border bg-surface/70 py-5 backdrop-blur">
        <div className="lp-marquee">
          <div className="lp-marquee-track" style={{ "--dur": "90s" } as React.CSSProperties}>
            {[...marqueeExams, ...marqueeExams].map((e, i) => (
              <span
                key={`${e.id}-${i}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-muted shadow-sm"
              >
                <FileText className={`h-4 w-4 ${SOURCE_DOT[e.source]}`} />
                {examLabel(e)}
                {e.solution && <Sparkles className="h-3.5 w-3.5 text-emerald-500" />}
              </span>
            ))}
          </div>
        </div>
        <div className="lp-marquee mt-3">
          <div className="lp-marquee-track" data-reverse="true" style={{ "--dur": "110s" } as React.CSSProperties}>
            {[...labs, ...labs].map((l, i) => (
              <span
                key={`${l.id}-${i}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface-2/70 px-4 py-2 text-sm font-medium text-text-muted"
              >
                <PlayCircle className="h-4 w-4 text-rose-500" />
                {l.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ WHAT IS IT */}
      <section id="lp-what" aria-labelledby="lp-what-title" className="container-page scroll-mt-24 py-24 sm:py-32">
        <SectionHeading
          id="lp-what-title"
          eyebrow="מה זה?"
          title="מאגר, כלים ווידאו."
          highlight="הכול במקום אחד."
          sub="פלטפורמת לימוד לחשמל, אלקטרוניקה תקבילית ואלקטרוניקה ספרתית: חומרי לימוד מקצועיים, חיפוש חופשי ופילטרים חכמים, בממשק מהיר שעובד מצוין גם בנייד."
        />
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {[
            {
              href: "/exams",
              icon: <FileText className="h-8 w-8" />,
              tone: "from-primary-600 to-accent-500",
              spot: "var(--accent-500)",
              title: "מאגר מבחנים ופתרונות",
              text:
                solutionPct === 100
                  ? "מבחנים משנים קודמות, מסודרים לפי תחום, שנה ומועד, ולכל מבחן קובץ פתרון."
                  : "מבחנים משנים קודמות, מסודרים לפי תחום, שנה ומועד, רובם עם קובץ פתרון.",
              bullets: [
                `${c.mahatExams} מבחני מה"ט`,
                `${c.ministryExams} מבחני משרד החינוך`,
                `${techAndSystems} מבחני טכנאי חשמל ומערכות חשמל`,
                `${c.assignments} מטלות ותרגולים · ${formulas.length} נוסחאונים`,
              ],
              cta: "לכל המבחנים",
            },
            {
              href: "/calculator",
              icon: <Calculator className="h-8 w-8" />,
              tone: "from-amber-500 to-rose-500",
              spot: "var(--joy-amber)",
              title: "כלים וסימולטורים",
              text: "כלים אינטראקטיביים שעובדים ישר בדפדפן, בלי להתקין כלום.",
              bullets: [
                "מחשבון הנדסי מדעי + ממיר יחידות",
                "סימולטור מעגלים (CircuitJS)",
                "סימולטור פורייה (PhET)",
                "סימולטור ספרתי: רמזור תנועה",
              ],
              cta: "למחשבון ההנדסי",
            },
            {
              href: "/courses",
              icon: <PlayCircle className="h-8 w-8" />,
              tone: "from-fuchsia-500 to-violet-600",
              spot: "var(--joy-fuchsia)",
              title: "וידאו שמסביר",
              text: "הסברים ברורים בווידאו, מסרטונים קצרים ועד קורסים מקיפים.",
              bullets: [
                `${c.labs} סרטוני הדרכה למעבדה`,
                "סרטוני הדרכה במתמטיקה ובפיסיקה",
                "הכנה לפסיכומטרי ופסיכוטכני",
                "קורסי וידאו מאת אבי יומטוביאן",
              ],
              cta: "לקורסי הווידאו",
            },
          ].map((p, i) => (
            <div key={p.title} data-reveal="tilt" style={{ "--d": `${i * 130}ms` } as React.CSSProperties}>
              <Link
                href={p.href}
                data-spot
                className="lp-spot lp-tilt group flex h-full flex-col rounded-[2rem] border border-border bg-surface p-8 shadow-sm hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:border-primary-400/30"
                style={{ "--spot": p.spot } as React.CSSProperties}
              >
                <span
                  className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${p.tone} text-white shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}
                >
                  {p.icon}
                </span>
                <h3 className="mt-6 text-2xl font-extrabold text-text">{p.title}</h3>
                <p className="mt-2 text-base leading-7 text-text-muted">{p.text}</p>
                <ul className="mt-5 space-y-2.5">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm font-medium text-text">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="num">{b}</span>
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-7 text-sm font-bold text-primary-700 dark:text-primary-200">
                  {p.cta}
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
                </span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================= NUMBERS */}
      <section aria-labelledby="lp-stats-title" className="lp-night overflow-hidden py-20 sm:py-24">
        <div className="container-page">
          <div data-reveal="up" className="text-center">
            <div className="text-sm font-bold tracking-wide text-accent-400">המאגר במספרים</div>
            <h2 id="lp-stats-title" className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              <span className="num">{yearSpan}</span> שנים של מבחנים, במקום אחד
            </h2>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { value: c.exams, label: "מבחנים", color: "amber" },
              { value: c.assignments, label: "מטלות ותרגולים", color: "emerald" },
              { value: formulas.length, label: "נוסחאונים", color: "fuchsia" },
              { value: c.labs, label: "סרטוני מעבדה", color: "cyan" },
              { value: yearSpan, label: `שנים (${minYear}–${maxYear})`, color: "amber" },
            ].map((s, i) => (
              <li
                key={s.label}
                data-reveal="scale"
                style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
                className={i === 4 ? "col-span-2 md:col-span-1" : ""}
              >
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur-sm sm:p-5">
                  <div className="led-display rounded-2xl px-3 py-4 text-4xl font-bold sm:text-5xl" data-color={s.color}>
                    <CountUp value={s.value} />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-[#AEB9DC] num">{s.label}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================ AUDIENCE */}
      <section aria-labelledby="lp-who-title" className="container-page py-24 sm:py-32">
        <SectionHeading
          id="lp-who-title"
          eyebrow="למי זה מיועד?"
          title="נבנה בשביל מי"
          highlight="שלומד חשמל ואלקטרוניקה"
          stack
          sub="סטודנטים ותלמידים ללימודי חשמל, אלקטרוניקה תקבילית ואלקטרוניקה ספרתית, בכל שלב של הלימודים."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <GraduationCap className="h-6 w-6" />,
              tone: "from-indigo-500 to-blue-500",
              title: 'מתכוננים למבחני מה"ט',
              text: 'טכנאים והנדסאים: מבחני מה"ט משנים קודמות, מסודרים לפי שנה ומועד, עם פתרונות.',
              href: "/electricity/mahat-exams",
            },
            {
              icon: <School className="h-6 w-6" />,
              tone: "from-cyan-500 to-teal-500",
              title: "לקראת מבחני משרד החינוך",
              text: "מבחני משרד החינוך בחשמל, לתרגול אמיתי לפני הבחינה.",
              href: "/electricity/ministry-exams",
            },
            {
              icon: <Video className="h-6 w-6" />,
              tone: "from-fuchsia-500 to-violet-500",
              title: "צריכים הסבר מעמיק",
              text: "קורסי וידאו מוסברים ומפורטים, ושיעורים פרטיים בזום אחד על אחד, בקצב שלכם.",
              href: "/courses",
            },
            {
              icon: <Brain className="h-6 w-6" />,
              tone: "from-sky-500 to-indigo-500",
              title: "מתכוננים לפסיכומטרי / פסיכוטכני",
              text: "סרטון הכנה מקיף: הקבלות מילוליות, סדרות, חשבון, הגיון והבנה טכנית.",
              href: "/psychometric",
            },
          ].map((a, i) => (
            <div key={a.title} data-reveal="up" style={{ "--d": `${i * 100}ms` } as React.CSSProperties}>
              <Link
                href={a.href}
                data-spot
                className="lp-spot group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary-500/10"
              >
                <span aria-hidden className="pointer-events-none absolute -bottom-5 left-3 text-[6rem] font-extrabold leading-none text-text opacity-[0.045] num">
                  0{i + 1}
                </span>
                <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${a.tone} text-white shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                  {a.icon}
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-text">{a.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{a.text}</p>
                <ArrowLeft className="mt-auto h-5 w-5 pt-1 text-text-subtle transition-all duration-300 group-hover:-translate-x-1.5 group-hover:text-primary-600" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ SUBJECTS */}
      <section aria-labelledby="lp-subjects-title" className="relative isolate overflow-x-clip pb-24 sm:pb-32">
        <div aria-hidden className="hero-halo pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <div className="container-page">
          <SectionHeading
            id="lp-subjects-title"
            eyebrow="תחומי הלימוד"
            title="בוחרים תחום,"
            highlight="ומתחילים ללמוד"
            sub="כל תחום מרכז את המבחנים, התרגולים, הנוסחאונים, הסרטונים והסימולטורים שלו."
          />
          <div className="mt-14 grid auto-rows-[minmax(210px,auto)] gap-4 md:grid-cols-2 lg:grid-cols-4">
            {subjectTiles.map(({ s, total, chips }, i) => {
              const Icon = subjectIcon(s.icon);
              const big = s.id === "electricity";
              return (
                <div
                  key={s.id}
                  data-reveal="up"
                  style={{ "--d": `${i * 80}ms` } as React.CSSProperties}
                  className={SUBJECT_SPANS[s.id]}
                >
                  <SubjectTile
                    href={`/${s.id}`}
                    title={s.hebrewTitle}
                    description={s.description}
                    color={s.color}
                    icon={<Icon className={big ? "h-9 w-9" : "h-7 w-7"} strokeWidth={2.2} />}
                    chips={chips}
                    watermark={total > 0 ? String(total) : null}
                    big={big}
                    extra={big ? <RecentExamsList exams={recentElectricity} /> : undefined}
                  />
                </div>
              );
            })}
            <div data-reveal="up" style={{ "--d": "400ms" } as React.CSSProperties} className="md:col-span-2">
              <SubjectTile
                href="/psychometric"
                title="פסיכומטרי / פסיכוטכני"
                description="סרטון הכנה מקיף: הקבלות מילוליות, סדרות, חשבון, סדרות צורניות, אוצר מילים, הגיון והבנה טכנית."
                color="from-sky-500 via-blue-500 to-indigo-500"
                icon={<Brain className="h-7 w-7" strokeWidth={2.2} />}
                chips={["סרטון הדרכה"]}
                watermark={null}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ HOW IT WORKS */}
      <section aria-labelledby="lp-how-title" className="border-y border-border bg-surface-2/40 py-24 sm:py-28">
        <div className="container-page">
          <SectionHeading
            id="lp-how-title"
            eyebrow="איך זה עובד"
            title="ממבחן לפתרון,"
            highlight="בכמה שניות"
            sub="בלי לחפש בקבצים מפוזרים. הכול מסודר, מחופש ומוכן לתרגול."
          />
          <div className="mt-12 lg:mt-6">
            <ExamStory
              exams={storyExams}
              searchWords={["קיץ 2024", "משרד החינוך", "אביב 2025", "טכנאי חשמל"]}
              filter={{
                subjects: examSubjects.map((id) => ({ label: SUBJECT_TITLE_HE[id], active: id === latestMahat.subject })),
                sources: (["mahat", "education", "technician", "electrical-systems"] as ExamSource[]).map((src) => ({
                  label: SOURCE_TITLE_HE[src],
                  active: src === "mahat",
                })),
                years: recentYears.map((y) => ({ label: String(y), active: y === latestMahat.year })),
                results: filterResults,
              }}
              pdf={{
                title: examLabel(latestMahat),
                sub: examSubtitle(latestMahat),
                examSize: formatSize(latestMahat.exam.sizeBytes),
                solutionSize: formatSize(latestMahat.solution?.sizeBytes),
              }}
              solutionPct={solutionPct}
            />
          </div>
        </div>
      </section>

      {/* ================================================================ TOOLS */}
      <section aria-labelledby="lp-tools-title" className="container-page py-24 sm:py-32">
        <SectionHeading
          id="lp-tools-title"
          eyebrow="כלים"
          title="לא רק לקרוא,"
          highlight="לנסות בעצמכם"
          sub="מחשבון הנדסי, סימולטורים וחומרי עזר למעבדה, ישר בדפדפן."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <div data-reveal="up" className="lg:col-span-2">
            <ToolTile
              href="/calculator"
              title="מחשבון הנדסי"
              text="מחשבון מדעי מלא, בסיסי מספרים, קבועים פיזיקליים וממיר יחידות, בכרטיסיות נוחות."
              icon={<Calculator className="h-5 w-5" />}
              tone="from-amber-500 to-orange-500"
              spot="var(--joy-amber)"
            >
              <div className="grid h-full items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <LedTicker
                  items={[
                    { expr: "eCalc  sin(30°)", value: "0.5", color: "amber" },
                    { expr: "BASE  0b101101 →", value: "45 = 0x2D", color: "emerald" },
                    { expr: "CONST  c", value: "2.998E8 m/s", color: "cyan" },
                    { expr: "UNIT  1 kWh →", value: "3.6 MJ", color: "fuchsia" },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  {["מחשבון eCalc", "בסיסי מספרים", "קבועים פיזיקליים", "ממיר יחידות"].map((t, i) => (
                    <span
                      key={t}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        i === 0
                          ? "bg-primary-600 text-white shadow-md shadow-primary-500/25"
                          : "border border-border bg-surface text-text-muted"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </ToolTile>
          </div>
          <div data-reveal="up" style={{ "--d": "100ms" } as React.CSSProperties}>
            <ToolTile
              href="/simulator"
              title="סימולטור מעגלים"
              text="בונים מעגלים, מריצים סימולציה וצופים בתוצאות בזמן אמת (CircuitJS)."
              icon={<Cpu className="h-5 w-5" />}
              tone="from-lime-500 to-green-600"
              spot="var(--joy-emerald)"
            >
              <CircuitArt />
            </ToolTile>
          </div>
          <div data-reveal="up">
            <ToolTile
              href="/fourier"
              title="סימולטור פורייה"
              text="בונים גלים מהרמוניות ומגלים את הקשר בין תחום הזמן לתחום התדר (PhET)."
              icon={<Waves className="h-5 w-5" />}
              tone="from-indigo-500 to-violet-500"
              spot="var(--joy-violet)"
            >
              <FourierArt />
            </ToolTile>
          </div>
          <div data-reveal="up" style={{ "--d": "100ms" } as React.CSSProperties}>
            <ToolTile
              href="/digital"
              title="סימולטור ספרתי"
              text="רמזור תנועה ספרתי: צופים בלוגיקה הסדרתית שמפעילה את הנורות."
              icon={<Binary className="h-5 w-5" />}
              tone="from-emerald-500 to-cyan-500"
              spot="var(--joy-cyan)"
            >
              <TrafficLightArt />
            </ToolTile>
          </div>
          <div data-reveal="up" style={{ "--d": "200ms" } as React.CSSProperties}>
            <ToolTile
              href="/labs"
              title="חומרי עזר למעבדה"
              text="מדריכים וטבלאות חיוניות לצפייה בלחיצה."
              icon={<FlaskConical className="h-5 w-5" />}
              tone="from-rose-500 to-red-600"
              spot="var(--joy-rose)"
            >
              <ul className="grid h-full grid-cols-2 content-center gap-2">
                {LAB_GUIDES.map((g) => (
                  <li key={g.title} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-[11px] font-semibold leading-tight text-text-muted">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${g.dot}`} />
                    {g.title}
                  </li>
                ))}
              </ul>
            </ToolTile>
          </div>
          <div data-reveal="up" className="lg:col-span-3">
            <Link
              href="/labs"
              data-spot
              className="lp-spot group relative block overflow-hidden rounded-[2rem] border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/10 sm:p-8"
              style={{ "--spot": "var(--joy-rose)" } as React.CSSProperties}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="lg:w-72 lg:shrink-0">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white shadow-md">
                    <PlayCircle className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-xl font-extrabold text-text">
                    <span className="num">{c.labs}</span> סרטוני הדרכה למעבדה
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    סרטונים קצרים: סקופ, מולטימטר, מחולל אותות, מגבר שרת ועוד.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 dark:text-primary-200">
                    לכל הסרטונים
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
                  </span>
                </div>
                <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-6">
                  {labs.slice(0, 6).map((l, i) => (
                    <div
                      key={l.id}
                      className={`relative aspect-[9/14] overflow-hidden rounded-2xl bg-surface-2 shadow-md transition-transform duration-500 group-hover:-translate-y-1 ${i % 2 ? "sm:translate-y-4" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${l.youtubeId}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full scale-[1.35] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-rose-600 shadow-lg">
                          <Play className="h-4 w-4 fill-current" />
                        </span>
                      </span>
                      <span className="absolute inset-x-2 bottom-2 line-clamp-2 text-[10px] font-semibold leading-tight text-white">
                        {l.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================= COURSES */}
      <section aria-labelledby="lp-courses-title" className="lp-night overflow-hidden py-24 sm:py-32">
        <div className="container-page">
          <SectionHeading
            id="lp-courses-title"
            eyebrow="קורסי וידאו"
            title="רוצים להעמיק?"
            highlight="קורסים מאת אבי יומטוביאן"
            stack
            sub="שיעורי וידאו מקצועיים: הסברים ברורים ומפורטים שיעזרו לכם להצליח בלימודים."
            dark
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: <Play className="h-5 w-5" />, title: "30 הדקות הראשונות בחינם", text: "צפייה בפרומו בלי הרשמה" },
              { icon: <LayoutDashboard className="h-5 w-5" />, title: "אזור אישי", text: "כל הקורסים שרכשתם במקום אחד" },
              { icon: <History className="h-5 w-5" />, title: "ממשיכים מאיפה שעצרתם", text: "הנגן זוכר את נקודת הצפייה" },
            ].map((f, i) => (
              <div key={f.title} data-reveal="up" style={{ "--d": `${i * 100}ms` } as React.CSSProperties}>
                <div className="flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-500/20 text-accent-400 ring-1 ring-accent-400/30">
                    {f.icon}
                  </span>
                  <div>
                    <div className="font-bold text-white">{f.title}</div>
                    <div className="text-sm text-[#AEB9DC]">{f.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {courses.length > 0 && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course, i) => {
                const dur = durationLabel(course.totalDurationSeconds);
                return (
                  <div key={course.id} data-reveal="tilt" style={{ "--d": `${i * 110}ms` } as React.CSSProperties}>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="lp-tilt group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm hover:border-white/25 hover:bg-white/[0.09] hover:shadow-2xl hover:shadow-accent-500/10"
                    >
                      <div
                        aria-hidden
                        className={`absolute -left-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${COURSE_TONES[i % COURSE_TONES.length]} opacity-40 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-70`}
                      />
                      <div className={`relative h-1 w-14 rounded-full bg-gradient-to-l ${COURSE_TONES[i % COURSE_TONES.length]}`} />
                      <div className="relative mt-5 text-xs font-bold text-[#8894BB] num">קורס 0{i + 1}</div>
                      <h3 className="relative mt-1 text-xl font-extrabold text-white">{course.title}</h3>
                      <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#AEB9DC]">
                        <span className="inline-flex items-center gap-1 num">
                          <PlayCircle className="h-4 w-4" />
                          {course.videoCount} סרטונים
                        </span>
                        {dur && (
                          <span className="inline-flex items-center gap-1 num">
                            <Clock className="h-3.5 w-3.5" />
                            {dur}
                          </span>
                        )}
                      </div>
                      <span className="relative mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-bold text-accent-400">
                        {course.videoCount > 0 ? "לפרטים ולפרומו חינם" : "לפרטים"}
                        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div data-reveal="up">
              <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-bl from-primary-600 via-primary-500 to-accent-500 p-7 shadow-2xl shadow-accent-500/20 sm:p-9">
                <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-400/30 blur-3xl" />
                <div aria-hidden className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-sm">
                    <Video className="h-8 w-8" />
                  </span>
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                      שיעור אישי 1 על 1
                    </div>
                    <h3 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">שיעורים פרטיים בזום</h3>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                      למידה מותאמת אישית, בקצב שלכם, עם הסברים ברורים ומפורטים. מתאים להכנה למבחנים, השלמת פערים או
                      העמקה בנושאים מורכבים.
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:${LESSONS_EMAIL}`}
                  className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Mail className="h-4 w-4" />
                  <span dir="ltr">{LESSONS_EMAIL}</span>
                </a>
              </div>
            </div>
            <div data-reveal="up" style={{ "--d": "120ms" } as React.CSSProperties}>
              <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-sm sm:p-9">
                <div>
                  <h3 className="text-2xl font-extrabold text-white">איך רוכשים קורס?</h3>
                  <ol className="mt-5 space-y-3 text-sm text-[#AEB9DC] sm:text-base">
                    {["נרשמים לאתר", 'בעמוד הקורס לוחצים "לרכישה" ופונים במייל', "הקורס מופיע באזור האישי"].map((t, i) => (
                      <li key={t} className="flex items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-500/20 text-xs font-bold text-accent-400 ring-1 ring-accent-400/30 num">
                          {i + 1}
                        </span>
                        {t}
                      </li>
                    ))}
                  </ol>
                </div>
                <Link
                  href="/courses"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent-500 to-accent-400 px-5 py-3 text-sm font-bold text-[#0B1E3A] shadow-lg shadow-accent-500/25 transition-all duration-300 hover:-translate-y-0.5"
                >
                  לכל הקורסים
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================== HOW TO START */}
      <section aria-labelledby="lp-start-title" className="container-page py-24 sm:py-32">
        <SectionHeading
          id="lp-start-title"
          eyebrow="איך מתחילים?"
          title="שלושה צעדים,"
          highlight="וזהו."
          sub="בלי הרשמה ובלי התחייבות. נכנסים ומתחילים לתרגל."
        />
        <div className="mt-16">
          <StartSteps steps={startSteps} />
        </div>
      </section>

      {/* ============================================================== EXTRAS */}
      <section aria-labelledby="lp-extras-title" className="container-page">
        <h2 id="lp-extras-title" className="sr-only">
          ועוד
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Smartphone className="h-5 w-5" />, title: "מותאם לנייד", text: "ואפשר להוסיף למסך הבית כמו אפליקציה", tone: "text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-300" },
            { icon: <Moon className="h-5 w-5" />, title: "מצב כהה", text: "לימוד נוח לעיניים גם בלילה", tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-300" },
            { icon: <Accessibility className="h-5 w-5" />, title: "תפריט נגישות", text: "גודל טקסט, ניגודיות, עצירת אנימציות ועוד", tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300" },
            { icon: <Search className="h-5 w-5" />, title: "חיפוש מהיר", text: "חיפוש חכם בכל המאגר, מכל עמוד", tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300" },
          ].map((x, i) => (
            <div key={x.title} data-reveal="up" style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
              <div className="flex h-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${x.tone}`}>{x.icon}</span>
                <div>
                  <div className="font-bold text-text">{x.title}</div>
                  <div className="text-sm text-text-muted">{x.text}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= FAQ */}
      <section aria-labelledby="lp-faq-title" className="container-page py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <SectionHeading
              id="lp-faq-title"
              eyebrow="שאלות נפוצות"
              title="יש שאלה?"
              highlight="יש תשובה."
              stack
              sub="לא מצאתם את מה שחיפשתם? כתבו לנו במייל."
              align="start"
            />
            <div data-reveal="up" style={{ "--d": "200ms" } as React.CSSProperties} className="mt-6">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text shadow-sm transition-colors hover:border-primary-300 hover:text-primary-700 dark:hover:text-primary-200"
              >
                <Mail className="h-4 w-4" />
                <span dir="ltr">{CONTACT_EMAIL}</span>
              </a>
            </div>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} data-reveal="up" style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
                <details className="lp-faq group rounded-2xl border border-border bg-surface shadow-sm transition-colors open:border-primary-200 open:shadow-md dark:open:border-primary-400/30">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 text-base font-bold text-text sm:px-6 sm:py-5">
                    {f.q}
                    <span className="lp-faq-icon grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-text-muted group-open:bg-primary-600 group-open:text-white">
                      <Plus className="h-4 w-4" />
                    </span>
                  </summary>
                  <div className="lp-faq-body px-5 pb-5 text-sm leading-7 text-text-muted sm:px-6 sm:text-base">{f.a}</div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ FINAL CTA */}
      <section aria-labelledby="lp-cta-title" className="container-page pb-8">
        <div data-reveal="scale">
          <div className="lp-conic rounded-[2.5rem]">
            <div className="relative overflow-hidden rounded-[calc(2.5rem-2px)] bg-surface px-6 py-16 text-center sm:px-12 sm:py-20">
              <div aria-hidden className="hero-halo absolute inset-0" />
              <div className="relative">
                <div className="mx-auto w-20 animate-hero-bob sm:w-24">
                  <Image src="/images/mark.png" alt="" width={120} height={120} className="h-auto w-full drop-shadow-xl animate-hero-spin" />
                </div>
                <h2 id="lp-cta-title" className="mt-6 text-4xl font-extrabold tracking-tight text-text sm:text-5xl md:text-6xl">
                  מוכנים להתחיל?{" "}
                  <span className="bg-gradient-to-l from-primary-700 via-accent-500 to-fuchsia-500 bg-clip-text text-transparent dark:from-primary-200 dark:via-accent-400 dark:to-fuchsia-400">
                    פשוט להבין.
                  </span>
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-text-muted">
                  המאגר פתוח לכולם, בחינם. בוחרים מבחן ומתחילים לתרגל, עכשיו.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/exams"
                    className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-l from-primary-700 via-primary-600 to-accent-500 px-8 text-base font-bold text-white shadow-xl shadow-primary-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                    <span className="relative">התחילו ללמוד, בחינם</span>
                    <ArrowLeft className="relative h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-7 text-base font-bold text-text transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
                  >
                    <BookOpen className="h-5 w-5 text-primary-500 dark:text-primary-200" />
                    הרשמה לאתר
                  </Link>
                </div>
                <div className="mt-10 flex items-center justify-center gap-3 text-sm text-text-subtle">
                  <span>עקבו אחרינו:</span>
                  <a
                    href="https://www.youtube.com/@yomtov7"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-rose-500/10 dark:text-rose-400"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                      <path d="m9.545 15.568 6.273-3.568-6.273-3.568v7.136z" fill="white" />
                    </svg>
                  </a>
                  <a
                    href="https://www.tiktok.com/@avi_yomtovian"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="grid h-11 w-11 place-items-center rounded-xl bg-fuchsia-50 text-fuchsia-600 transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-fuchsia-500/10 dark:text-fuchsia-400"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.18z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function SectionHeading({
  id,
  eyebrow,
  title,
  highlight,
  sub,
  dark = false,
  align = "center",
  stack = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  sub?: string;
  dark?: boolean;
  align?: "center" | "start";
  /** Put the highlighted phrase on its own line (avoids one-word orphans). */
  stack?: boolean;
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-xl"}>
      <div data-reveal="up">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold tracking-wide sm:text-sm ${
            dark
              ? "border border-accent-400/30 bg-accent-500/10 text-accent-400"
              : "border border-primary-100 bg-primary-50 text-primary-700 dark:border-primary-400/25 dark:bg-primary-500/10 dark:text-primary-200"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-accent-400" : "bg-accent-500"}`} />
          {eyebrow}
        </span>
      </div>
      <h2
        id={id}
        data-reveal="blur"
        style={{ "--d": "90ms" } as React.CSSProperties}
        className={`mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl ${dark ? "text-white" : "text-text"}`}
      >
        {title}{" "}
        <span
          className={`bg-gradient-to-l bg-clip-text pb-1 text-transparent ${stack ? "block" : ""} ${
            dark
              ? "from-accent-400 via-fuchsia-400 to-amber-300"
              : "from-primary-700 via-accent-500 to-fuchsia-500 dark:from-primary-200 dark:via-accent-400 dark:to-fuchsia-400"
          }`}
        >
          {highlight}
        </span>
      </h2>
      {sub && (
        <p
          data-reveal="up"
          style={{ "--d": "180ms" } as React.CSSProperties}
          className={`mt-5 text-lg leading-8 ${dark ? "text-[#AEB9DC]" : "text-text-muted"}`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function SubjectTile({
  href,
  title,
  description,
  color,
  icon,
  chips,
  watermark,
  big = false,
  extra,
}: {
  href: string;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  chips: string[];
  watermark: string | null;
  big?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      data-spot
      className={`lp-spot group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:border-primary-400/30 ${big ? "p-8" : "p-6"}`}
    >
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l ${color}`} />
      <div
        aria-hidden
        className={`pointer-events-none absolute -left-16 -top-16 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-40 ${big ? "h-72 w-72" : "h-44 w-44"}`}
      />
      {watermark && (
        <span
          aria-hidden
          className={`pointer-events-none absolute -bottom-6 left-3 font-extrabold leading-none text-text opacity-[0.05] num ${big ? "text-[8rem] sm:text-[12rem]" : "text-[7rem]"}`}
        >
          {watermark}
        </span>
      )}
      <div className="relative flex items-start justify-between">
        <span
          className={`grid place-items-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${big ? "h-20 w-20" : "h-14 w-14"}`}
        >
          {icon}
        </span>
        <ArrowLeft className="h-5 w-5 text-text-subtle transition-all duration-300 group-hover:-translate-x-1.5 group-hover:text-primary-600" />
      </div>
      {extra}
      <div className="relative mt-auto pt-6">
        <h3 className={`font-extrabold text-text ${big ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>{title}</h3>
        <p className={`mt-2 leading-6 text-text-muted ${big ? "max-w-md text-base" : "text-sm"}`}>{description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {chips.map((ch) => (
            <span
              key={ch}
              className="rounded-full border border-border bg-surface-2/70 px-2.5 py-1 text-xs font-semibold text-text-muted num transition-colors group-hover:border-primary-200 group-hover:bg-primary-50 group-hover:text-primary-700 dark:group-hover:border-primary-400/30 dark:group-hover:bg-primary-500/10 dark:group-hover:text-primary-200"
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function ToolTile({
  href,
  title,
  text,
  icon,
  tone,
  spot,
  children,
}: {
  href: string;
  title: string;
  text: string;
  icon: React.ReactNode;
  tone: string;
  spot: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      data-spot
      className="lp-spot group flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:border-primary-400/30"
      style={{ "--spot": spot } as React.CSSProperties}
    >
      <div className="h-44 border-b border-border bg-surface-2/50 p-5">{children}</div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
            {icon}
          </span>
          <h3 className="text-lg font-extrabold text-text">{title}</h3>
          <ArrowLeft className="mr-auto h-5 w-5 text-text-subtle transition-all duration-300 group-hover:-translate-x-1.5 group-hover:text-primary-600" />
        </div>
        <p className="mt-3 text-sm leading-6 text-text-muted">{text}</p>
      </div>
    </Link>
  );
}

function RecentExamsList({ exams: list }: { exams: Exam[] }) {
  return (
    <div className="relative mt-8 hidden max-w-md space-y-2 sm:block">
      <div className="text-xs font-bold text-text-subtle">המבחנים האחרונים במאגר</div>
      {list.map((e, i) => (
        <div
          key={e.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface/80 px-3 py-2.5 shadow-sm backdrop-blur transition-transform duration-300 group-hover:-translate-x-1"
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <FileText className={`h-4 w-4 shrink-0 ${SOURCE_DOT[e.source]}`} />
          <span className="truncate text-sm font-bold text-text">{examLabel(e)}</span>
          {e.solution && (
            <span className="mr-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              פתרון
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
