import Link from "next/link";
import { Edit3, Palette } from "lucide-react";
import { clsx } from "clsx";
import { readSubjects } from "@/lib/admin/content-io";
import { subjectIcon } from "@/lib/subject-icons";
import { PageHeader } from "@/components/admin/ui/primitives";
import { HiddenToggle } from "@/components/admin/HiddenToggle";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const { data } = await readSubjects();
  return (
    <div className="max-w-5xl">
      <PageHeader
        icon={<Palette className="h-5 w-5" />}
        title="קטגוריות (תחומי לימוד)"
        description={`${data.length} תחומים. אפשר לערוך שם, תיאור, אייקון וצבע, או להסתיר תחום מהאתר. הוספת תחום חדש דורשת פיתוח (דף חדש באתר).`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((s) => {
          const Icon = subjectIcon(s.icon);
          return (
            <div key={s.id} className={clsx("overflow-hidden rounded-2xl border border-border bg-surface", s.hidden && "opacity-60")}>
              <div className={`h-2 bg-gradient-to-l ${s.color}`} />
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold text-text">{s.hebrewTitle}</div>
                    <div className="font-mono text-[11px] text-text-subtle">/{s.id}</div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-text-muted">{s.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/admin/subjects/${s.id}/edit`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary-300 hover:text-primary-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> ערוך
                  </Link>
                  <HiddenToggle kind="subject" id={s.id} hidden={!!s.hidden} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
