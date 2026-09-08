"use client";

import { useCallback, useState } from "react";
import {
  solveLinearSystem,
  solvePolynomial,
  formatResult,
  type CalcResult,
} from "./calc-engine";

type SubTab = "linear" | "polynomial";
type SystemSize = 2 | 3 | 4;
type PolyDegree = 2 | 3 | 4;

const VAR_NAMES = ["x", "y", "z", "w"];

function CoeffInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <label className="text-[10px] font-semibold text-text-subtle">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-16 rounded-lg border border-border bg-surface px-2 text-center font-mono text-sm font-bold text-text outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:w-20"
        dir="ltr"
      />
    </div>
  );
}

function ResultDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-primary-50/50 px-4 py-2.5 dark:bg-primary-500/10">
      <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">
        {label}
      </span>
      <span className="text-sm text-text-muted">=</span>
      <span className="font-mono text-sm font-bold text-text" dir="ltr">
        {value}
      </span>
    </div>
  );
}

export function EquationSolver() {
  const [subTab, setSubTab] = useState<SubTab>("linear");
  const [systemSize, setSystemSize] = useState<SystemSize>(2);
  const [polyDegree, setPolyDegree] = useState<PolyDegree>(2);

  const [coeffs, setCoeffs] = useState<string[][]>(
    Array.from({ length: 4 }, () => Array(5).fill("0")),
  );
  const [polyCoeffs, setPolyCoeffs] = useState<string[]>(Array(5).fill("0"));

  const [linearResult, setLinearResult] = useState<CalcResult[] | null>(null);
  const [polyResult, setPolyResult] = useState<CalcResult[] | null>(null);
  const [error, setError] = useState("");

  const setCoeff = useCallback((row: number, col: number, val: string) => {
    setCoeffs((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = val;
      return next;
    });
  }, []);

  const solveLinear = useCallback(() => {
    setError("");
    setLinearResult(null);
    try {
      const n = systemSize;
      const A = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => parseFloat(coeffs[i][j]) || 0),
      );
      const b = Array.from({ length: n }, (_, i) =>
        parseFloat(coeffs[i][n]) || 0,
      );
      const result = solveLinearSystem(A, b);
      setLinearResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בפתרון");
    }
  }, [systemSize, coeffs]);

  const solvePoly = useCallback(() => {
    setError("");
    setPolyResult(null);
    try {
      const n = polyDegree;
      const c = Array.from({ length: n + 1 }, (_, i) =>
        parseFloat(polyCoeffs[i]) || 0,
      );
      if (c[0] === 0) {
        setError("המקדם המוביל לא יכול להיות 0");
        return;
      }
      const result = solvePolynomial(c);
      setPolyResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בפתרון");
    }
  }, [polyDegree, polyCoeffs]);

  const polyPreview = (() => {
    const n = polyDegree;
    const parts: string[] = [];
    for (let i = 0; i <= n; i++) {
      const exp = n - i;
      const c = polyCoeffs[i] || "0";
      if (exp === 0) parts.push(c);
      else if (exp === 1) parts.push(`${c}x`);
      else parts.push(`${c}x^${exp}`);
    }
    return parts.join(" + ") + " = 0";
  })();

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        {/* Sub-tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => { setSubTab("linear"); setError(""); }}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
              subTab === "linear"
                ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
                : "text-text-muted hover:bg-surface-2"
            }`}
          >
            מערכת משוואות
          </button>
          <button
            type="button"
            onClick={() => { setSubTab("polynomial"); setError(""); }}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
              subTab === "polynomial"
                ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
                : "text-text-muted hover:bg-surface-2"
            }`}
          >
            שורשי פולינום
          </button>
        </div>

        <div className="p-4">
          {subTab === "linear" && (
            <>
              {/* Size selector */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-text-subtle">גודל:</span>
                {([2, 3, 4] as SystemSize[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSystemSize(s); setLinearResult(null); setError(""); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      systemSize === s
                        ? "bg-primary-600 text-white"
                        : "bg-surface-2 text-text-muted hover:text-text"
                    }`}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>

              {/* Coefficient matrix */}
              <div className="overflow-x-auto">
                <div className="space-y-2">
                  {Array.from({ length: systemSize }, (_, row) => (
                    <div key={row} className="flex items-center gap-1.5 flex-wrap">
                      {Array.from({ length: systemSize }, (_, col) => (
                        <div key={col} className="flex items-center gap-0.5">
                          <CoeffInput
                            value={coeffs[row][col]}
                            onChange={(v) => setCoeff(row, col, v)}
                            label={VAR_NAMES[col]}
                          />
                          {col < systemSize - 1 && (
                            <span className="mt-4 text-xs text-text-subtle">+</span>
                          )}
                        </div>
                      ))}
                      <span className="mt-4 text-xs font-bold text-text-subtle">=</span>
                      <CoeffInput
                        value={coeffs[row][systemSize]}
                        onChange={(v) => setCoeff(row, systemSize, v)}
                        label="b"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={solveLinear}
                className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-500 active:bg-primary-700"
              >
                פתור מערכת
              </button>

              {linearResult && (
                <div className="mt-4 space-y-2">
                  {linearResult.map((val, i) => (
                    <ResultDisplay
                      key={i}
                      label={VAR_NAMES[i]}
                      value={formatResult(val)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {subTab === "polynomial" && (
            <>
              {/* Degree selector */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-text-subtle">דרגה:</span>
                {([2, 3, 4] as PolyDegree[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setPolyDegree(d); setPolyResult(null); setError(""); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      polyDegree === d
                        ? "bg-primary-600 text-white"
                        : "bg-surface-2 text-text-muted hover:text-text"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Coefficient inputs */}
              <div className="flex flex-wrap items-end gap-1.5">
                {Array.from({ length: polyDegree + 1 }, (_, i) => {
                  const exp = polyDegree - i;
                  const label =
                    exp === 0 ? "a₀" : exp === 1 ? "a₁·x" : `a${exp}·x^${exp}`;
                  return (
                    <div key={i} className="flex items-center gap-0.5">
                      <CoeffInput
                        value={polyCoeffs[i]}
                        onChange={(v) => {
                          setPolyCoeffs((prev) => {
                            const next = [...prev];
                            next[i] = v;
                            return next;
                          });
                        }}
                        label={label}
                      />
                      {i < polyDegree && (
                        <span className="mt-4 text-xs text-text-subtle">+</span>
                      )}
                    </div>
                  );
                })}
                <span className="mb-2 text-xs font-bold text-text-subtle">= 0</span>
              </div>

              {/* Equation preview */}
              <div
                className="mt-2 rounded-lg bg-surface-2/50 px-3 py-2 text-center font-mono text-xs text-text-muted"
                dir="ltr"
              >
                {polyPreview}
              </div>

              <button
                type="button"
                onClick={solvePoly}
                className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-500 active:bg-primary-700"
              >
                מצא שורשים
              </button>

              {polyResult && (
                <div className="mt-4 space-y-2">
                  {polyResult.map((val, i) => (
                    <ResultDisplay
                      key={i}
                      label={`x${i + 1}`}
                      value={formatResult(val)}
                    />
                  ))}
                </div>
              )}
            </>
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
