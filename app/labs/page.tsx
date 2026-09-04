import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Beaker } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "מעבדות",
  description: "מעבדות פרקטיות ופרוטוקולים ללימודי חשמל ואלקטרוניקה.",
};

export default function LabsPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "ראשי", href: "/" }, { label: "מעבדות" }]} />
      <header className="mt-6">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">מעבדות</h1>
        <p className="mt-2 max-w-2xl text-base text-text-muted">
          מדריכים ופרוטוקולים למעבדות פרקטיות בחשמל ואלקטרוניקה. עוד תכני מעבדה בהעלאה.
        </p>
      </header>
      <div className="mt-10">
        <EmptyState
          icon={<Beaker className="h-6 w-6" />}
          title="חומרי מעבדה בהעלאה"
          description="בקרוב יעלו הפרוטוקולים והמדריכים המלאים. בינתיים בחן את מבחני מה״ט של השנים האחרונות - רבים מהם כוללים ניתוח מעבדה מובנה."
          action={
            <Link
              href="/electricity/mahat-exams"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              למבחני מה״ט
              <ArrowLeft className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    </div>
  );
}
