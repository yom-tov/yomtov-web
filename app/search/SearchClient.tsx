"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { Search, X, FileText, NotebookPen } from "lucide-react";
import { searchIndex, SUBJECT_TITLE_HE } from "@/lib/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

const TYPE_LABEL: Record<string, string> = {
  "exam-mahat": 'מבחן מה"ט',
  "exam-education": "מבחן מ״החינוך",
  assignment: "מטלה",
};

export function SearchClient() {
  const [q, setQ] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(searchIndex, {
        includeScore: true,
        threshold: 0.35,
        keys: [
          { name: "title", weight: 3 },
          { name: "year", weight: 2 },
          { name: "subject", weight: 1 },
        ],
      }),
    []
  );

  const results = useMemo(() => {
    if (!q.trim()) return [];
    return fuse.search(q).map((r) => r.item);
  }, [fuse, q]);

  return (
    <div>
      <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-3 shadow-sm focus-within:border-primary-500">
        <Search className="h-5 w-5 text-text-subtle" />
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חפש מבחן, שנה, נושא או שם מטלה…"
          className="flex-1 bg-transparent text-base text-text placeholder:text-text-subtle focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="rounded-full p-1 text-text-subtle hover:bg-surface-2 hover:text-text"
            aria-label="נקה חיפוש"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>

      <div className="mt-6">
        {!q.trim() ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 p-8 text-sm text-text-muted">
            <div className="font-semibold text-text">רעיונות לחיפוש</div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {["קיץ 2024", "אביב 2023", "משרד החינוך", "מגברי שרת", "דיודות", "DC"].map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setQ(s)}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs hover:border-primary-300 hover:text-primary-700"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="אין תוצאות"
            description="לא נמצאו תוצאות לחיפוש שלך. נסה מילה אחרת, שנה, או שם מקצוע."
          />
        ) : (
          <>
            <div className="mb-4 text-sm text-text-muted num">
              {results.length} תוצאות עבור &quot;{q}&quot;
            </div>
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.url}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 hover:border-primary-200 hover:shadow-sm"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-50 text-primary-600">
                      {r.type === "assignment" ? (
                        <NotebookPen className="h-4.5 w-4.5" />
                      ) : (
                        <FileText className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text">
                        {r.title}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {SUBJECT_TITLE_HE[r.subject]} · {TYPE_LABEL[r.type]}
                      </div>
                    </div>
                    <Badge tone="neutral">פתח</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
