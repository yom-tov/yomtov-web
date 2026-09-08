"use client";

import { useCallback, useState } from "react";
import { matDeterminant, matInverse, matTranspose, matMultiply } from "./calc-engine";

type Op = "det" | "inv" | "transpose" | "multiply";

function MatrixGrid({
  label,
  rows,
  cols,
  values,
  onChange,
  onResize,
}: {
  label: string;
  rows: number;
  cols: number;
  values: string[][];
  onChange: (r: number, c: number, val: string) => void;
  onResize?: (rows: number, cols: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-text">{label}</span>
        {onResize && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => onResize(Math.max(1, rows - 1), cols)}
              className="rounded bg-surface-2 px-1.5 py-0.5 font-bold text-text-muted hover:bg-surface-2/80"
            >
              -שורה
            </button>
            <span className="font-mono font-bold text-text-subtle">{rows}×{cols}</span>
            <button
              type="button"
              onClick={() => onResize(Math.min(6, rows + 1), cols)}
              className="rounded bg-surface-2 px-1.5 py-0.5 font-bold text-text-muted hover:bg-surface-2/80"
            >
              +שורה
            </button>
            <button
              type="button"
              onClick={() => onResize(rows, Math.max(1, cols - 1))}
              className="rounded bg-surface-2 px-1.5 py-0.5 font-bold text-text-muted hover:bg-surface-2/80"
            >
              -עמודה
            </button>
            <button
              type="button"
              onClick={() => onResize(rows, Math.min(6, cols + 1))}
              className="rounded bg-surface-2 px-1.5 py-0.5 font-bold text-text-muted hover:bg-surface-2/80"
            >
              +עמודה
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-2/30 p-2">
        <div className="inline-flex flex-col gap-1">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex gap-1">
              {Array.from({ length: cols }, (_, c) => (
                <input
                  key={c}
                  type="text"
                  inputMode="decimal"
                  value={values[r]?.[c] ?? "0"}
                  onChange={(e) => onChange(r, c, e.target.value)}
                  className="h-10 w-14 rounded-lg border border-border bg-surface px-1 text-center font-mono text-sm font-bold text-text outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 sm:w-16"
                  dir="ltr"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultMatrix({ label, data }: { label: string; data: number[][] }) {
  return (
    <div>
      <span className="mb-1 block text-sm font-bold text-primary-600 dark:text-primary-400">
        {label}
      </span>
      <div className="overflow-x-auto rounded-xl bg-primary-50/50 p-2 dark:bg-primary-500/10">
        <div className="inline-flex flex-col gap-1">
          {data.map((row, r) => (
            <div key={r} className="flex gap-2">
              {row.map((val, c) => (
                <span
                  key={c}
                  className="w-20 text-center font-mono text-sm font-bold text-text"
                  dir="ltr"
                >
                  {fmtNum(val)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function fmtNum(n: number): string {
  if (!isFinite(n)) return isNaN(n) ? "NaN" : n > 0 ? "∞" : "-∞";
  const r = Math.round(n * 1e8) / 1e8;
  if (r === 0) return "0";
  if (Math.abs(r) >= 1e8 || Math.abs(r) < 1e-4) return r.toExponential(4);
  return String(r);
}

function makeGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array(cols).fill("0"));
}

function parseGrid(values: string[][], rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => parseFloat(values[r]?.[c] ?? "0") || 0),
  );
}

export function MatrixCalc() {
  const [rowsA, setRowsA] = useState(3);
  const [colsA, setColsA] = useState(3);
  const [rowsB, setRowsB] = useState(3);
  const [colsB, setColsB] = useState(3);
  const [valuesA, setValuesA] = useState<string[][]>(makeGrid(3, 3));
  const [valuesB, setValuesB] = useState<string[][]>(makeGrid(3, 3));
  const [selectedOp, setSelectedOp] = useState<Op>("det");
  const [result, setResult] = useState<{ type: "scalar"; value: string } | { type: "matrix"; label: string; data: number[][] } | null>(null);
  const [error, setError] = useState("");

  const resizeA = useCallback((r: number, c: number) => {
    setRowsA(r);
    setColsA(c);
    setValuesA((prev) => {
      const next = makeGrid(r, c);
      for (let i = 0; i < Math.min(r, prev.length); i++)
        for (let j = 0; j < Math.min(c, prev[i]?.length ?? 0); j++)
          next[i][j] = prev[i][j];
      return next;
    });
    setResult(null);
  }, []);

  const resizeB = useCallback((r: number, c: number) => {
    setRowsB(r);
    setColsB(c);
    setValuesB((prev) => {
      const next = makeGrid(r, c);
      for (let i = 0; i < Math.min(r, prev.length); i++)
        for (let j = 0; j < Math.min(c, prev[i]?.length ?? 0); j++)
          next[i][j] = prev[i][j];
      return next;
    });
    setResult(null);
  }, []);

  const changeA = useCallback((r: number, c: number, val: string) => {
    setValuesA((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
  }, []);

  const changeB = useCallback((r: number, c: number, val: string) => {
    setValuesB((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
  }, []);

  const compute = useCallback(() => {
    setError("");
    setResult(null);
    const A = parseGrid(valuesA, rowsA, colsA);
    try {
      switch (selectedOp) {
        case "det": {
          if (rowsA !== colsA) { setError("דטרמיננטה דורשת מטריצה ריבועית"); return; }
          const d = matDeterminant(A);
          setResult({ type: "scalar", value: fmtNum(d) });
          break;
        }
        case "inv": {
          if (rowsA !== colsA) { setError("הפיכה דורשת מטריצה ריבועית"); return; }
          const inv = matInverse(A);
          if (!inv) { setError("המטריצה סינגולרית — אין הופכית"); return; }
          setResult({ type: "matrix", label: "A⁻¹", data: inv });
          break;
        }
        case "transpose": {
          const t = matTranspose(A);
          setResult({ type: "matrix", label: "Aᵀ", data: t });
          break;
        }
        case "multiply": {
          if (colsA !== rowsB) {
            setError(`כפל דורש עמודות A (${colsA}) = שורות B (${rowsB})`);
            return;
          }
          const B = parseGrid(valuesB, rowsB, colsB);
          const prod = matMultiply(A, B);
          setResult({ type: "matrix", label: "A × B", data: prod });
          break;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בחישוב");
    }
  }, [selectedOp, valuesA, valuesB, rowsA, colsA, rowsB, colsB]);

  const OPS: { id: Op; label: string }[] = [
    { id: "det", label: "det(A)" },
    { id: "inv", label: "A⁻¹" },
    { id: "transpose", label: "Aᵀ" },
    { id: "multiply", label: "A × B" },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="p-4">
          {/* Operation selector */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {OPS.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => { setSelectedOp(op.id); setResult(null); setError(""); }}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                  selectedOp === op.id
                    ? "bg-primary-600 text-white"
                    : "bg-surface-2 text-text-muted hover:text-text"
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>

          {/* Matrix A */}
          <MatrixGrid
            label="מטריצה A"
            rows={rowsA}
            cols={colsA}
            values={valuesA}
            onChange={changeA}
            onResize={resizeA}
          />

          {/* Matrix B (only for multiply) */}
          {selectedOp === "multiply" && (
            <div className="mt-4">
              <MatrixGrid
                label="מטריצה B"
                rows={rowsB}
                cols={colsB}
                values={valuesB}
                onChange={changeB}
                onResize={resizeB}
              />
            </div>
          )}

          <button
            type="button"
            onClick={compute}
            className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-500 active:bg-primary-700"
          >
            חשב
          </button>

          {/* Result */}
          {result?.type === "scalar" && (
            <div className="mt-4 rounded-xl bg-primary-50/50 px-4 py-3 dark:bg-primary-500/10">
              <span className="text-xs font-semibold text-text-subtle">det(A) =</span>
              <span className="mr-2 font-mono text-xl font-bold text-text" dir="ltr">
                {result.value}
              </span>
            </div>
          )}
          {result?.type === "matrix" && (
            <div className="mt-4">
              <ResultMatrix label={result.label} data={result.data} />
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
