/**
 * Small, CSS-only animated illustrations for the tools bento. Each one is a
 * stylised nod to the real tool it links to — none of them are interactive.
 */

function wavePath(fn: (t: number) => number, width: number, height: number, amp: number, samples = 200) {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * Math.PI * 4; // two periods
    const x = (i / samples) * width;
    const y = height / 2 - fn(t) * amp;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Battery → resistor → LED loop with electrons marching around it. */
export function CircuitArt() {
  const loop = "M40 30 H100 L106 20 L118 40 L130 20 L142 40 L154 20 L160 30 H240 V110 H40 Z";
  return (
    <svg viewBox="0 0 280 140" className="h-full w-full" aria-hidden>
      <path d={loop} fill="none" stroke="var(--border-strong)" strokeWidth="3" strokeLinejoin="round" />
      <path d={loop} className="lp-electrons" stroke="var(--joy-cyan)" strokeWidth="3.2" strokeLinejoin="round" />
      {/* battery */}
      <rect x="28" y="56" width="24" height="28" rx="4" fill="var(--surface)" />
      <line x1="30" y1="62" x2="50" y2="62" stroke="var(--text)" strokeWidth="3" />
      <line x1="34" y1="70" x2="46" y2="70" stroke="var(--text)" strokeWidth="3" />
      <line x1="30" y1="78" x2="50" y2="78" stroke="var(--text)" strokeWidth="3" />
      <text x="58" y="74" fontSize="11" fill="var(--text-subtle)" fontFamily="ui-monospace, monospace">9V</text>
      <text x="118" y="14" fontSize="11" fill="var(--text-subtle)" fontFamily="ui-monospace, monospace">1kΩ</text>
      {/* LED */}
      <rect x="226" y="52" width="28" height="36" rx="6" fill="var(--surface)" />
      <circle cx="240" cy="70" r="16" fill="var(--joy-emerald)" opacity="0.35" className="lp-glow-pulse" />
      <path d="M232 62 L248 62 L240 76 Z" fill="var(--joy-emerald)" />
      <line x1="232" y1="78" x2="248" y2="78" stroke="var(--joy-emerald)" strokeWidth="2.5" />
      <path d="M252 58 l8 -8 M256 64 l8 -8" stroke="var(--joy-emerald)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Three odd harmonics adding up to (almost) a square wave — Fourier. */
export function FourierArt() {
  const W = 480;
  const H = 120;
  const h1 = wavePath((t) => Math.sin(t), W, H, 22);
  const h3 = wavePath((t) => Math.sin(3 * t) / 3, W, H, 22);
  const h5 = wavePath((t) => Math.sin(5 * t) / 5, W, H, 22);
  const sum = wavePath(
    (t) => (Math.sin(t) + Math.sin(3 * t) / 3 + Math.sin(5 * t) / 5 + Math.sin(7 * t) / 7) * 1.25,
    W,
    H,
    30,
    400,
  );
  return (
    <svg viewBox={`0 0 ${W / 2} ${H}`} className="h-full w-full overflow-hidden" aria-hidden>
      <line x1="0" y1={H / 2} x2={W / 2} y2={H / 2} stroke="var(--border)" strokeDasharray="3 5" />
      <path d={h1} className="lp-wave" fill="none" stroke="var(--joy-cyan)" strokeWidth="1.5" opacity="0.7" style={{ "--dur": "5s" } as React.CSSProperties} />
      <path d={h3} className="lp-wave" fill="none" stroke="var(--joy-fuchsia)" strokeWidth="1.5" opacity="0.7" style={{ "--dur": "5s" } as React.CSSProperties} />
      <path d={h5} className="lp-wave" fill="none" stroke="var(--joy-amber)" strokeWidth="1.5" opacity="0.7" style={{ "--dur": "5s" } as React.CSSProperties} />
      <path
        d={sum}
        className="lp-wave"
        fill="none"
        stroke="var(--primary-500)"
        strokeWidth="3"
        strokeLinejoin="round"
        style={{ "--dur": "5s", filter: "drop-shadow(0 0 6px rgba(34,70,197,0.45))" } as React.CSSProperties}
      />
    </svg>
  );
}

/** Traffic light + clock signal — the digital (sequential logic) simulator. */
export function TrafficLightArt() {
  const clock: string[] = [];
  for (let i = 0; i < 8; i++) {
    const x = i * 30;
    clock.push(`${i === 0 ? "M" : "L"}${x} 30 L${x} 8 L${x + 15} 8 L${x + 15} 30`);
  }
  return (
    <div className="flex h-full items-center justify-center gap-5" aria-hidden>
      <div className="grid gap-2 rounded-2xl bg-[#0B1220] p-2.5 shadow-inner ring-1 ring-white/10">
        <span className="lp-tl-red h-7 w-7 rounded-full bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.9)]" />
        <span className="lp-tl-yellow h-7 w-7 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)]" />
        <span className="lp-tl-green h-7 w-7 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
      </div>
      <div className="flex-1 max-w-[140px]">
        <div className="mb-1 text-[10px] font-semibold text-text-subtle" dir="ltr">CLK</div>
        <svg viewBox="0 0 120 38" className="h-9 w-full overflow-hidden">
          <path d={clock.join(" ")} className="lp-wave" fill="none" stroke="var(--joy-emerald)" strokeWidth="2" style={{ "--dur": "2s" } as React.CSSProperties} />
        </svg>
        <div className="mt-2 flex gap-1.5" dir="ltr">
          {["Q0", "Q1"].map((q) => (
            <span key={q} className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
              {q}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
