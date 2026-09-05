import { readExams } from "@/lib/admin/content-io";
import { ExamsListClient } from "./ExamsListClient";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage() {
  const { data: exams } = await readExams();
  return <ExamsListClient items={exams} />;
}
