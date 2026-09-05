import { ExamForm } from "@/components/admin/ExamForm";

export default function NewExamPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">מבחן חדש</h1>
      <p className="mt-1 text-sm text-text-muted">
        מלא את הפרטים והעלה את קובץ ה־PDF. שמירה תפרסם את המבחן לאתר תוך דקה.
      </p>
      <div className="mt-6">
        <ExamForm mode="create" />
      </div>
    </div>
  );
}
