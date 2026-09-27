/**
 * Hero backdrop: faint PCB traces running in from the edges, each carrying a
 * glowing pulse of "current" in one of the logo's rainbow colours.
 */
const TRACES: { d: string; color: string; dur: string; delay: string }[] = [
  { d: "M0 170 H250 L310 230 H520", color: "var(--joy-cyan)", dur: "5.5s", delay: "0s" },
  { d: "M0 640 H170 L230 580 H410 L470 520", color: "var(--joy-fuchsia)", dur: "6.5s", delay: "-2s" },
  { d: "M1440 110 H1210 L1150 170 H990", color: "var(--joy-amber)", dur: "6s", delay: "-1s" },
  { d: "M1440 720 H1270 L1210 660 H1050 L990 600", color: "var(--joy-emerald)", dur: "7s", delay: "-3.5s" },
  { d: "M290 900 V790 L350 730 H560", color: "var(--joy-violet)", dur: "5s", delay: "-1.5s" },
  { d: "M1110 0 V80 L1170 140 H1320", color: "var(--joy-rose)", dur: "5.8s", delay: "-4s" },
  { d: "M720 900 V830 L780 770 H900", color: "var(--joy-cyan)", dur: "4.6s", delay: "-2.8s" },
  { d: "M0 400 H90 L130 440 H200", color: "var(--joy-amber)", dur: "4.2s", delay: "-0.6s" },
];

/** Final absolute point of an M/L/H/V path — where the trace's via sits. */
function endPoint(d: string): [number, number] {
  let x = 0;
  let y = 0;
  const tokens = d.match(/[MLHV]|-?\d+(\.\d+)?/g)!;
  let cmd = "M";
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/[MLHV]/.test(t)) {
      cmd = t;
      continue;
    }
    if (cmd === "H") x = Number(t);
    else if (cmd === "V") y = Number(t);
    else {
      x = Number(t);
      y = Number(tokens[++i]);
    }
  }
  return [x, y];
}

export function CircuitBackdrop() {
  return (
    <svg
      aria-hidden
      className="lp-circuit pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      {TRACES.map((t) => {
        const [x, y] = endPoint(t.d);
        return (
          <g key={t.d}>
            <path d={t.d} className="lp-trace" pathLength={100} />
            <path
              d={t.d}
              className="lp-pulse"
              pathLength={100}
              style={{ color: t.color, "--dur": t.dur, "--d": t.delay } as React.CSSProperties}
            />
            <circle cx={x} cy={y} r="5" className="lp-via" />
          </g>
        );
      })}
    </svg>
  );
}
