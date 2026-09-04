"use client";
import { useMemo, useState } from "react";
import { AssignmentCard } from "@/components/cards/AssignmentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search } from "lucide-react";
import type { Assignment } from "@/types/content";

export function AssignmentListClient({ items }: { items: Assignment[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const needle = q.toLowerCase().trim();
    return items.filter((a) => a.title.toLowerCase().includes(needle));
  }, [items, q]);

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-4 py-2.5 focus-within:border-primary-500">
          <Search className="h-4 w-4 text-text-subtle" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש בשם המטלה…"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
          />
          <span className="num text-xs text-text-subtle">{filtered.length}</span>
        </label>
      </div>
      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState
            title="אין תוצאות"
            description="לא נמצאו מטלות התואמות לחיפוש שלך."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
