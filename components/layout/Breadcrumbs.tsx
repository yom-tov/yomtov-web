import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="פירורי לחם" className="text-sm text-text-subtle">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1.5">
              {c.href && !isLast ? (
                <Link
                  href={c.href}
                  className="rounded px-1 hover:text-primary-700 hover:underline underline-offset-4 dark:hover:text-primary-300"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="px-1 text-text" aria-current={isLast ? "page" : undefined}>
                  {c.label}
                </span>
              )}
              {!isLast && (
                <ChevronLeft className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
