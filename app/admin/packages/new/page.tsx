import { PackageForm } from "@/components/admin/PackageForm";

export default function NewPackagePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">חבילה חדשה</h1>
      <p className="mt-1 text-sm text-text-muted">
        מלא את הפרטים ליצירת חבילת תוכן חדשה. לאחר היצירה, תוכל לשייך סרטונים
        לחבילה.
      </p>
      <div className="mt-6">
        <PackageForm mode="create" />
      </div>
    </div>
  );
}
