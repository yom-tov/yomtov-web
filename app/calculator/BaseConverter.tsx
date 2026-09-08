"use client";

import { useMemo, useState } from "react";
import { toBase, fromBase, bitwiseOp } from "./calc-engine";

type Base = 2 | 8 | 10 | 16;

const BASES: { id: Base; label: string; short: string }[] = [
  { id: 16, label: "הקסדצימלי", short: "HEX" },
  { id: 10, label: "עשרוני", short: "DEC" },
  { id: 8, label: "אוקטלי", short: "OCT" },
  { id: 2, label: "בינארי", short: "BIN" },
];

const BITWISE_OPS = ["AND", "OR", "XOR", "NOT", "SHL", "SHR"] as const;

const validChars: Record<Base, RegExp> = {
  2: /^[01]*$/,
  8: /^[0-7]*$/,
  10: /^-?[0-9]*$/,
  16: /^[0-9A-Fa-f]*$/,
};

const HEX_KEYS = [
  "A", "B", "C", "D", "E", "F",
  "7", "8", "9", "0",
  "4", "5", "6", "⌫",
  "1", "2", "3", "AC",
];

export function BaseConverter() {
  const [inputBase, setInputBase] = useState<Base>(10);
  const [inputValue, setInputValue] = useState("0");
  const [bitwiseMode, setBitwiseMode] = useState<typeof BITWISE_OPS[number] | null>(null);
  const [operandB, setOperandB] = useState("0");

  const decimalValue = useMemo(() => {
    if (!inputValue || inputValue === "-") return 0;
    return fromBase(inputValue, inputBase);
  }, [inputValue, inputBase]);

  const conversions = useMemo(() => {
    return BASES.map((b) => ({
      ...b,
      value: toBase(decimalValue, b.id),
    }));
  }, [decimalValue]);

  const bitwiseResult = useMemo(() => {
    if (!bitwiseMode) return null;
    const bVal = fromBase(operandB, inputBase);
    try {
      const result = bitwiseOp(decimalValue, bVal, bitwiseMode);
      return {
        dec: result,
        display: toBase(result, inputBase),
      };
    } catch {
      return null;
    }
  }, [bitwiseMode, decimalValue, operandB, inputBase]);

  const handleKey = (key: string) => {
    if (key === "AC") {
      setInputValue("0");
      setOperandB("0");
      setBitwiseMode(null);
      return;
    }
    if (key === "⌫") {
      setInputValue((v) => (v.length <= 1 ? "0" : v.slice(0, -1)));
      return;
    }
    if (!validChars[inputBase].test(key)) return;
    setInputValue((v) => (v === "0" ? key : v + key));
  };

  const isKeyDisabled = (key: string) => {
    if (key === "AC" || key === "⌫") return false;
    return !validChars[inputBase].test(key);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl bg-gray-900 shadow-2xl ring-1 ring-white/10">
        {/* Base selector */}
        <div className="flex gap-1 p-3">
          {BASES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                const dec = decimalValue;
                setInputBase(b.id);
                setInputValue(toBase(dec, b.id));
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                inputBase === b.id
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "bg-white/10 text-gray-400 hover:bg-white/15"
              }`}
            >
              {b.short}
            </button>
          ))}
        </div>

        {/* Main display */}
        <div className="mx-4 mb-3 rounded-2xl bg-gray-950/80 p-4 ring-1 ring-white/5">
          <div className="text-[10px] font-bold tracking-wider text-cyan-400/70">
            {BASES.find((b) => b.id === inputBase)?.short}
          </div>
          <div
            className="mt-1 overflow-x-auto whitespace-nowrap text-right font-mono text-3xl font-bold text-white"
            dir="ltr"
          >
            {inputValue || "0"}
          </div>
        </div>

        {/* All base conversions */}
        <div className="mx-4 mb-3 space-y-1">
          {conversions
            .filter((c) => c.id !== inputBase)
            .map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
              >
                <span className="text-[10px] font-bold tracking-wider text-gray-500">
                  {c.short}
                </span>
                <span className="font-mono text-sm font-bold text-gray-300" dir="ltr">
                  {c.value}
                </span>
              </div>
            ))}
        </div>

        {/* Bitwise operations */}
        <div className="mx-4 mb-3">
          <div className="flex flex-wrap gap-1">
            {BITWISE_OPS.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setBitwiseMode(bitwiseMode === op ? null : op)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                  bitwiseMode === op
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                    : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
          {bitwiseMode && (
            <div className="mt-2 rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-400" dir="ltr">
                  {inputValue}
                </span>
                <span className="text-[10px] font-bold text-cyan-400">{bitwiseMode}</span>
                {bitwiseMode !== "NOT" && (
                  <input
                    type="text"
                    value={operandB}
                    onChange={(e) => {
                      if (validChars[inputBase].test(e.target.value) || e.target.value === "") {
                        setOperandB(e.target.value || "0");
                      }
                    }}
                    className="w-24 rounded-lg bg-gray-800 px-2 py-1 text-right font-mono text-xs text-white outline-none ring-1 ring-white/10 focus:ring-cyan-500/50"
                    dir="ltr"
                  />
                )}
                <span className="text-[10px] text-gray-500">=</span>
                <span className="font-mono text-sm font-bold text-cyan-300" dir="ltr">
                  {bitwiseResult?.display ?? "Error"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hex keypad */}
        <div className="grid grid-cols-4 gap-[3px] px-3 pb-4">
          {HEX_KEYS.map((key) => {
            const disabled = isKeyDisabled(key);
            const isAction = key === "AC" || key === "⌫";
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(key)}
                className={`flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                  isAction
                    ? key === "AC"
                      ? "bg-red-500/25 text-red-300 border-red-400/20 hover:bg-red-500/40"
                      : "bg-white/10 text-gray-200 border-white/10 hover:bg-white/20"
                    : disabled
                      ? "bg-white/5 text-gray-700 border-white/5 cursor-not-allowed"
                      : /[A-F]/.test(key)
                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/25"
                        : "bg-white/95 text-gray-900 border-white/20 hover:bg-white"
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
