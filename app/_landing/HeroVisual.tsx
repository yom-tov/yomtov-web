"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Calculator, Cpu, FileText, PlayCircle, Sparkles, BookOpen } from "lucide-react";

type Chip = {
  icon: React.ReactNode;
  title: string;
  sub: string;
  pos: string;
  depth: number;
  float: { dur: string; d: string; r: string };
  tone: string;
};

/**
 * The hero's right-hand visual: the brand mark spinning inside orbit rings,
 * surrounded by floating "chips" that name real things on the site. Every
 * layer drifts with the pointer at its own depth (CSS vars --mx/--my).
 */
export function HeroVisual({
  latestExam,
  labsCount,
  formulasCount,
}: {
  latestExam: string;
  labsCount: number;
  formulasCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (ev: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = (ev.clientX / window.innerWidth) * 2 - 1;
        const y = (ev.clientY / window.innerHeight) * 2 - 1;
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const chips: Chip[] = [
    {
      icon: <FileText className="h-4 w-4" />,
      title: 'מבחן מה"ט',
      sub: latestExam,
      pos: "top-[4%] right-[2%]",
      depth: -26,
      float: { dur: "6.5s", d: "0s", r: "-3deg" },
      tone: "from-primary-600 to-primary-500",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: "פתרון זמין",
      sub: "לצפייה ולהורדה",
      pos: "top-[30%] -left-[4%]",
      depth: 30,
      float: { dur: "7s", d: "-2s", r: "4deg" },
      tone: "from-emerald-500 to-teal-500",
    },
    {
      icon: <Calculator className="h-4 w-4" />,
      title: "מחשבון הנדסי",
      sub: "מספרים מרוכבים ועוד",
      pos: "bottom-[16%] right-[-2%]",
      depth: 22,
      float: { dur: "6s", d: "-1s", r: "2deg" },
      tone: "from-amber-500 to-orange-500",
    },
    {
      icon: <Cpu className="h-4 w-4" />,
      title: "סימולטור מעגלים",
      sub: "בזמן אמת",
      pos: "bottom-[2%] left-[16%]",
      depth: -18,
      float: { dur: "7.5s", d: "-3s", r: "-2deg" },
      tone: "from-lime-500 to-green-600",
    },
    {
      icon: <PlayCircle className="h-4 w-4" />,
      title: `${labsCount} סרטוני מעבדה`,
      sub: "סקופ, מולטימטר ועוד",
      pos: "top-[-2%] left-[14%]",
      depth: 16,
      float: { dur: "8s", d: "-4s", r: "3deg" },
      tone: "from-rose-500 to-fuchsia-500",
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      title: `${formulasCount} נוסחאונים`,
      sub: "וסיכומים",
      pos: "top-[56%] right-[-6%]",
      depth: -30,
      float: { dur: "6.8s", d: "-2.5s", r: "-4deg" },
      tone: "from-violet-500 to-indigo-500",
    },
  ];

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative mx-auto aspect-square w-full max-w-[320px] select-none sm:max-w-[420px] lg:max-w-[520px]"
    >
      {/* rotating rainbow glow */}
      <div className="lp-parallax absolute inset-[12%]" style={{ "--depth": "-10px" } as React.CSSProperties}>
        <div
          className="lp-spin h-full w-full rounded-full opacity-50 blur-3xl dark:opacity-60"
          style={{
            "--dur": "18s",
            background:
              "conic-gradient(from 0deg, #F43F5E, #F59E0B, #10B981, #06B6D4, #8B5CF6, #D946EF, #F43F5E)",
          } as React.CSSProperties}
        />
      </div>

      {/* orbit rings */}
      <div className="lp-parallax absolute inset-[6%]" style={{ "--depth": "8px" } as React.CSSProperties}>
        <svg viewBox="0 0 200 200" className="lp-spin h-full w-full" style={{ "--dur": "60s" } as React.CSSProperties}>
          <circle cx="100" cy="100" r="98" fill="none" stroke="var(--border-strong)" strokeWidth="0.6" strokeDasharray="2 5" />
        </svg>
      </div>
      <div className="lp-parallax absolute inset-[16%]" style={{ "--depth": "14px" } as React.CSSProperties}>
        <svg viewBox="0 0 200 200" className="lp-spin-rev h-full w-full" style={{ "--dur": "36s" } as React.CSSProperties}>
          <circle cx="100" cy="100" r="98" fill="none" stroke="var(--border)" strokeWidth="0.8" />
          <circle cx="100" cy="2" r="3.2" fill="var(--joy-cyan)" />
          <circle cx="198" cy="100" r="2.6" fill="var(--joy-fuchsia)" />
          <circle cx="30" cy="170" r="2.2" fill="var(--joy-amber)" />
        </svg>
      </div>

      {/* the mark */}
      <div className="lp-parallax absolute inset-[24%]" style={{ "--depth": "-16px" } as React.CSSProperties}>
        <div className="h-full w-full animate-hero-bob">
          <Image
            src="/images/mark.png"
            alt=""
            width={320}
            height={320}
            priority
            className="h-full w-full object-contain drop-shadow-[0_24px_40px_rgba(15,23,42,0.28)] animate-hero-spin"
          />
        </div>
      </div>

      {/* floating chips */}
      {chips.map((c) => (
        <div
          key={c.title}
          className={`lp-parallax absolute ${c.pos}`}
          style={{ "--depth": `${c.depth}px` } as React.CSSProperties}
        >
          <div
            className="lp-float flex items-center gap-2.5 rounded-2xl border border-border bg-surface/85 px-3 py-2 shadow-lg shadow-primary-900/10 backdrop-blur-md sm:px-3.5 sm:py-2.5"
            style={{ "--dur": c.float.dur, "--d": c.float.d, "--r": c.float.r } as React.CSSProperties}
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${c.tone} text-white shadow-sm sm:h-8 sm:w-8`}>
              {c.icon}
            </span>
            <span className="leading-tight">
              <span className="block whitespace-nowrap text-[11px] font-bold text-text sm:text-xs">{c.title}</span>
              <span className="block whitespace-nowrap text-[10px] text-text-subtle sm:text-[11px]">{c.sub}</span>
            </span>
          </div>
        </div>
      ))}

      {/* mini oscilloscope */}
      <div className="lp-parallax absolute bottom-[26%] left-[-8%] hidden sm:block" style={{ "--depth": "34px" } as React.CSSProperties}>
        <div
          className="lp-float led-display w-36 overflow-hidden rounded-xl p-2"
          data-color="cyan"
          style={{ "--dur": "7.2s", "--d": "-1.5s", "--r": "-3deg" } as React.CSSProperties}
        >
          <svg viewBox="0 0 120 40" className="h-10 w-full overflow-visible">
            <path
              className="lp-wave"
              d={sinePath(240, 40, 4)}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              style={{ "--dur": "1.6s" } as React.CSSProperties}
            />
          </svg>
          <div className="mt-0.5 flex justify-between text-[9px] opacity-80" dir="ltr">
            <span>CH1</span>
            <span>1kHz</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function sinePath(width: number, height: number, periods: number) {
  const pts: string[] = [];
  const samples = periods * 24;
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * width;
    const y = height / 2 - Math.sin((i / samples) * periods * Math.PI * 2) * (height * 0.38);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(" ");
}
