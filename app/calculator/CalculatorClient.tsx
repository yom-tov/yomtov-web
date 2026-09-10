"use client";

import { useState } from "react";
import {
  Calculator,
  Hash,
  Atom,
  FlaskConical,
  Zap,
  SquareFunction,
} from "lucide-react";
import { clsx } from "clsx";
import { ScientificCalc } from "./ScientificCalc";
import { BaseConverter } from "./BaseConverter";
import { ConstantsLib } from "./ConstantsLib";
import { UnitConverter } from "./UnitConverter";
import { EngineeringCalc } from "./EngineeringCalc";

type Tab =
  | "scientific"
  | "base"
  | "constants"
  | "converter"
  | "engineering"
  | "ecalc";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "ecalc", label: "מחשבון — eCalc", icon: SquareFunction },
  { id: "scientific", label: "מחשבון מדעי", icon: Calculator },
  { id: "base", label: "בסיסי מספרים", icon: Hash },
  { id: "constants", label: "קבועים פיזיקליים", icon: Atom },
  { id: "converter", label: "ממיר יחידות", icon: FlaskConical },
  { id: "engineering", label: "חוק אוהם", icon: Zap },
];

export function CalculatorClient() {
  const [tab, setTab] = useState<Tab>("ecalc");

  return (
    <div>
      {/* Scrollable tab bar */}
      <div className="mb-6 overflow-x-auto pb-1">
        <div className="flex gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={clsx(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                  active
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/25"
                    : "bg-surface border border-border text-text-muted hover:bg-surface-2 hover:text-text",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === "ecalc" && (
        <div className="flex justify-center">
          <div className="overflow-hidden rounded-2xl border border-border shadow-lg bg-[#f0f0f0]">
            <iframe
              src="/ecalc/index.html"
              title="מחשבון מדעי — eCalc"
              className="border-0"
              style={{ width: "740px", height: "570px", maxWidth: "100%" }}
              allow="fullscreen"
            />
          </div>
        </div>
      )}
      {tab === "scientific" && <ScientificCalc />}
      {tab === "base" && <BaseConverter />}
      {tab === "constants" && <ConstantsLib />}
      {tab === "converter" && <UnitConverter />}
      {tab === "engineering" && <EngineeringCalc />}
    </div>
  );
}
