import { readAssignments } from "@/lib/admin/content-io";
import { AssignmentsListClient } from "./AssignmentsListClient";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage() {
  const { data } = await readAssignments();
  return <AssignmentsListClient items={data} />;
}
