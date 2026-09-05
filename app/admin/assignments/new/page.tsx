import { AssignmentForm } from "@/components/admin/AssignmentForm";

export default function NewAssignmentPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">מטלה חדשה</h1>
      <p className="mt-1 text-sm text-text-muted">מלא את הפרטים והעלה קובץ אחד או יותר.</p>
      <div className="mt-6"><AssignmentForm mode="create" /></div>
    </div>
  );
}
