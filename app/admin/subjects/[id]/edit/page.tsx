import { notFound } from "next/navigation";
import { readSubjects } from "@/lib/admin/content-io";
import { SubjectForm } from "@/components/admin/SubjectForm";
import type { SubjectId } from "@/types/content";

export const dynamic = "force-dynamic";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await readSubjects();
  const s = data.find((x) => x.id === (id as SubjectId));
  if (!s) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">עריכת קטגוריה</h1>
      <p className="mt-1 text-sm text-text-muted num">{s.hebrewTitle}</p>
      <div className="mt-6"><SubjectForm initial={s} /></div>
    </div>
  );
}
