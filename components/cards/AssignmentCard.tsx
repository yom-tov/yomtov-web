import Link from "next/link";
import { NotebookPen, ChevronLeft, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatSize } from "@/lib/content";
import type { Assignment } from "@/types/content";

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const href = `/${assignment.subject}/assignments/${assignment.slug}`;
  const fileCount = assignment.files.length;
  const primary = assignment.files[0];
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <NotebookPen className="h-5 w-5" />
        </div>
        <Badge tone="neutral">
          {fileCount === 1 ? "קובץ יחיד" : `${fileCount} קבצים`}
        </Badge>
      </div>
      <div className="mt-4 flex-1">
        <h3 className="text-base font-bold text-text">{assignment.title}</h3>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
        <span className="inline-flex items-center gap-1 text-text-subtle num">
          <FileText className="h-3.5 w-3.5" />
          {formatSize(primary?.sizeBytes)}
        </span>
        <span className="inline-flex items-center gap-1 text-primary-600 transition-colors group-hover:text-primary-700 dark:text-primary-300 dark:group-hover:text-primary-200">
          לפריט
          <ChevronLeft className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
