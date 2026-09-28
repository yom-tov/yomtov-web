import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ExternalLink, PenLine } from "lucide-react";
import { db } from "@/lib/db";
import { siteContent } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { mergeValues } from "@/lib/site-content/fields";
import { CONTENT_PAGES, SECTIONS } from "@/lib/site-content/registry";
import { LinkBtn, PageHeader } from "@/components/admin/ui/primitives";
import { SectionEditor } from "@/components/admin/site/SectionEditor";

export const dynamic = "force-dynamic";

export default async function SiteContentPage({ params }: { params: Promise<{ page: string }> }) {
  await connection();
  const { page: pageId } = await params;
  const page = CONTENT_PAGES.find((p) => p.id === pageId);
  if (!page) notFound();

  const rows = await db
    .select()
    .from(siteContent)
    .where(inArray(siteContent.key, page.sections as string[]))
    .catch(() => [] as (typeof siteContent.$inferSelect)[]);
  const stored = new Map(rows.map((r) => [r.key, r.value as Record<string, unknown>]));

  return (
    <div className="max-w-4xl">
      <PageHeader
        icon={<PenLine className="h-5 w-5" />}
        title={page.title}
        description={page.description}
        back={{ href: "/admin/site", label: "כל הדפים" }}
        actions={
          <LinkBtn href={page.previewHref} external size="sm">
            <ExternalLink className="h-3.5 w-3.5" />
            צפה בדף
          </LinkBtn>
        }
      />
      <div className="space-y-3">
        {page.sections.map((id, i) => {
          const def = SECTIONS[id];
          return (
            <SectionEditor
              key={id}
              id={id}
              def={def}
              initial={mergeValues(def, stored.get(id)) as Record<string, unknown>}
              defaultOpen={i === 0}
              placeholders={page.placeholders}
            />
          );
        })}
      </div>
    </div>
  );
}
