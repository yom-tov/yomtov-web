"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Eye, FileText, Filter, Search, Sparkles } from "lucide-react";
import { TypingSearch } from "./ToolWidgets";

export type StoryExam = { label: string; sub: string; solved: boolean };

type Props = {
  exams: StoryExam[];
  searchWords: string[];
  filter: {
    subjects: { label: string; active: boolean }[];
    sources: { label: string; active: boolean }[];
    years: { label: string; active: boolean }[];
    results: StoryExam[];
  };
  pdf: { title: string; sub: string; examSize: string; solutionSize: string };
  solutionPct: number;
};

const URLS = ["yomtovian.com/search", "yomtovian.com/exams", "yomtovian.com/electricity/mahat-exams", "yomtovian.com/electricity/mahat-exams"];

/**
 * Sticky scroll story: four short steps on one side, a mock browser on the
 * other whose screen follows whichever step is at the viewport's centre
 * line. Below lg the mock is shown inline under each step instead.
 */
export function ExamStory(props: Props) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const el of stepRefs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  const steps = [
    {
      icon: <Search className="h-5 w-5" />,
      title: "מחפשים",
      text: "חיפוש חופשי בכל המאגר: לפי שנה, מועד, נושא או שם. החיפוש חכם ומוצא תוצאות גם כשיש שגיאת הקלדה.",
      tone: "from-primary-600 to-accent-500",
    },
    {
      icon: <Filter className="h-5 w-5" />,
      title: "מסננים",
      text: "פילטרים לפי תחום, מקור המבחן, שנה ומועד, ומגיעים בדיוק למבחן שצריך.",
      tone: "from-fuchsia-500 to-violet-500",
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: "צופים ומורידים",
      text: "תצוגה מקדימה של ה-PDF ישר בדפדפן, והורדה בלחיצה אחת.",
      tone: "from-amber-500 to-orange-500",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "בודקים מול הפתרון",
      text:
        props.solutionPct === 100
          ? "לכל מבחן במאגר מצורף קובץ פתרון. פותרים לבד, ובודקים את עצמכם מול הפתרון."
          : `${props.solutionPct}% מהמבחנים במאגר מגיעים עם קובץ פתרון. פותרים לבד, ובודקים את עצמכם מול הפתרון.`,
      tone: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        {steps.map((s, i) => (
          <div
            key={s.title}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            data-step={i}
            className="flex flex-col justify-center py-6 lg:min-h-[64vh] lg:py-0"
          >
            <div
              className={`transition-all duration-500 lg:border-r-2 lg:pr-6 ${
                active === i ? "lg:border-accent-500 lg:opacity-100" : "lg:border-border lg:opacity-40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${s.tone} text-white shadow-lg`}>
                  {s.icon}
                </span>
                <span className="text-sm font-bold text-text-subtle num">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-2xl font-extrabold text-text sm:text-3xl">{s.title}</h3>
              <p className="mt-3 max-w-md text-base leading-7 text-text-muted">{s.text}</p>
            </div>
            <div className="mt-6 lg:hidden">
              <BrowserFrame url={URLS[i]}>
                <Screen index={i} active {...props} />
              </BrowserFrame>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-15rem)]">
          <BrowserFrame url={URLS[active]}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  active === i ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 translate-y-4 scale-[0.98]"
                }`}
              >
                <Screen index={i} active={active === i} {...props} />
              </div>
            ))}
          </BrowserFrame>
          <div className="mt-5 flex justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${active === i ? "w-8 bg-accent-500" : "w-1.5 bg-border-strong"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-primary-900/15 ring-1 ring-black/5 dark:ring-white/5">
      <div className="flex items-center gap-3 border-b border-border bg-surface-2/70 px-4 py-3">
        <div className="flex gap-1.5" dir="ltr">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div
          className="flex-1 truncate rounded-lg border border-border bg-surface px-3 py-1 text-left text-xs text-text-subtle transition-all"
          dir="ltr"
        >
          🔒 {url}
        </div>
      </div>
      <div className="relative h-[370px] sm:h-[420px]">{children}</div>
    </div>
  );
}

function Screen({ index, active, exams, searchWords, filter, pdf, solutionPct }: Props & { index: number; active: boolean }) {
  if (index === 0) return <SearchScreen exams={exams} words={searchWords} />;
  if (index === 1) return <FilterScreen filter={filter} active={active} />;
  if (index === 2) return <PdfScreen pdf={pdf} />;
  return <SolutionScreen pdf={pdf} solutionPct={solutionPct} />;
}

function ExamRow({ exam, delay = 0 }: { exam: StoryExam; delay?: number }) {
  return (
    <div
      className="lp-rise flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm"
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
        <FileText className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-text">{exam.label}</div>
        <div className="truncate text-xs text-text-subtle num">{exam.sub}</div>
      </div>
      {exam.solved && (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          פתרון
        </span>
      )}
    </div>
  );
}

function SearchScreen({ exams, words }: { exams: StoryExam[]; words: string[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query) return [];
    const tokens = query.split(/\s+/).filter(Boolean);
    return exams.filter((e) => tokens.every((t) => `${e.label} ${e.sub}`.includes(t))).slice(0, 3);
  }, [exams, query]);

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-3 rounded-2xl border-2 border-primary-200 bg-surface px-4 py-3 shadow-sm dark:border-primary-400/30">
        <Search className="h-5 w-5 text-primary-500" />
        <span className="flex-1 text-base text-text">
          <TypingSearch words={words} onWord={setQuery} />
        </span>
      </div>
      <div className="mt-5 text-xs font-semibold text-text-subtle">
        {results.length > 0 ? `תוצאות עבור "${query}"` : "מחפש…"}
      </div>
      <div className="mt-3 space-y-2.5" key={query}>
        {results.map((r, i) => (
          <ExamRow key={r.label + r.sub} exam={r} delay={i * 110} />
        ))}
      </div>
    </div>
  );
}

function Chips({ label, items }: { label: string; items: { label: string; active: boolean }[] }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold text-text-subtle">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((c) => (
          <span
            key={c.label}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold num transition-colors ${
              c.active
                ? "border-primary-600 bg-primary-600 text-white shadow-sm shadow-primary-500/30"
                : "border-border bg-surface text-text-muted"
            }`}
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FilterScreen({ filter, active }: { filter: Props["filter"]; active: boolean }) {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4 p-5 sm:p-6">
      <div className="grid gap-3 rounded-2xl border border-border bg-surface-2/50 p-4">
        <Chips label="תחום" items={filter.subjects} />
        <Chips label="מקור" items={filter.sources} />
        <Chips label="שנה" items={filter.years} />
      </div>
      <div className="space-y-2.5 overflow-hidden" key={String(active)}>
        {filter.results.slice(0, 2).map((r, i) => (
          <ExamRow key={r.label + r.sub} exam={r} delay={150 + i * 110} />
        ))}
      </div>
    </div>
  );
}

function PdfScreen({ pdf }: { pdf: Props["pdf"] }) {
  return (
    <div className="grid h-full grid-cols-[1fr_150px] gap-4 p-5 sm:grid-cols-[1fr_170px] sm:p-6">
      {/* page */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-white p-4 shadow-inner dark:bg-[#F4F6FB]">
        <div className="text-center text-[11px] font-bold text-slate-800">{pdf.title}</div>
        <div className="mt-0.5 text-center text-[10px] text-slate-500 num">{pdf.sub}</div>
        <div className="mt-4 space-y-2">
          {[92, 80, 86, 60].map((w, i) => (
            <div key={i} className="h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
          ))}
        </div>
        <svg viewBox="0 0 200 80" className="mx-auto mt-4 w-4/5" aria-hidden>
          <path
            d="M20 60 V20 H60 L65 12 L75 28 L85 12 L95 28 L100 20 H140 V60 H20 M140 20 H180 V60 H140"
            fill="none"
            stroke="#334155"
            strokeWidth="2"
          />
          <circle cx="20" cy="40" r="7" fill="white" stroke="#334155" strokeWidth="2" />
          <path d="M175 36 h10 M175 44 h10" stroke="#334155" strokeWidth="2" />
          <text x="72" y="8" fontSize="8" fill="#475569">R1</text>
        </svg>
        <div className="mt-4 space-y-2">
          {[88, 70, 94].map((w, i) => (
            <div key={i} className="h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-[#F4F6FB]" />
      </div>
      {/* sidebar */}
      <div className="flex flex-col gap-2.5">
        <div className="rounded-xl border-2 border-primary-300 bg-primary-50/50 p-3 dark:border-primary-500/50 dark:bg-primary-500/10">
          <FileText className="h-4 w-4 text-primary-600 dark:text-primary-300" />
          <div className="mt-2 text-xs font-bold text-text">שאלון</div>
          <div className="text-[10px] text-text-subtle num" dir="ltr">PDF · {pdf.examSize}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <div className="mt-2 text-xs font-bold text-text">פתרון</div>
          <div className="text-[10px] text-text-subtle num" dir="ltr">PDF · {pdf.solutionSize}</div>
        </div>
        <div className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-500/30">
          <Download className="h-3.5 w-3.5" />
          הורדת PDF
        </div>
      </div>
    </div>
  );
}

function SolutionScreen({ pdf, solutionPct }: { pdf: Props["pdf"]; solutionPct: number }) {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden p-6">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10" />
      <div className="relative h-56 w-72">
        <div className="absolute right-0 top-0 h-48 w-40 rotate-[-6deg] rounded-xl border border-border bg-white p-3 shadow-lg dark:bg-[#F4F6FB]">
          <div className="text-[10px] font-bold text-slate-700">שאלון</div>
          <div className="mt-3 space-y-1.5">
            {[90, 70, 84, 64, 78, 58].map((w, i) => (
              <div key={i} className="h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        <div className="absolute left-0 top-6 h-48 w-40 rotate-[5deg] rounded-xl border-2 border-emerald-300 bg-white p-3 shadow-xl shadow-emerald-500/20 dark:bg-[#F4F6FB]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700">פתרון</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 space-y-2">
            {["R = 4.7kΩ", "I = 2.1mA", "V = 9.87V"].map((l) => (
              <div key={l} className="flex items-center gap-1.5 text-[10px] text-slate-600" dir="ltr">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                <span className="font-mono">{l}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {[80, 62, 74].map((w, i) => (
              <div key={i} className="h-1.5 rounded bg-emerald-100" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="relative -mt-2 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          פתרון זמין
        </div>
        <div className="mt-2 text-sm font-bold text-text">
          <span className="num">{solutionPct}%</span> מהמבחנים עם פתרון
        </div>
        <div className="mt-0.5 text-xs text-text-subtle">{pdf.title}</div>
      </div>
    </div>
  );
}
