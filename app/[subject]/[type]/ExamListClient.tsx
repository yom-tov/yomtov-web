"use client";
import { useMemo, useState } from "react";
import { ExamCard } from "@/components/cards/ExamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, type FilterConfig } from "@/components/search/FilterBar";
import type { Exam } from "@/types/content";

const SEASON_HE: Record<string, string> = {
  summer: "קיץ",
  spring: "אביב",
  winter: "חורף",
  fall: "סתיו",
};
const VERSION_HE: Record<string, string> = {
  a: "מועד א",
  b: "מועד ב",
  combined: "מועד א/ב",
};

function countBy<T>(items: T[], key: (t: T) => string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export function ExamListClient({ items }: { items: Exam[] }) {
  const [values, setValues] = useState<Record<string, string>>({});

  const filters: FilterConfig[] = useMemo(() => {
    const byYear = countBy(items, (e) => (e.year ? String(e.year) : null));
    const bySeason = countBy(items, (e) => e.season || null);
    const byVersion = countBy(items, (e) => e.version || null);
    const bySolution = countBy(items, (e) => (e.solution ? "yes" : "no"));

    const list: FilterConfig[] = [];
    list.push({
      key: "year",
      label: "שנה",
      options: Object.entries(byYear)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([v, c]) => ({ value: v, label: v, count: c })),
    });
    if (Object.keys(bySeason).length > 1) {
      list.push({
        key: "season",
        label: "מועד",
        options: Object.entries(bySeason).map(([v, c]) => ({
          value: v,
          label: SEASON_HE[v] || v,
          count: c,
        })),
      });
    }
    if (Object.keys(byVersion).length > 1) {
      list.push({
        key: "version",
        label: "גרסה",
        options: Object.entries(byVersion).map(([v, c]) => ({
          value: v,
          label: VERSION_HE[v] || v,
          count: c,
        })),
      });
    }
    list.push({
      key: "solution",
      label: "פתרון",
      options: [
        { value: "yes", label: "עם פתרון", count: bySolution.yes || 0 },
        { value: "no", label: "בלי פתרון", count: bySolution.no || 0 },
      ],
    });
    return list;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((e) => {
      if (values.year && String(e.year) !== values.year) return false;
      if (values.season && e.season !== values.season) return false;
      if (values.version && e.version !== values.version) return false;
      if (values.solution === "yes" && !e.solution) return false;
      if (values.solution === "no" && e.solution) return false;
      return true;
    });
  }, [items, values]);

  return (
    <>
      <FilterBar
        filters={filters}
        values={values}
        onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))}
        onClear={() => setValues({})}
        totalMatches={filtered.length}
      />
      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState
            title="אין תוצאות"
            description="לא נמצאו מבחנים התואמים את הפילטרים שבחרת. נסה לאפס את הפילטרים או לשנות אותם."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
