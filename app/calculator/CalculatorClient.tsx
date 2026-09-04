"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator,
  Check,
  Combine,
  Delete,
  Minus,
  Plus,
  RotateCcw,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

type Tab = "ohm" | "series" | "parallel";

const TAB_TONES: Record<Tab, string> = {
  ohm: "from-amber-500 to-orange-500",
  series: "from-emerald-500 to-teal-500",
  parallel: "from-fuchsia-500 to-violet-500",
};

export function CalculatorClient() {
  const [tab, setTab] = useState<Tab>("ohm");
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <div
        aria-hidden
        className={clsx(
          "h-1 bg-gradient-to-l transition-colors duration-300",
          TAB_TONES[tab]
        )}
      />
      <div className="flex flex-wrap gap-1 border-b border-border p-2">
        <TabButton current={tab} value="ohm" onSelect={setTab} icon={<Zap className="h-4 w-4" />}>
          חוק אוהם
        </TabButton>
        <TabButton
          current={tab}
          value="series"
          onSelect={setTab}
          icon={<Combine className="h-4 w-4" />}
        >
          נגדים בטור
        </TabButton>
        <TabButton
          current={tab}
          value="parallel"
          onSelect={setTab}
          icon={<Calculator className="h-4 w-4" />}
        >
          נגדים במקביל
        </TabButton>
      </div>
      <div className="p-4 sm:p-6">
        {tab === "ohm" && <OhmsLaw />}
        {tab === "series" && <ResistorCombo mode="series" />}
        {tab === "parallel" && <ResistorCombo mode="parallel" />}
      </div>
    </div>
  );
}

function TabButton({
  current,
  value,
  onSelect,
  icon,
  children,
}: {
  current: Tab;
  value: Tab;
  onSelect: (t: Tab) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-primary-50 text-primary-700"
          : "text-text-muted hover:bg-surface-2 hover:text-text"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Shared: DigitalDisplay + Stepper + KeyPad
// -----------------------------------------------------------------------------
type LedColor = "amber" | "emerald" | "fuchsia" | "cyan";

function fmtLED(n: number | null | undefined, unit: string): string {
  if (n == null || isNaN(n)) return unit === "Ω" ? "----.-" : "--.--";
  if (unit === "Ω") {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}k`;
    return n.toFixed(1);
  }
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(2);
  return n.toFixed(3);
}

function DigitalDisplay({
  value,
  unit,
  color,
  label,
  active,
  onClick,
  size = "md",
  computed = false,
  flashKey,
}: {
  value: number | null;
  unit: string;
  color: LedColor;
  label: string;
  active?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  computed?: boolean;
  flashKey?: string | number;
}) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (flashKey == null) return;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 350);
    return () => clearTimeout(id);
  }, [flashKey]);

  const sizeCls = {
    sm: "px-3 py-2 text-2xl",
    md: "px-4 py-3 text-3xl",
    lg: "px-6 py-5 text-5xl",
  }[size];
  const unitSize = { sm: "text-xs", md: "text-sm", lg: "text-lg" }[size];
  const labelSize = { sm: "text-[10px]", md: "text-[11px]", lg: "text-xs" }[size];

  const El: React.ElementType = onClick ? "button" : "div";
  return (
    <El
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={`${label}${value == null ? "" : ` ${value} ${unit}`}`}
      className={clsx(
        "led-display group relative flex w-full flex-col items-stretch gap-1 rounded-2xl font-black leading-none",
        sizeCls,
        active && "ring-2 ring-offset-2 ring-offset-surface",
        active && color === "amber" && "ring-amber-400",
        active && color === "emerald" && "ring-emerald-400",
        active && color === "fuchsia" && "ring-fuchsia-400",
        active && color === "cyan" && "ring-cyan-400",
        onClick && !active && "cursor-text hover:brightness-125"
      )}
      data-color={color}
    >
      <span
        className={clsx(
          "self-start opacity-70",
          labelSize,
          "font-mono tracking-widest"
        )}
      >
        {label}
        {computed && <span className="ms-1 text-emerald-400">●</span>}
      </span>
      <span
        aria-live="polite"
        className={clsx(
          "flex items-baseline justify-between gap-2 num",
          flash && "animate-led-flash"
        )}
      >
        <span>{fmtLED(value, unit)}</span>
        <span className={clsx("opacity-80", unitSize)}>{unit}</span>
      </span>
    </El>
  );
}

function Stepper({
  value,
  onChange,
  step,
  min = 0,
  disabled,
}: {
  value: number | null;
  onChange: (v: number) => void;
  step: number;
  min?: number;
  disabled?: boolean;
}) {
  const bump = (delta: number) => {
    const base = value ?? 0;
    const next = Math.max(min, +(base + delta).toPrecision(6));
    onChange(next);
  };
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-border">
      <button
        type="button"
        onClick={() => bump(-step)}
        disabled={disabled}
        aria-label="הקטן"
        className="grid h-9 w-9 place-items-center text-text-muted transition-colors hover:bg-surface-2 hover:text-primary-700 disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="grid h-9 w-14 place-items-center border-x border-border bg-surface-2/50 text-[11px] font-mono text-text-subtle">
        ±{step}
      </div>
      <button
        type="button"
        onClick={() => bump(step)}
        disabled={disabled}
        aria-label="הגדל"
        className="grid h-9 w-9 place-items-center text-text-muted transition-colors hover:bg-surface-2 hover:text-primary-700 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function PresetChips({
  presets,
  onPick,
}: {
  presets: { label: string; value: number }[];
  onPick: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          className="chip"
          onClick={() => onPick(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function KeyPad({
  onKey,
}: {
  onKey: (k: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "back" | "clear") => void;
}) {
  const keys: (
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "0"
    | "."
    | "back"
  )[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface-2/50 p-3">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          className="grid h-11 place-items-center rounded-lg border border-border bg-surface text-lg font-bold text-text transition-transform hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50 active:translate-y-0"
        >
          {k === "back" ? <Delete className="h-5 w-5" /> : k}
        </button>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Ohm's law — triangular calculator with three LED displays
// -----------------------------------------------------------------------------
type OhmField = "v" | "i" | "r";

const OHM_STEPS: Record<OhmField, number> = { v: 1, i: 0.1, r: 100 };
const OHM_PRESETS: Record<OhmField, { label: string; value: number }[]> = {
  v: [
    { label: "5V", value: 5 },
    { label: "12V", value: 12 },
    { label: "24V", value: 24 },
    { label: "230V", value: 230 },
  ],
  i: [
    { label: "10mA", value: 0.01 },
    { label: "100mA", value: 0.1 },
    { label: "1A", value: 1 },
    { label: "5A", value: 5 },
  ],
  r: [
    { label: "1kΩ", value: 1000 },
    { label: "4.7kΩ", value: 4700 },
    { label: "10kΩ", value: 10_000 },
    { label: "100kΩ", value: 100_000 },
  ],
};

function OhmsLaw() {
  const [v, setV] = useState<number | null>(null);
  const [i, setI] = useState<number | null>(null);
  const [r, setR] = useState<number | null>(null);
  const [active, setActive] = useState<OhmField>("v");
  const [tick, setTick] = useState(0);

  const setters: Record<OhmField, (n: number | null) => void> = {
    v: setV,
    i: setI,
    r: setR,
  };
  const values: Record<OhmField, number | null> = { v, i, r };

  // Auto-compute the missing value when the other two are known
  const derived = useMemo<{ field: OhmField; value: number; formula: string } | null>(() => {
    const filled: OhmField[] = (Object.keys(values) as OhmField[]).filter(
      (k) => values[k] != null
    );
    if (filled.length !== 2) return null;
    if (v == null && i != null && r != null) return { field: "v", value: i * r, formula: "V = I × R" };
    if (i == null && v != null && r != null && r !== 0) return { field: "i", value: v / r, formula: "I = V ÷ R" };
    if (r == null && v != null && i != null && i !== 0) return { field: "r", value: v / i, formula: "R = V ÷ I" };
    return null;
  }, [v, i, r, values]);

  const displayValue = (f: OhmField): number | null => {
    if (values[f] != null) return values[f];
    if (derived?.field === f) return derived.value;
    return null;
  };

  const setField = (f: OhmField, val: number | null) => {
    setters[f](val);
    setTick((t) => t + 1);
  };
  const handleKey = (k: Parameters<Parameters<typeof KeyPad>[0]["onKey"]>[0]) => {
    if (k === "clear") {
      setField(active, null);
      return;
    }
    const cur = values[active];
    const s = cur == null ? "" : String(cur);
    let next = s;
    if (k === "back") next = s.slice(0, -1);
    else if (k === ".") next = s.includes(".") ? s : s === "" ? "0." : s + ".";
    else next = s + k;
    const parsed = next === "" || next === "." ? null : Number(next);
    if (Number.isFinite(parsed) || parsed === null) setField(active, parsed);
  };

  const reset = () => {
    setV(null); setI(null); setR(null); setActive("v"); setTick((t) => t + 1);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        {/* Triangle diagram with 3 LED displays */}
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <svg
            viewBox="0 0 320 300"
            aria-hidden
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="ohm-triangle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <polygon
              points="160,20 300,260 20,260"
              fill="none"
              stroke="url(#ohm-triangle)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeDasharray="6 6"
            />
            <text
              x="160"
              y="155"
              textAnchor="middle"
              fill="#F59E0B"
              className="font-mono"
              fontSize="26"
              fontWeight="800"
              opacity="0.85"
            >
              V = I × R
            </text>
          </svg>
          <div className="absolute left-1/2 top-0 w-32 -translate-x-1/2">
            <DigitalDisplay
              value={displayValue("v")}
              unit="V"
              color="amber"
              label="V — מתח"
              active={active === "v"}
              onClick={() => setActive("v")}
              computed={derived?.field === "v"}
              flashKey={derived?.field === "v" ? tick : undefined}
              size="sm"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-32">
            <DigitalDisplay
              value={displayValue("i")}
              unit="A"
              color="amber"
              label="I — זרם"
              active={active === "i"}
              onClick={() => setActive("i")}
              computed={derived?.field === "i"}
              flashKey={derived?.field === "i" ? tick : undefined}
              size="sm"
            />
          </div>
          <div className="absolute bottom-0 left-0 w-32">
            <DigitalDisplay
              value={displayValue("r")}
              unit="Ω"
              color="amber"
              label="R — התנגדות"
              active={active === "r"}
              onClick={() => setActive("r")}
              computed={derived?.field === "r"}
              flashKey={derived?.field === "r" ? tick : undefined}
              size="sm"
            />
          </div>
        </div>

        {/* Formula readout when computed */}
        {derived && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            <Check className="h-3.5 w-3.5" />
            חושב אוטומטית: {derived.formula}
          </div>
        )}
      </div>

      {/* Control column */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-xs font-semibold text-text-subtle">
            עורך:{" "}
            <span className="text-text">
              {{ v: "מתח (V)", i: "זרם (I)", r: "התנגדות (R)" }[active]}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Stepper
              value={values[active]}
              onChange={(n) => setField(active, n)}
              step={OHM_STEPS[active]}
            />
            <button
              type="button"
              onClick={() => setField(active, null)}
              className="rounded-lg border border-border px-2 py-1 text-xs text-text-muted hover:text-danger"
            >
              נקה
            </button>
          </div>
          <div className="mt-3">
            <PresetChips
              presets={OHM_PRESETS[active]}
              onPick={(n) => setField(active, n)}
            />
          </div>
        </div>

        <KeyPad onKey={handleKey} />

        <button
          type="button"
          onClick={reset}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-muted hover:border-danger hover:text-danger"
        >
          <RotateCcw className="h-4 w-4" />
          איפוס
        </button>
      </aside>

      <p className="md:col-span-2 text-xs text-text-subtle">
        הזן שני ערכים והשלישי יחושב אוטומטית. לחץ על תצוגה כדי לערוך אותה — עם המקלדת, ה־Stepper, או הקדם־קבועים.
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Series / Parallel — schematic-style calculator
// -----------------------------------------------------------------------------

const R_PRESETS = [
  { label: "220Ω", value: 220 },
  { label: "1kΩ", value: 1000 },
  { label: "4.7kΩ", value: 4700 },
  { label: "10kΩ", value: 10_000 },
  { label: "100kΩ", value: 100_000 },
  { label: "1MΩ", value: 1_000_000 },
];

function ResistorCombo({ mode }: { mode: "series" | "parallel" }) {
  const [values, setValues] = useState<(number | null)[]>([null, null]);
  const [active, setActive] = useState(0);
  const color: LedColor = mode === "series" ? "emerald" : "fuchsia";
  const tone = mode === "series" ? "emerald" : "fuchsia";

  const update = (idx: number, v: number | null) =>
    setValues((prev) => prev.map((x, i) => (i === idx ? v : x)));
  const add = () => {
    setValues((prev) => [...prev, null]);
    setActive(values.length);
  };
  const remove = (idx: number) => {
    if (values.length <= 2) return;
    setValues((prev) => prev.filter((_, i) => i !== idx));
    setActive((a) => Math.max(0, Math.min(a, values.length - 2)));
  };
  const reset = () => {
    setValues([null, null]);
    setActive(0);
  };

  const nums = values.filter((n): n is number => n != null && n > 0);
  const result = useMemo(() => {
    if (nums.length < 2) return null;
    if (mode === "series") return nums.reduce((s, n) => s + n, 0);
    return 1 / nums.reduce((s, n) => s + 1 / n, 0);
  }, [nums, mode]);

  const handleKey = (k: Parameters<Parameters<typeof KeyPad>[0]["onKey"]>[0]) => {
    const cur = values[active];
    const s = cur == null ? "" : String(cur);
    let next = s;
    if (k === "back") next = s.slice(0, -1);
    else if (k === "clear") next = "";
    else if (k === ".") next = s.includes(".") ? s : s === "" ? "0." : s + ".";
    else next = s + k;
    const parsed = next === "" || next === "." ? null : Number(next);
    if (Number.isFinite(parsed) || parsed === null) update(active, parsed);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <SchematicPanel
          mode={mode}
          values={values}
          active={active}
          onSelect={setActive}
          onRemove={remove}
          onAdd={add}
          onEdit={update}
          color={color}
          result={result}
        />
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-xs font-semibold text-text-subtle">
            עורך: <span className="text-text">R{active + 1}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Stepper
              value={values[active]}
              onChange={(n) => update(active, n)}
              step={100}
            />
            <button
              type="button"
              onClick={() => update(active, null)}
              className="rounded-lg border border-border px-2 py-1 text-xs text-text-muted hover:text-danger"
            >
              נקה
            </button>
          </div>
          <div className="mt-3">
            <PresetChips presets={R_PRESETS} onPick={(n) => update(active, n)} />
          </div>
        </div>

        <KeyPad onKey={handleKey} />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={add}
            className={clsx(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5",
              tone === "emerald"
                ? "bg-gradient-to-l from-emerald-500 to-teal-500"
                : "bg-gradient-to-l from-fuchsia-500 to-violet-500"
            )}
          >
            <Plus className="h-4 w-4" />
            הוסף נגד
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-muted hover:border-danger hover:text-danger"
            aria-label="איפוס"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <p className="md:col-span-2 text-xs text-text-subtle">
        {mode === "series"
          ? "בטור: R_total = R1 + R2 + … + Rn. הזרם זהה בכל הנגדים; המתחים מצטברים."
          : "במקביל: 1 / R_total = 1/R1 + 1/R2 + … + 1/Rn. המתח זהה על כל הנגדים; הזרמים מצטברים."}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Schematic renderer (SVG resistor bodies + wires) with LED displays per resistor
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Schematic geometry — shared constants
// -----------------------------------------------------------------------------
const BODY_LEN = 54;   // length of the zigzag body
const LEAD_LEN = 22;   // straight wire lead on each side of the resistor
const COMP_SPAN = BODY_LEN + 2 * LEAD_LEN; // full component span end-to-end
const ZIG = 11;        // zigzag amplitude (peak/valley offset from baseline)

function fmtResistorLabel(n: number | null | undefined): string {
  if (n == null || !isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}MΩ`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 2)}kΩ`;
  return `${n}Ω`;
}

function SchematicPanel({
  mode,
  values,
  active,
  onSelect,
  onRemove,
  onAdd,
  color,
  result,
}: {
  mode: "series" | "parallel";
  values: (number | null)[];
  active: number;
  onSelect: (i: number) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
  onEdit: (i: number, v: number | null) => void;
  color: LedColor;
  result: number | null;
}) {
  const count = values.length;
  const gridCols =
    count <= 2 ? "sm:grid-cols-2" : count === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";

  // Series viewBox: extra left/right margins for terminal dots + wire tails.
  // Parallel viewBox: horizontal spacing between vertical resistors + rail tails.
  const seriesSpacing = COMP_SPAN + 8;    // small extra wire between components
  const seriesWidth = 60 + count * seriesSpacing + 60;
  const parallelSpacing = 150;
  const parallelWidth = 40 + (count - 1) * parallelSpacing + 100 + 40;

  return (
    <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
      {/* SVG schematic */}
      <div className="overflow-x-auto">
        <svg
          viewBox={
            mode === "series"
              ? `0 0 ${seriesWidth} 160`
              : `0 0 ${parallelWidth} 220`
          }
          className={clsx(
            "mx-auto block w-full max-w-3xl",
            mode === "series" ? "h-44 sm:h-52" : "h-64 sm:h-72"
          )}
          aria-hidden
        >
          <defs>
            <linearGradient id={`wire-${mode}`} x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0%"
                stopColor={color === "emerald" ? "#10B981" : "#D946EF"}
              />
              <stop
                offset="100%"
                stopColor={color === "emerald" ? "#14B8A6" : "#8B5CF6"}
              />
            </linearGradient>
          </defs>
          {mode === "series" ? (
            <SeriesSchematic count={count} values={values} width={seriesWidth} spacing={seriesSpacing} />
          ) : (
            <ParallelSchematic count={count} values={values} width={parallelWidth} spacing={parallelSpacing} />
          )}
        </svg>
      </div>

      {/* Resistor value inputs — LED displays, one per resistor */}
      <div className={clsx("mt-5 grid gap-3 sm:gap-4", gridCols)}>
        {values.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <DigitalDisplay
                value={v}
                unit="Ω"
                color={color}
                label={`R${i + 1}`}
                active={i === active}
                onClick={() => onSelect(i)}
                size="sm"
              />
            </div>
            {count > 2 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`הסר R${i + 1}`}
                className="mt-4 grid h-8 w-8 place-items-center rounded-lg border border-border text-text-subtle transition-colors hover:border-danger hover:text-danger"
              >
                <Minus className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className={clsx(
            "flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-xs font-semibold transition-colors",
            color === "emerald"
              ? "border-emerald-300 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50"
              : "border-fuchsia-300 text-fuchsia-700 hover:border-fuchsia-500 hover:bg-fuchsia-50"
          )}
        >
          <Plus className="h-5 w-5" />
          הוסף נגד
        </button>
      </div>

      {/* Total */}
      <div className="mt-5">
        <DigitalDisplay
          value={result}
          unit="Ω"
          color={color}
          label={mode === "series" ? "R_TOTAL (טור)" : "R_TOTAL (מקבילי)"}
          size="lg"
          computed
          flashKey={result ?? "none"}
        />
      </div>
    </div>
  );
}

function SeriesSchematic({
  count,
  values,
  width,
  spacing,
}: {
  count: number;
  values: (number | null)[];
  width: number;
  spacing: number;
}) {
  const y = 70;
  const stroke = "url(#wire-series)";
  // Component centers, evenly spaced, first one 60 + spacing/2 from left edge
  const centers = Array.from(
    { length: count },
    (_, i) => 60 + spacing / 2 + i * spacing
  );
  const firstCx = centers[0];
  const lastCx = centers[count - 1];
  return (
    <g>
      {/* Left terminal + wire into first resistor's left lead */}
      <circle cx={20} cy={y} r={6} fill="#10B981" />
      <line
        x1={20}
        y1={y}
        x2={firstCx - COMP_SPAN / 2}
        y2={y}
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Resistors + inter-resistor connecting wires */}
      {centers.map((cx, i) => (
        <g key={i}>
          <Resistor cx={cx} cy={y} label={`R${i + 1}`} value={fmtResistorLabel(values[i])} />
          {i < count - 1 && (
            <line
              x1={cx + COMP_SPAN / 2}
              y1={y}
              x2={centers[i + 1] - COMP_SPAN / 2}
              y2={y}
              stroke={stroke}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}
        </g>
      ))}

      {/* Right wire out of last resistor + terminal */}
      <line
        x1={lastCx + COMP_SPAN / 2}
        y1={y}
        x2={width - 20}
        y2={y}
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={width - 20} cy={y} r={6} fill="#14B8A6" />
    </g>
  );
}

function ParallelSchematic({
  count,
  values,
  width,
  spacing,
}: {
  count: number;
  values: (number | null)[];
  width: number;
  spacing: number;
}) {
  const topY = 40;
  const botY = topY + COMP_SPAN; // vertical resistor + leads span exactly this
  const midY = (topY + botY) / 2;
  const stroke = "url(#wire-parallel)";
  const startX = 60;
  const centers = Array.from({ length: count }, (_, i) => startX + i * spacing);
  const lastCx = centers[count - 1];
  const railEndX = lastCx + 40;
  return (
    <g>
      {/* Left terminals */}
      <circle cx={20} cy={topY} r={6} fill="#D946EF" />
      <circle cx={20} cy={botY} r={6} fill="#8B5CF6" />

      {/* Top + bottom rails */}
      <line x1={20} y1={topY} x2={railEndX} y2={topY} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1={20} y1={botY} x2={railEndX} y2={botY} stroke={stroke} strokeWidth={3} strokeLinecap="round" />

      {/* Vertical resistors — leads already touch the rails at topY/botY */}
      {centers.map((cx, i) => (
        <Resistor
          key={i}
          cx={cx}
          cy={midY}
          label={`R${i + 1}`}
          value={fmtResistorLabel(values[i])}
          vertical
        />
      ))}
    </g>
  );
}

// Standard schematic resistor: lead — zigzag body — lead. Value label near it.
function Resistor({
  cx,
  cy,
  label,
  value,
  vertical,
}: {
  cx: number;
  cy: number;
  label: string;
  value: string;
  vertical?: boolean;
}) {
  const half = BODY_LEN / 2;
  // Zigzag baseline points: start on baseline, then 3 up-peaks (-ZIG) alternating
  // with 2 down-valleys (+ZIG), and end on baseline. 7 vertices total.
  const zigzagUV: { u: number; v: number }[] = [
    { u: -half, v: 0 },
    { u: -half + (BODY_LEN * 1) / 6, v: -ZIG },
    { u: -half + (BODY_LEN * 2) / 6, v: +ZIG },
    { u: -half + (BODY_LEN * 3) / 6, v: -ZIG },
    { u: -half + (BODY_LEN * 4) / 6, v: +ZIG },
    { u: -half + (BODY_LEN * 5) / 6, v: -ZIG },
    { u: +half, v: 0 },
  ];
  const toXY = ({ u, v }: { u: number; v: number }) =>
    vertical ? `${cx + v},${cy + u}` : `${cx + u},${cy + v}`;

  const leadLeftD = vertical
    ? `M ${cx},${cy - half - LEAD_LEN} L ${cx},${cy - half}`
    : `M ${cx - half - LEAD_LEN},${cy} L ${cx - half},${cy}`;
  const leadRightD = vertical
    ? `M ${cx},${cy + half} L ${cx},${cy + half + LEAD_LEN}`
    : `M ${cx + half},${cy} L ${cx + half + LEAD_LEN},${cy}`;

  const stroke = "#0F172A";
  const strokeWidth = 2.75;

  // Horizontal resistor: label on top of body, value below the body.
  // Vertical resistor: label + value stacked to the right of the body,
  // pushed out far enough that they don't collide with the zigzag peaks.
  const labelX = vertical ? cx + ZIG + 24 : cx;
  const labelY = vertical ? cy - 5 : cy - 20;
  const valueX = vertical ? cx + ZIG + 24 : cx;
  const valueY = vertical ? cy + 15 : cy + 32;
  const labelFontSize = vertical ? 16 : 14;
  const valueFontSize = 13;

  return (
    <g>
      <path d={leadLeftD} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      <polyline
        points={zigzagUV.map(toXY).join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
        strokeLinecap="round"
      />
      <path d={leadRightD} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      {/* Force LTR direction on schematic text — otherwise `text-anchor="start"`
          resolves to the right side under the page's dir="rtl", which flips
          labels back onto the zigzag body. */}
      <text
        x={labelX}
        y={labelY}
        textAnchor={vertical ? "start" : "middle"}
        direction="ltr"
        fontSize={labelFontSize}
        fontWeight="800"
        fill="#0F172A"
      >
        {label}
      </text>
      <text
        x={valueX}
        y={valueY}
        textAnchor={vertical ? "start" : "middle"}
        direction="ltr"
        fontSize={valueFontSize}
        fontWeight="700"
        fill="#1E3AA8"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </text>
    </g>
  );
}
