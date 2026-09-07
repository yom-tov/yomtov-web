import { LabForm } from "@/components/admin/LabForm";

export default function NewLabPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">סרטון מעבדה חדש</h1>
      <p className="mt-1 text-sm text-text-muted">מלא את הפרטים והדבק קישור YouTube Short.</p>
      <div className="mt-6"><LabForm mode="create" /></div>
    </div>
  );
}
