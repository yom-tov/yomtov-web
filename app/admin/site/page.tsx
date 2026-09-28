import { connection } from "next/server";
import Link from "next/link";
import { ChevronLeft, PenLine } from "lucide-react";
import { db } from "@/lib/db";
import { siteContent } from "@/lib/db/schema";
import { CONTENT_PAGES } from "@/lib/site-content/registry";
import { Badge, PageHeader } from "@/components/admin/ui/primitives";

export const dynamic = "force-dynamic";

export default async function SiteContentIndex() {
  await connection();
  const rows = await db
    .select({ key: siteContent.key })
    .from(siteContent)
    .catch(() => [] as { key: string }[]);
  const modified = new Set(rows.map((r) => r.key));

  return (
    <div className="max-w-5xl">
      <PageHeader
        icon={<PenLine className="h-5 w-5" />}
        title="טקסטים ודפים"
        description="כל הטקסטים השיווקיים באתר. שינוי נשמר ומופיע באתר תוך שניות — בלי לחכות לבנייה."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {CONTENT_PAGES.map((p) => {
          const changed = p.sections.filter((s) => modified.has(s)).length;
          return (
            <Link
              key={p.id}
              href={`/admin/site/${p.id}`}
              prefetch={false}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-text">{p.title}</span>
                  {changed > 0 && <Badge tone="primary">{changed} סקשנים נערכו</Badge>}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{p.description}</p>
                <div className="mt-2 text-[11px] text-text-subtle">{p.sections.length} סקשנים</div>
              </div>
              <ChevronLeft className="mt-1 h-5 w-5 text-text-subtle transition-transform group-hover:-translate-x-1" />
            </Link>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-text-subtle">
        תקנון האתר והצהרת הנגישות הם מסמכים משפטיים, ולכן הם נשארים בקוד ולא נערכים מכאן.
      </p>
    </div>
  );
}
