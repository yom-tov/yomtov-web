"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  evaluate,
  formatResult,
  isComplex,
  type AngleMode,
  type CalcResult,
} from "./calc-engine";

interface HistoryEntry {
  expr: string;
  result: string;
}

export function ScientificCalc() {
  const [segs, setSegs] = useState<string[]>([]);
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  const [second, setSecond] = useState(false);
  const [memory, setMemory] = useState(0);
  const [lastAns, setLastAns] = useState<CalcResult>(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [evaluated, setEvaluated] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  const expr = segs.join("");

  const preview = useMemo(() => {
    if (!expr) return "";
    try {
      let e = expr;
      const open = (e.match(/\(/g) || []).length;
      const close = (e.match(/\)/g) || []).length;
      if (open > close) e += ")".repeat(open - close);
      const r = evaluate(e, angleMode, lastAns);
      return formatResult(r);
    } catch {
      return "";
    }
  }, [expr, angleMode, lastAns]);

  const push = useCallback(
    (s: string) => {
      if (evaluated) {
        const isOp = /^[+\-×÷^]$/.test(s);
        if (isOp) {
          setSegs([preview || "0", s]);
        } else {
          setSegs([s]);
        }
        setEvaluated(false);
        return;
      }
      setSegs((p) => [...p, s]);
    },
    [evaluated, preview],
  );

  const backspace = useCallback(() => {
    setSegs((p) => p.slice(0, -1));
    setEvaluated(false);
  }, []);

  const clear = useCallback(() => {
    setSegs([]);
    setEvaluated(false);
  }, []);

  const doEval = useCallback(() => {
    if (!expr) return;
    try {
      let e = expr;
      const open = (e.match(/\(/g) || []).length;
      const close = (e.match(/\)/g) || []).length;
      if (open > close) e += ")".repeat(open - close);
      const r = evaluate(e, angleMode, lastAns);
      const formatted = formatResult(r);
      setLastAns(r);
      setHistory((h) =>
        [{ expr: displayExpr(expr), result: formatted }, ...h].slice(0, 20),
      );
      setSegs([formatted]);
      setEvaluated(true);
    } catch {
      setSegs(["Error"]);
      setEvaluated(true);
    }
  }, [expr, angleMode, lastAns]);

  const numericPreview = useMemo(() => {
    if (!preview) return 0;
    try {
      return parseFloat(preview) || 0;
    } catch {
      return 0;
    }
  }, [preview]);

  const handleBtn = useCallback(
    (action: string) => {
      if (action === "2nd") {
        setSecond((s) => !s);
        return;
      }
      if (action === "deg-rad") {
        setAngleMode((m) => (m === "deg" ? "rad" : "deg"));
        return;
      }
      if (action === "ac") { clear(); return; }
      if (action === "back") { backspace(); return; }
      if (action === "eval") { doEval(); return; }

      if (action === "mem+") {
        setMemory((m) => m + numericPreview);
        return;
      }
      if (action === "mem-") {
        setMemory((m) => m - numericPreview);
        return;
      }
      if (action === "mr") {
        push(String(memory));
        return;
      }
      if (action === "mc") {
        setMemory(0);
        return;
      }

      setSecond(false);

      if (action.startsWith("d:")) { push(action.slice(2)); return; }
      if (action.startsWith("op:")) { push(action.slice(3)); return; }
      if (action.startsWith("fn:")) { push(action.slice(3)); return; }

      if (action === "pi") { push("π"); return; }
      if (action === "e") { push("e"); return; }
      if (action === "ans") { push("Ans"); return; }
      if (action === "imag") { push("i"); return; }
      if (action === "(") { push("("); return; }
      if (action === ")") { push(")"); return; }
      if (action === "pow2") { push("^2"); return; }
      if (action === "pow3") { push("^3"); return; }
      if (action === "powxy") { push("^"); return; }
      if (action === "fact") { push("!"); return; }
      if (action === "pct") { push("%"); return; }
      if (action === "inv") { push("1÷("); return; }
      if (action === "10x") { push("10^("); return; }
      if (action === "negate") {
        push("(-");
        return;
      }
    },
    [push, backspace, clear, doEval, numericPreview, memory],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key;
      if (/^[0-9.]$/.test(k)) { handleBtn(`d:${k}`); e.preventDefault(); }
      else if (k === "+") { handleBtn("op:+"); e.preventDefault(); }
      else if (k === "-") { handleBtn("op:−"); e.preventDefault(); }
      else if (k === "*") { handleBtn("op:×"); e.preventDefault(); }
      else if (k === "/") { handleBtn("op:÷"); e.preventDefault(); }
      else if (k === "^") { handleBtn("powxy"); e.preventDefault(); }
      else if (k === "(") { handleBtn("("); e.preventDefault(); }
      else if (k === ")") { handleBtn(")"); e.preventDefault(); }
      else if (k === "i") { handleBtn("imag"); e.preventDefault(); }
      else if (k === "Enter" || k === "=") { handleBtn("eval"); e.preventDefault(); }
      else if (k === "Backspace") { handleBtn("back"); e.preventDefault(); }
      else if (k === "Escape") { handleBtn("ac"); e.preventDefault(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleBtn]);

  useEffect(() => {
    displayRef.current?.scrollTo({ left: displayRef.current.scrollWidth, behavior: "smooth" });
  }, [expr]);

  type Btn = {
    l: string;
    a: string;
    v: "n" | "o" | "f" | "s" | "eq" | "clr";
    sp?: number;
  };

  const btns: Btn[][] = [
    [
      { l: second ? "2nd ●" : "2nd", a: "2nd", v: "s" },
      { l: angleMode === "deg" ? "DEG" : "RAD", a: "deg-rad", v: "s" },
      { l: "(", a: "(", v: "f" },
      { l: ")", a: ")", v: "f" },
      { l: "⌫", a: "back", v: "f" },
      { l: "AC", a: "ac", v: "clr" },
    ],
    [
      { l: second ? "sin⁻¹" : "sin", a: second ? "fn:asin(" : "fn:sin(", v: "f" },
      { l: second ? "cos⁻¹" : "cos", a: second ? "fn:acos(" : "fn:cos(", v: "f" },
      { l: second ? "tan⁻¹" : "tan", a: second ? "fn:atan(" : "fn:tan(", v: "f" },
      { l: "π", a: "pi", v: "f" },
      { l: "e", a: "e", v: "f" },
      { l: "x⁻¹", a: "inv", v: "f" },
    ],
    [
      { l: second ? "x³" : "x²", a: second ? "pow3" : "pow2", v: "f" },
      { l: second ? "³√x" : "√x", a: second ? "fn:cbrt(" : "fn:sqrt(", v: "f" },
      { l: "yˣ", a: "powxy", v: "f" },
      { l: second ? "10ˣ" : "log", a: second ? "10x" : "fn:log(", v: "f" },
      { l: second ? "eˣ" : "ln", a: second ? "fn:exp(" : "fn:ln(", v: "f" },
      { l: "n!", a: "fact", v: "f" },
    ],
    [
      { l: "7", a: "d:7", v: "n" },
      { l: "8", a: "d:8", v: "n" },
      { l: "9", a: "d:9", v: "n" },
      { l: "÷", a: "op:÷", v: "o" },
      { l: "i", a: "imag", v: "f" },
      { l: "%", a: "pct", v: "f" },
    ],
    [
      { l: "4", a: "d:4", v: "n" },
      { l: "5", a: "d:5", v: "n" },
      { l: "6", a: "d:6", v: "n" },
      { l: "×", a: "op:×", v: "o" },
      { l: "Ans", a: "ans", v: "f" },
      { l: "±", a: "negate", v: "f" },
    ],
    [
      { l: "1", a: "d:1", v: "n" },
      { l: "2", a: "d:2", v: "n" },
      { l: "3", a: "d:3", v: "n" },
      { l: "−", a: "op:−", v: "o" },
      { l: "M+", a: "mem+", v: "f" },
      { l: "MR", a: "mr", v: "f" },
    ],
    [
      { l: "0", a: "d:0", v: "n", sp: 2 },
      { l: ".", a: "d:.", v: "n" },
      { l: "+", a: "op:+", v: "o" },
      { l: "=", a: "eval", v: "eq", sp: 2 },
    ],
  ];

  const variantCls: Record<Btn["v"], string> = {
    n: "bg-white/95 text-gray-900 hover:bg-white active:bg-gray-100 border-white/20",
    o: "bg-amber-500 text-white hover:bg-amber-400 active:bg-amber-600 border-amber-400/30 text-xl",
    f: "bg-white/10 text-gray-200 hover:bg-white/20 active:bg-white/5 border-white/10",
    s: "bg-white/10 text-gray-200 hover:bg-white/20 active:bg-white/5 border-white/10",
    eq: "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 border-blue-400/30 text-xl font-black",
    clr: "bg-red-500/25 text-red-300 hover:bg-red-500/40 active:bg-red-500/15 border-red-400/20",
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl bg-gray-900 shadow-2xl ring-1 ring-white/10">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                angleMode === "deg"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {angleMode.toUpperCase()}
            </span>
            {memory !== 0 && (
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400">
                M
              </span>
            )}
            {isComplex(lastAns) && (
              <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-purple-400">
                CMPLX
              </span>
            )}
          </div>
          {second && (
            <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
              2nd
            </span>
          )}
        </div>

        {/* Display */}
        <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-gray-950/80 p-4 ring-1 ring-white/5">
          <div
            ref={displayRef}
            className="overflow-x-auto whitespace-nowrap text-right font-mono text-lg leading-relaxed text-gray-400"
            dir="ltr"
            style={{ direction: "ltr", textAlign: "right" }}
          >
            {displayExpr(expr) || " "}
          </div>
          <div
            className="mt-1 text-right font-mono text-3xl font-bold leading-tight text-white sm:text-4xl"
            dir="ltr"
            style={{ direction: "ltr", textAlign: "right" }}
          >
            {preview || "0"}
          </div>
        </div>

        {/* History drawer */}
        {history.length > 0 && (
          <details className="mx-4 mb-3">
            <summary className="cursor-pointer text-[11px] font-semibold text-gray-500 hover:text-gray-400">
              היסטוריה ({history.length})
            </summary>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-xl bg-gray-950/50 p-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSegs([h.result]);
                    setEvaluated(true);
                  }}
                  className="flex w-full items-baseline justify-between gap-2 rounded-lg px-2 py-1 text-right hover:bg-white/5"
                  dir="ltr"
                  style={{ direction: "ltr", textAlign: "right" }}
                >
                  <span className="truncate font-mono text-[11px] text-gray-500">
                    {h.expr}
                  </span>
                  <span className="shrink-0 font-mono text-xs font-bold text-gray-300">
                    = {h.result}
                  </span>
                </button>
              ))}
            </div>
          </details>
        )}

        {/* Button grid */}
        <div className="grid grid-cols-6 gap-[3px] px-3 pb-4">
          {btns.flat().map((b, i) => (
            <button
              key={`${b.a}-${i}`}
              type="button"
              onClick={() => handleBtn(b.a)}
              className={`flex items-center justify-center rounded-xl border font-semibold transition-all duration-100 ${variantCls[b.v]} ${
                b.sp === 2 ? "col-span-2" : ""
              } ${b.v === "n" ? "h-14 text-lg" : "h-12 text-sm"}`}
            >
              {b.l}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-text-subtle">
        ניתן להשתמש גם במקלדת: מספרים, פעולות, i למרוכבים, Enter לחישוב, Esc לניקוי
      </p>
    </div>
  );
}

function displayExpr(raw: string): string {
  return raw
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/pi/gi, "π")
    .replace(/Ans/gi, "Ans");
}
