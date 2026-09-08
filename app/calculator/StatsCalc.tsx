"use client";

import { useCallback, useState } from "react";
import { computeStats, linearRegression, type StatsResult } from "./calc-engine";

type Mode = "single" | "xy";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2/50 p-3">
      <div className="text-[10px] font-bold text-text-subtle">{label}</div>
      <div className="mt-0.5 font-mono text-base font-bold text-text" dir="ltr">
        {value}
      </div>
    </div>
  );
}

function fmtStat(n: number): string {
  if (!isFinite(n)) return "—";
  const r = Math.round(n * 1e8) / 1e8;
  if (r === 0) return "0";
  if (Math.abs(r) >= 1e10 || (Math.abs(r) < 1e-6 && Math.abs(r) > 0))
    return r.toExponential(6);
  return String(r);
}

export function StatsCalc() {
  const [mode, setMode] = useState<Mode>("single");
  const [dataText, setDataText] = useState("");
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [regression, setRegression] = useState<{
    slope: number;
    intercept: number;
    rSquared: number;
  } | null>(null);
  const [error, setError] = useState("");

  const parseData = useCallback((): { xs: number[]; ys: number[] } | number[] | null => {
    const lines = dataText
      .split(/[\n;]/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return null;

    if (mode === "single") {
      const nums: number[] = [];
      for (const line of lines) {
        const parts = line.split(/[\s,]+/).filter(Boolean);
        for (const p of parts) {
          const n = parseFloat(p);
          if (isNaN(n)) return null;
          nums.push(n);
        }
      }
      return nums.length > 0 ? nums : null;
    }

    const xs: number[] = [];
    const ys: number[] = [];
    for (const line of lines) {
      const parts = line.split(/[\s,]+/).filter(Boolean);
      if (parts.length < 2) return null;
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (isNaN(x) || isNaN(y)) return null;
      xs.push(x);
      ys.push(y);
    }
    return xs.length > 0 ? { xs, ys } : null;
  }, [dataText, mode]);

  const calculate = useCallback(() => {
    setError("");
    setStats(null);
    setRegression(null);

    const data = parseData();
    if (!data) {
      setError("נתונים לא תקינים");
      return;
    }

    try {
      if (Array.isArray(data)) {
        setStats(computeStats(data));
      } else {
        setStats(computeStats(data.ys));
        if (data.xs.length >= 2) {
          setRegression(linearRegression(data.xs, data.ys));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בחישוב");
    }
  }, [parseData]);

  const parsedCount = (() => {
    const data = parseData();
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    return data.xs.length;
  })();

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="p-4">
          {/* Mode selector */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => { setMode("single"); setStats(null); setRegression(null); setError(""); }}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                mode === "single"
                  ? "bg-primary-600 text-white"
                  : "bg-surface-2 text-text-muted hover:text-text"
              }`}
            >
              ערכים בודדים
            </button>
            <button
              type="button"
              onClick={() => { setMode("xy"); setStats(null); setRegression(null); setError(""); }}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                mode === "xy"
                  ? "bg-primary-600 text-white"
                  : "bg-surface-2 text-text-muted hover:text-text"
              }`}
            >
              זוגות X,Y
            </button>
          </div>

          {/* Data entry */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-subtle">
              {mode === "single"
                ? "הזן ערכים (מופרדים ברווח, פסיק או שורה חדשה)"
                : "הזן זוגות X,Y (כל שורה: x y או x,y)"}
            </label>
            <textarea
              value={dataText}
              onChange={(e) => setDataText(e.target.value)}
              placeholder={
                mode === "single"
                  ? "1 2 3 4 5\n10 20 30"
                  : "1, 2\n2, 4\n3, 5\n4, 8"
              }
              rows={5}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-text outline-none placeholder:text-text-subtle/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              dir="ltr"
            />
            <div className="mt-1 text-[11px] text-text-subtle">
              {parsedCount > 0
                ? `${parsedCount} ${mode === "single" ? "ערכים" : "זוגות"} זוהו`
                : "אין נתונים"}
            </div>
          </div>

          <button
            type="button"
            onClick={calculate}
            disabled={parsedCount === 0}
            className="mt-3 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-500 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            חשב סטטיסטיקה
          </button>

          {/* Results */}
          {stats && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-bold text-text">תוצאות</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard label="כמות (n)" value={String(stats.count)} />
                <StatCard label="סכום (Σ)" value={fmtStat(stats.sum)} />
                <StatCard label="ממוצע (x̄)" value={fmtStat(stats.mean)} />
                <StatCard label="חציון (Med)" value={fmtStat(stats.median)} />
                <StatCard label="סטיית תקן (σ)" value={fmtStat(stats.stdDev)} />
                <StatCard label="שונות (σ²)" value={fmtStat(stats.variance)} />
                <StatCard label="מינימום" value={fmtStat(stats.min)} />
                <StatCard label="מקסימום" value={fmtStat(stats.max)} />
              </div>
            </div>
          )}

          {regression && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-bold text-text">רגרסיה ליניארית</h3>
              <div className="rounded-xl bg-primary-50/50 p-4 dark:bg-primary-500/10">
                <div className="font-mono text-base font-bold text-text" dir="ltr">
                  y = {fmtStat(regression.slope)}x{" "}
                  {regression.intercept >= 0 ? "+" : "−"}{" "}
                  {fmtStat(Math.abs(regression.intercept))}
                </div>
                <div className="mt-1 font-mono text-sm text-text-muted" dir="ltr">
                  R² = {fmtStat(regression.rSquared)}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
