"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const shift = size === "sm" ? "-translate-x-4" : "-translate-x-5";
  return (
    <label className={clsx("inline-flex select-none items-center gap-2", disabled ? "opacity-50" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors",
          track,
          checked ? "bg-primary-600" : "bg-border-strong",
        )}
      >
        {/* RTL: the knob rests on the right and slides left when on */}
        <span
          className={clsx(
            "absolute right-0.5 rounded-full bg-white shadow transition-transform",
            knob,
            checked && shift,
          )}
        />
      </button>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Visibility (eye) toggle — shows whether an item is visible on the site
// ---------------------------------------------------------------------------
export function VisibilityToggle({
  hidden,
  onToggle,
  pending,
  compact,
}: {
  hidden: boolean;
  onToggle: () => void;
  pending?: boolean;
  compact?: boolean;
}) {
  const label = hidden ? "מוסתר מהאתר" : "מוצג באתר";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      title={hidden ? "מוסתר — לחץ כדי להציג באתר" : "מוצג — לחץ כדי להסתיר מהאתר"}
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-60",
        hidden
          ? "border-border bg-surface-2 text-text-subtle hover:text-text"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
      )}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : hidden ? (
        <EyeOff className="h-3.5 w-3.5" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      {!compact && label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sortable list — drag handle (HTML5 DnD) + up/down buttons for touch/keyboard.
// The parent owns the order; onReorder receives the new array.
// ---------------------------------------------------------------------------
export function SortableList<T>({
  items,
  getKey,
  renderItem,
  onReorder,
  disabled,
  className,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (next: T[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onReorder(next);
  };

  return (
    <ul className={clsx("space-y-2", className)}>
      {items.map((item, i) => (
        <li
          key={getKey(item)}
          draggable={!disabled}
          onDragStart={(e) => {
            setDragIndex(i);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            setOverIndex(i);
          }}
          onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null) move(dragIndex, i);
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={clsx(
            "flex items-center gap-2 rounded-xl border bg-surface p-2 transition-colors",
            overIndex === i && dragIndex !== i ? "border-primary-400 bg-primary-50/40 dark:bg-primary-500/10" : "border-border",
            dragIndex === i && "opacity-50",
          )}
        >
          <span
            className={clsx("text-text-subtle", disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing")}
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">{renderItem(item, i)}</div>
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              disabled={disabled || i === 0}
              onClick={() => move(i, i - 1)}
              className="rounded p-0.5 text-text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-30"
              aria-label="הזז למעלה"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={disabled || i === items.length - 1}
              onClick={() => move(i, i + 1)}
              className="rounded p-0.5 text-text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-30"
              aria-label="הזז למטה"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
