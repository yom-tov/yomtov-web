"use client";

import { useMemo, useState } from "react";

interface PhysConst {
  name: string;
  symbol: string;
  value: string;
  numValue: number;
  unit: string;
  category: string;
}

const CONSTANTS: PhysConst[] = [
  { name: "מהירות האור", symbol: "c", value: "2.998 × 10⁸", numValue: 299792458, unit: "m/s", category: "general" },
  { name: "קבוע פלאנק", symbol: "h", value: "6.626 × 10⁻³⁴", numValue: 6.62607015e-34, unit: "J·s", category: "general" },
  { name: "קבוע פלאנק מצומצם", symbol: "ℏ", value: "1.055 × 10⁻³⁴", numValue: 1.054571817e-34, unit: "J·s", category: "general" },
  { name: "קבוע בולצמן", symbol: "k", value: "1.381 × 10⁻²³", numValue: 1.380649e-23, unit: "J/K", category: "thermo" },
  { name: "קבוע הכבידה", symbol: "G", value: "6.674 × 10⁻¹¹", numValue: 6.6743e-11, unit: "N·m²/kg²", category: "general" },
  { name: "תאוצת כובד סטנדרטית", symbol: "g", value: "9.80665", numValue: 9.80665, unit: "m/s²", category: "general" },
  { name: "מספר אבוגדרו", symbol: "Nₐ", value: "6.022 × 10²³", numValue: 6.02214076e23, unit: "mol⁻¹", category: "general" },
  { name: "קבוע הגזים", symbol: "R", value: "8.314", numValue: 8.314462618, unit: "J/(mol·K)", category: "thermo" },
  { name: "מטען אלקטרון", symbol: "e", value: "1.602 × 10⁻¹⁹", numValue: 1.602176634e-19, unit: "C", category: "em" },
  { name: "מתירות הריק", symbol: "ε₀", value: "8.854 × 10⁻¹²", numValue: 8.8541878128e-12, unit: "F/m", category: "em" },
  { name: "חלחלות הריק", symbol: "μ₀", value: "1.257 × 10⁻⁶", numValue: 1.25663706212e-6, unit: "H/m", category: "em" },
  { name: "עכבת החלל החופשי", symbol: "Z₀", value: "376.73", numValue: 376.730313668, unit: "Ω", category: "em" },
  { name: "קוואנט שטף מגנטי", symbol: "Φ₀", value: "2.068 × 10⁻¹⁵", numValue: 2.067833848e-15, unit: "Wb", category: "em" },
  { name: "קבוע פאראדיי", symbol: "F", value: "96485.33", numValue: 96485.33212, unit: "C/mol", category: "em" },
  { name: "מגנטון בוהר", symbol: "μ_B", value: "9.274 × 10⁻²⁴", numValue: 9.2740100783e-24, unit: "J/T", category: "em" },
  { name: "מסת אלקטרון", symbol: "mₑ", value: "9.109 × 10⁻³¹", numValue: 9.1093837015e-31, unit: "kg", category: "atomic" },
  { name: "מסת פרוטון", symbol: "mₚ", value: "1.673 × 10⁻²⁷", numValue: 1.67262192369e-27, unit: "kg", category: "atomic" },
  { name: "מסת נויטרון", symbol: "mₙ", value: "1.675 × 10⁻²⁷", numValue: 1.67492749804e-27, unit: "kg", category: "atomic" },
  { name: "רדיוס בוהר", symbol: "a₀", value: "5.292 × 10⁻¹¹", numValue: 5.29177210903e-11, unit: "m", category: "atomic" },
  { name: "קבוע מבנה עדין", symbol: "α", value: "7.297 × 10⁻³", numValue: 7.2973525693e-3, unit: "", category: "atomic" },
  { name: "קבוע רידברג", symbol: "R∞", value: "1.097 × 10⁷", numValue: 1.0973731568160e7, unit: "m⁻¹", category: "atomic" },
  { name: "יחידת מסה אטומית", symbol: "u", value: "1.661 × 10⁻²⁷", numValue: 1.66053906660e-27, unit: "kg", category: "atomic" },
  { name: "אלקטרון-וולט", symbol: "eV", value: "1.602 × 10⁻¹⁹", numValue: 1.602176634e-19, unit: "J", category: "atomic" },
  { name: "קבוע סטפן-בולצמן", symbol: "σ", value: "5.670 × 10⁻⁸", numValue: 5.670374419e-8, unit: "W/(m²·K⁴)", category: "thermo" },
];

const CATEGORIES = [
  { id: "all", label: "הכל" },
  { id: "general", label: "כלליים" },
  { id: "em", label: "אלקטרומגנטי" },
  { id: "atomic", label: "אטומי" },
  { id: "thermo", label: "תרמודינמי" },
];

export function ConstantsLib() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return CONSTANTS.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.unit.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  const copyValue = (idx: number, val: number) => {
    navigator.clipboard.writeText(String(val)).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="p-4">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש קבוע..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-subtle/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />

          {/* Category filter */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  category === cat.id
                    ? "bg-primary-600 text-white"
                    : "bg-surface-2 text-text-muted hover:text-text"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Constants list */}
          <div className="mt-4 max-h-[500px] space-y-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-text-muted">
                לא נמצאו קבועים
              </p>
            )}
            {filtered.map((c, i) => (
              <div
                key={c.symbol + i}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 font-mono text-sm font-bold text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  {c.symbol}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text">{c.name}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xs font-bold text-text-muted" dir="ltr">
                      {c.value}
                    </span>
                    {c.unit && (
                      <span className="font-mono text-[10px] text-text-subtle" dir="ltr">
                        {c.unit}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(i, c.numValue)}
                  className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11px] font-bold text-text-muted transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400"
                >
                  {copiedIdx === i ? "✓" : "העתק"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
