"use client";

import { useMemo, useState } from "react";

interface Unit {
  id: string;
  label: string;
  labelEn: string;
  factor: number;
  offset?: number;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  units: Unit[];
  convert?: (val: number, from: Unit, to: Unit) => number;
}

const tempConvert = (val: number, from: Unit, to: Unit): number => {
  let celsius: number;
  if (from.id === "c") celsius = val;
  else if (from.id === "f") celsius = (val - 32) * (5 / 9);
  else celsius = val - 273.15;

  if (to.id === "c") return celsius;
  if (to.id === "f") return celsius * (9 / 5) + 32;
  return celsius + 273.15;
};

const CATEGORIES: Category[] = [
  {
    id: "resistance",
    label: "התנגדות",
    icon: "Ω",
    units: [
      { id: "mohm", label: "מיליאוהם", labelEn: "mΩ", factor: 0.001 },
      { id: "ohm", label: "אוהם", labelEn: "Ω", factor: 1 },
      { id: "kohm", label: "קילואוהם", labelEn: "kΩ", factor: 1e3 },
      { id: "mohm2", label: "מגהאוהם", labelEn: "MΩ", factor: 1e6 },
      { id: "gohm", label: "ג'יגהאוהם", labelEn: "GΩ", factor: 1e9 },
    ],
  },
  {
    id: "capacitance",
    label: "קיבול",
    icon: "F",
    units: [
      { id: "pf", label: "פיקופראד", labelEn: "pF", factor: 1e-12 },
      { id: "nf", label: "ננופראד", labelEn: "nF", factor: 1e-9 },
      { id: "uf", label: "מיקרופראד", labelEn: "μF", factor: 1e-6 },
      { id: "mf", label: "מיליפראד", labelEn: "mF", factor: 1e-3 },
      { id: "f", label: "פראד", labelEn: "F", factor: 1 },
    ],
  },
  {
    id: "inductance",
    label: "השראות",
    icon: "H",
    units: [
      { id: "nh", label: "ננוהנרי", labelEn: "nH", factor: 1e-9 },
      { id: "uh", label: "מיקרוהנרי", labelEn: "μH", factor: 1e-6 },
      { id: "mh", label: "מיליהנרי", labelEn: "mH", factor: 1e-3 },
      { id: "h", label: "הנרי", labelEn: "H", factor: 1 },
    ],
  },
  {
    id: "voltage",
    label: "מתח",
    icon: "V",
    units: [
      { id: "uv", label: "מיקרוולט", labelEn: "μV", factor: 1e-6 },
      { id: "mv", label: "מיליוולט", labelEn: "mV", factor: 1e-3 },
      { id: "v", label: "וולט", labelEn: "V", factor: 1 },
      { id: "kv", label: "קילוולט", labelEn: "kV", factor: 1e3 },
    ],
  },
  {
    id: "current",
    label: "זרם",
    icon: "A",
    units: [
      { id: "ua", label: "מיקרואמפר", labelEn: "μA", factor: 1e-6 },
      { id: "ma", label: "מיליאמפר", labelEn: "mA", factor: 1e-3 },
      { id: "a", label: "אמפר", labelEn: "A", factor: 1 },
    ],
  },
  {
    id: "power",
    label: "הספק",
    icon: "W",
    units: [
      { id: "mw", label: "מיליוואט", labelEn: "mW", factor: 1e-3 },
      { id: "w", label: "וואט", labelEn: "W", factor: 1 },
      { id: "kw", label: "קילוואט", labelEn: "kW", factor: 1e3 },
      { id: "mw2", label: "מגהוואט", labelEn: "MW", factor: 1e6 },
      { id: "hp", label: 'כ"ס', labelEn: "HP", factor: 745.7 },
    ],
  },
  {
    id: "frequency",
    label: "תדירות",
    icon: "Hz",
    units: [
      { id: "hz", label: "הרץ", labelEn: "Hz", factor: 1 },
      { id: "khz", label: "קילוהרץ", labelEn: "kHz", factor: 1e3 },
      { id: "mhz", label: "מגהרץ", labelEn: "MHz", factor: 1e6 },
      { id: "ghz", label: "ג'יגהרץ", labelEn: "GHz", factor: 1e9 },
    ],
  },
  {
    id: "length",
    label: "אורך",
    icon: "m",
    units: [
      { id: "mm", label: "מילימטר", labelEn: "mm", factor: 0.001 },
      { id: "cm", label: "סנטימטר", labelEn: "cm", factor: 0.01 },
      { id: "m", label: "מטר", labelEn: "m", factor: 1 },
      { id: "km", label: "קילומטר", labelEn: "km", factor: 1000 },
      { id: "in", label: "אינץ'", labelEn: "in", factor: 0.0254 },
      { id: "ft", label: "רגל", labelEn: "ft", factor: 0.3048 },
      { id: "yd", label: "יארד", labelEn: "yd", factor: 0.9144 },
      { id: "mi", label: "מייל", labelEn: "mi", factor: 1609.344 },
    ],
  },
  {
    id: "mass",
    label: "מסה",
    icon: "kg",
    units: [
      { id: "mg", label: "מיליגרם", labelEn: "mg", factor: 1e-6 },
      { id: "g", label: "גרם", labelEn: "g", factor: 0.001 },
      { id: "kg", label: "קילוגרם", labelEn: "kg", factor: 1 },
      { id: "oz", label: "אונקיה", labelEn: "oz", factor: 0.0283495 },
      { id: "lb", label: "פאונד", labelEn: "lb", factor: 0.453592 },
    ],
  },
  {
    id: "temperature",
    label: "טמפרטורה",
    icon: "°C",
    units: [
      { id: "c", label: "צלזיוס", labelEn: "°C", factor: 1 },
      { id: "f", label: "פרנהייט", labelEn: "°F", factor: 1 },
      { id: "k", label: "קלווין", labelEn: "K", factor: 1 },
    ],
    convert: tempConvert,
  },
  {
    id: "energy",
    label: "אנרגיה",
    icon: "J",
    units: [
      { id: "j", label: "ג'אול", labelEn: "J", factor: 1 },
      { id: "kj", label: "קילוג'אול", labelEn: "kJ", factor: 1e3 },
      { id: "cal", label: "קלוריה", labelEn: "cal", factor: 4.184 },
      { id: "kcal", label: "קילוקלוריה", labelEn: "kcal", factor: 4184 },
      { id: "wh", label: "וואט-שעה", labelEn: "Wh", factor: 3600 },
      { id: "kwh", label: "קילוואט-שעה", labelEn: "kWh", factor: 3.6e6 },
      { id: "ev", label: "אלקטרון-וולט", labelEn: "eV", factor: 1.602176634e-19 },
    ],
  },
  {
    id: "pressure",
    label: "לחץ",
    icon: "Pa",
    units: [
      { id: "pa", label: "פסקל", labelEn: "Pa", factor: 1 },
      { id: "kpa", label: "קילופסקל", labelEn: "kPa", factor: 1e3 },
      { id: "bar", label: "בר", labelEn: "bar", factor: 1e5 },
      { id: "atm", label: "אטמוספירה", labelEn: "atm", factor: 101325 },
      { id: "psi", label: "PSI", labelEn: "psi", factor: 6894.757 },
    ],
  },
  {
    id: "time",
    label: "זמן",
    icon: "s",
    units: [
      { id: "ns", label: "ננושנייה", labelEn: "ns", factor: 1e-9 },
      { id: "us", label: "מיקרושנייה", labelEn: "μs", factor: 1e-6 },
      { id: "ms", label: "מילישנייה", labelEn: "ms", factor: 1e-3 },
      { id: "s", label: "שנייה", labelEn: "s", factor: 1 },
      { id: "min", label: "דקה", labelEn: "min", factor: 60 },
      { id: "hr", label: "שעה", labelEn: "hr", factor: 3600 },
    ],
  },
];

function fmtConv(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12 || (abs < 1e-6 && abs > 0)) {
    return n.toExponential(6).replace(/\.?0+e/, "e").replace("e+", "e");
  }
  const s = n.toPrecision(8);
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

export function UnitConverter() {
  const [catId, setCatId] = useState("resistance");
  const [input, setInput] = useState("1");
  const [fromId, setFromId] = useState("");

  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const from = cat.units.find((u) => u.id === fromId) || cat.units[0];
  const inputNum = Number(input) || 0;

  const results = useMemo(() => {
    return cat.units
      .filter((u) => u.id !== from.id)
      .map((to) => {
        let converted: number;
        if (cat.convert) {
          converted = cat.convert(inputNum, from, to);
        } else {
          converted = (inputNum * from.factor) / to.factor;
        }
        return { unit: to, value: converted };
      });
  }, [cat, from, inputNum]);

  const handleCatChange = (newCatId: string) => {
    setCatId(newCatId);
    const newCat = CATEGORIES.find((c) => c.id === newCatId)!;
    setFromId(newCat.units[0].id);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border bg-surface-2/50 p-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCatChange(c.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                catId === c.id
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <span className="font-mono text-[10px] opacity-60">{c.icon}</span>{" "}
              {c.label}
            </button>
          ))}
        </div>

        {/* Input section */}
        <div className="border-b border-border p-4">
          <label className="text-xs font-semibold text-text-subtle">ערך להמרה</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-12 flex-1 rounded-xl border border-border bg-surface px-4 text-left font-mono text-xl font-bold text-text ltr placeholder:text-text-subtle focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              dir="ltr"
              placeholder="0"
            />
            <select
              value={from.id}
              onChange={(e) => setFromId(e.target.value)}
              className="h-12 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-text focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {cat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.labelEn} — {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="divide-y divide-border">
          {results.map((r) => (
            <div
              key={r.unit.id}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-2/50"
            >
              <div>
                <span className="font-mono text-sm font-bold text-primary-600 ltr">
                  {r.unit.labelEn}
                </span>
                <span className="mr-2 text-sm text-text-muted">{r.unit.label}</span>
              </div>
              <span
                className="font-mono text-base font-bold text-text ltr"
                dir="ltr"
              >
                {fmtConv(r.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
