import Link from "next/link";
import { readSubjects } from "@/lib/admin/content-io";
import { Edit3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const { data } = await readSubjects();
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-text">קטגוריות</h1>
        <p className="text-sm text-text-muted">
          שלוש קטגוריות קבועות. אפשר לערוך כותרת/תיאור/אייקון/צבעים - לא ניתן להוסיף או למחוק.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((s) => (
          <div key={s.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className={`h-2 bg-gradient-to-l ${s.color}`} />
            <div className="p-4">
              <div className="text-lg font-extrabold text-text">{s.hebrewTitle}</div>
              <div className="mt-1 font-mono text-[11px] text-text-subtle">{s.id}</div>
              <p className="mt-3 text-sm text-text-muted line-clamp-3">{s.description}</p>
              <Link
                href={`/admin/subjects/${s.id}/edit`}
                className="mt-4 inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary-300 hover:text-primary-700"
              >
                <Edit3 className="h-3.5 w-3.5" /> ערוך
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
