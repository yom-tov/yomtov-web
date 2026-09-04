"use client";
import { useMemo, useState } from "react";
import { ExamCard } from "@/components/cards/ExamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar, type FilterConfig } from "@/components/search/FilterBar";
import { SUBJECT_TITLE_HE, SOURCE_TITLE_HE } from "@/lib/content";
import type { Exam, SubjectId, ExamSource } from "@/types/content";

const SEASON_HE: Record<string, string> = {
  summer: "קיץ",
  spring: "אביב",
  winter: "חורף",
  fall: "סתיו",
};

export function AllExamsClient({ items }: { items: Exam[] }) {
  const [values, setValues] = useState<Record<string, string>>({});

  const filters: FilterConfig[] = useMemo(() => {
    const bySubject: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byYear: Record<string, number> = {};
    const bySeason: Record<string, number> = {};
    for (const e of items) {
      bySubject[e.subject] = (bySubject[e.subject] || 0) + 1;
      bySource[e.source] = (bySource[e.source] || 0) + 1;
      if (e.year) byYear[String(e.year)] = (byYear[String(e.year)] || 0) + 1;
      if (e.season) bySeason[e.season] = (bySeason[e.season] || 0) + 1;
    }
    return [
      {
        key: "subject",
        label: "תחום",
        options: Object.entries(bySubject).map(([v, c]) => ({
          value: v,
          label: SUBJECT_TITLE_HE[v as SubjectId] || v,
          count: c,
        })),
      },
      {
        key: "source",
        label: "מקור",
        options: Object.entries(bySource).map(([v, c]) => ({
          value: v,
          label: SOURCE_TITLE_HE[v as ExamSource] || v,
          count: c,
        })),
      },
      {
        key: "year",
        label: "שנה",
        options: Object.entries(byYear)
          .sort((a, b) => Number(b[0]) - Number(a[0]))
          .map(([v, c]) => ({ value: v, label: v, count: c })),
      },
      {
        key: "season",
        label: "מועד",
        options: Object.entries(bySeason).map(([v, c]) => ({
          value: v,
          label: SEASON_HE[v] || v,
          count: c,
        })),
      },
    ];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((e) => {
      if (values.subject && e.subject !== values.subject) return false;
      if (values.source && e.source !== values.source) return false;
      if (values.year && String(e.year) !== values.year) return false;
      if (values.season && e.season !== values.season) return false;
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
          <EmptyState title="אין תוצאות" description="נסה לאפס פילטרים." />
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
