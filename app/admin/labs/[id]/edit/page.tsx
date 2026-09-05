import { notFound } from "next/navigation";
import { readLabs } from "@/lib/admin/content-io";
import { LabForm } from "@/components/admin/LabForm";

export const dynamic = "force-dynamic";

export default async function EditLabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: encoded } = await params;
  const id = decodeURIComponent(encoded);
  const { data } = await readLabs();
  const l = data.find((x) => x.id === id);
  if (!l) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">עריכת מעבדה</h1>
      <p className="mt-1 text-sm text-text-muted num">{l.title}</p>
      <div className="mt-6"><LabForm mode="edit" initial={l} /></div>
    </div>
  );
}
