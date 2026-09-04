import Link from "next/link";
import { Zap, CircuitBoard, Binary, ArrowLeft } from "lucide-react";
import type { Subject } from "@/types/content";

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Zap,
  CircuitBoard,
  Binary,
};

export function SubjectCard({
  subject,
  stats,
  size = "md",
}: {
  subject: Subject;
  stats?: string;
  size?: "md" | "lg";
}) {
  const Icon = ICONS[subject.icon] || Zap;
  return (
    <Link
      href={`/${subject.id}`}
      className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      {/* top colored strip */}
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${subject.color}`}
      />
      {/* decorative gradient corner */}
      <div
        className={`pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-gradient-to-br ${subject.color} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between">
        <div
          className={`grid ${size === "lg" ? "h-14 w-14" : "h-12 w-12"} place-items-center rounded-2xl bg-gradient-to-br ${subject.color} text-white shadow-md`}
        >
          <Icon className={size === "lg" ? "h-7 w-7" : "h-6 w-6"} strokeWidth={2.2} />
        </div>
        <ArrowLeft className="h-5 w-5 text-text-subtle transition-transform group-hover:-translate-x-1 group-hover:text-primary-600" />
      </div>
      <div className="relative mt-6">
        <h3 className={`${size === "lg" ? "text-2xl" : "text-xl"} font-extrabold text-text`}>
          {subject.hebrewTitle}
        </h3>
        <p className="mt-2 text-sm leading-6 text-text-muted">{subject.description}</p>
        {stats && (
          <div className="mt-4 inline-flex rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs font-semibold text-text-muted num">
            {stats}
          </div>
        )}
      </div>
    </Link>
  );
}
