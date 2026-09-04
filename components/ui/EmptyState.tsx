import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface-2/40 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface text-text-subtle shadow-sm">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-lg font-bold text-text">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
