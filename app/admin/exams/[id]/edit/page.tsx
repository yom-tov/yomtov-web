import { notFound } from "next/navigation";
import { ExamForm } from "@/components/admin/ExamForm";
import { readExams } from "@/lib/admin/content-io";

export const dynamic = "force-dynamic";

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: encoded } = await params;
  const id = decodeURIComponent(encoded);
  const { data: exams } = await readExams();
  const exam = exams.find((e) => e.id === id);
  if (!exam) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">עריכת מבחן</h1>
      <p className="mt-1 text-sm text-text-muted num">{exam.title}</p>
      <div className="mt-6">
        <ExamForm mode="edit" initial={exam} />
      </div>
    </div>
  );
}
