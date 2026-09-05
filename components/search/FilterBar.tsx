"use client";
import { useMemo } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
}

export function FilterBar({
  filters,
  values,
  onChange,
  onClear,
  totalMatches,
}: {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  totalMatches?: number;
}) {
  const active = useMemo(
    () => Object.values(values).filter(Boolean).length,
    [values]
  );
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        {filters.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-subtle">{f.label}</span>
            <select
              value={values[f.key] || ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={clsx(
                "h-10 min-w-32 rounded-lg border border-border bg-surface px-3 text-sm text-text",
                "focus:border-primary-500 focus:outline-none",
                values[f.key] && "border-primary-400 bg-primary-50/40 dark:bg-primary-500/10"
              )}
            >
              <option value="">הכל</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                  {o.count != null ? ` (${o.count})` : ""}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="ms-auto flex items-center gap-3">
          {totalMatches != null && (
            <span className="text-sm text-text-muted num">
              {totalMatches} תוצאות
            </span>
          )}
          {active > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
              איפוס
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
