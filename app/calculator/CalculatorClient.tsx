"use client";
import { useMemo, useState } from "react";
import { Calculator, Zap, Combine } from "lucide-react";
import { clsx } from "clsx";

type Tab = "ohm" | "series" | "parallel";

export function CalculatorClient() {
  const [tab, setTab] = useState<Tab>("ohm");
  return (
    <div className="rounded-3xl border border-border bg-surface shadow-sm">
      <div className="flex flex-wrap gap-1 border-b border-border p-2">
        <TabButton current={tab} value="ohm" onSelect={setTab} icon={<Zap className="h-4 w-4" />}>
          חוק אוהם
        </TabButton>
        <TabButton current={tab} value="series" onSelect={setTab} icon={<Combine className="h-4 w-4" />}>
          נגדים בטור
        </TabButton>
        <TabButton current={tab} value="parallel" onSelect={setTab} icon={<Calculator className="h-4 w-4" />}>
          נגדים במקביל
        </TabButton>
      </div>
      <div className="p-6">
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
// Ohm's law: V = I * R  →  solve for the missing value
// -----------------------------------------------------------------------------
function OhmsLaw() {
  const [v, setV] = useState("");
  const [i, setI] = useState("");
  const [r, setR] = useState("");

  const result = useMemo(() => {
    const vv = parseFloat(v);
    const ii = parseFloat(i);
    const rr = parseFloat(r);
    const known = [!isNaN(vv), !isNaN(ii), !isNaN(rr)].filter(Boolean).length;
    if (known < 2) return null;
    if (isNaN(vv)) return { key: "V", value: ii * rr, unit: "V" };
    if (isNaN(ii)) return { key: "I", value: vv / rr, unit: "A" };
    if (isNaN(rr)) return { key: "R", value: vv / ii, unit: "Ω" };
    return null;
  }, [v, i, r]);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberInput label="מתח V" unit="V" value={v} onChange={setV} />
        <NumberInput label="זרם I" unit="A" value={i} onChange={setI} />
        <NumberInput label="התנגדות R" unit="Ω" value={r} onChange={setR} />
      </div>
      <ResultCard
        title="תוצאה"
        empty="הכנס שני ערכים כדי לחשב את השלישי."
        result={
          result
            ? { label: result.key, value: result.value.toFixed(4), unit: result.unit }
            : null
        }
      />
      <div className="md:col-span-2">
        <p className="text-xs text-text-subtle">
          נוסחה: V = I × R  ·  I = V ÷ R  ·  R = V ÷ I. הזן שני ערכים והשלישי יחושב אוטומטית.
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Resistor combinations (series / parallel)
// -----------------------------------------------------------------------------
function ResistorCombo({ mode }: { mode: "series" | "parallel" }) {
  const [values, setValues] = useState<string[]>(["", ""]);
  const update = (idx: number, v: string) => {
    setValues((prev) => prev.map((x, i) => (i === idx ? v : x)));
  };
  const add = () => setValues((prev) => [...prev, ""]);
  const remove = (idx: number) =>
    setValues((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev));

  const result = useMemo(() => {
    const nums = values.map((v) => parseFloat(v)).filter((n) => !isNaN(n) && n > 0);
    if (nums.length < 2) return null;
    if (mode === "series") return nums.reduce((s, n) => s + n, 0);
    return 1 / nums.reduce((s, n) => s + 1 / n, 0);
  }, [values, mode]);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          {values.map((v, i) => (
            <div key={i} className="flex items-end gap-2">
              <NumberInput
                label={`R${i + 1}`}
                unit="Ω"
                value={v}
                onChange={(nv) => update(i, nv)}
              />
              {values.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="mb-1 rounded-lg border border-border px-2 py-1 text-xs text-text-muted hover:text-danger"
                  aria-label={`הסר R${i + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="mt-3 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-text-muted hover:border-primary-300 hover:text-primary-700"
        >
          + הוסף נגד
        </button>
      </div>
      <ResultCard
        title={mode === "series" ? "R Total (טור)" : "R Total (מקבילי)"}
        empty="הכנס לפחות שני ערכים חיוביים."
        result={
          result != null
            ? { label: "R", value: formatOhms(result), unit: result < 1000 ? "Ω" : "" }
            : null
        }
      />
      <div className="md:col-span-2">
        <p className="text-xs text-text-subtle">
          {mode === "series"
            ? "בטור: R_total = R1 + R2 + ... + Rn"
            : "במקביל: 1 / R_total = 1/R1 + 1/R2 + ... + 1/Rn"}
        </p>
      </div>
    </div>
  );
}

function formatOhms(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(3) + " MΩ";
  if (n >= 1_000) return (n / 1_000).toFixed(3) + " kΩ";
  return n.toFixed(3);
}

function NumberInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-subtle">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 focus-within:border-primary-500">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-base text-text placeholder:text-text-subtle focus:outline-none num"
          placeholder="0"
        />
        <span className="text-sm text-text-subtle num">{unit}</span>
      </div>
    </label>
  );
}

function ResultCard({
  title,
  result,
  empty,
}: {
  title: string;
  result: { label: string; value: string; unit: string } | null;
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
      <div className="text-xs font-semibold text-primary-700">{title}</div>
      {result ? (
        <div className="mt-2">
          <span className="text-3xl font-extrabold text-primary-900 num">
            {result.value}
          </span>
          <span className="ms-2 text-lg font-semibold text-primary-700 num">
            {result.unit}
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-text-muted">{empty}</p>
      )}
    </div>
  );
}
