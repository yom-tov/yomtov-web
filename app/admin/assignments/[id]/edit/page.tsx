import { notFound } from "next/navigation";
import { AssignmentForm } from "@/components/admin/AssignmentForm";
import { readAssignments } from "@/lib/admin/content-io";

export const dynamic = "force-dynamic";

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: encoded } = await params;
  const id = decodeURIComponent(encoded);
  const { data } = await readAssignments();
  const a = data.find((x) => x.id === id);
  if (!a) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">עריכת מטלה</h1>
      <p className="mt-1 text-sm text-text-muted num">{a.title}</p>
      <div className="mt-6"><AssignmentForm mode="edit" initial={a} /></div>
    </div>
  );
}
