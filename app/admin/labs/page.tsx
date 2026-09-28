import { Beaker } from "lucide-react";
import { readLabs } from "@/lib/admin/content-io";
import { LinkBtn, PageHeader } from "@/components/admin/ui/primitives";
import { LabsListClient } from "./LabsListClient";

export const dynamic = "force-dynamic";

export default async function AdminLabsPage() {
  const { data } = await readLabs();
  // Same order as the public /labs page: higher "order" first.
  const labs = [...data].sort((a, b) => b.order - a.order);
  const hidden = labs.filter((l) => l.hidden).length;
  return (
    <div className="max-w-4xl">
      <PageHeader
        icon={<Beaker className="h-5 w-5" />}
        title="סרטוני מעבדה"
        description={`${labs.length} סרטונים${hidden ? ` · ${hidden} מוסתרים` : ""} · שינויים מופיעים באתר תוך כדקה`}
        actions={
          <LinkBtn href="/admin/labs/new" variant="primary">
            + סרטון חדש
          </LinkBtn>
        }
      />
      <LabsListClient key={labs.map((l) => `${l.id}:${l.hidden ? 1 : 0}`).join()} items={labs} />
    </div>
  );
}
