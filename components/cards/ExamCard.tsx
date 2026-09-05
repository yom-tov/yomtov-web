import Link from "next/link";
import { FileText, Download, Sparkles, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { examSubtitle, formatSize, SOURCE_SLUG, SOURCE_TITLE_HE } from "@/lib/content";
import type { Exam } from "@/types/content";

export function ExamCard({ exam }: { exam: Exam }) {
  const href = `/${exam.subject}/${SOURCE_SLUG[exam.source]}/${exam.slug}`;
  const subtitle = examSubtitle(exam);
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
          <FileText className="h-5 w-5" strokeWidth={2} />
        </div>
        <Badge tone={exam.source === "mahat" ? "primary" : "accent"}>
          {SOURCE_TITLE_HE[exam.source]}
        </Badge>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-base font-bold text-text">{exam.title}</h3>
        {subtitle && (
          <div className="mt-1 text-sm text-text-muted num">{subtitle}</div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
        <div className="flex items-center gap-3 text-text-subtle">
          <span className="inline-flex items-center gap-1 num">
            <Download className="h-3.5 w-3.5" />
            {formatSize(exam.exam.sizeBytes)}
          </span>
          {exam.solution && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              פתרון
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-primary-600 transition-colors group-hover:text-primary-700 dark:text-primary-300 dark:group-hover:text-primary-200">
          לפריט
          <ChevronLeft className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
