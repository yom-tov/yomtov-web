import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AllExamsClient } from "./AllExamsClient";
import { exams } from "@/lib/content";

export const metadata: Metadata = {
  title: "כל המבחנים",
  description: "מבחני מה\"ט ומשרד החינוך בכל תחומי הלימוד — חשמל, אלקטרוניקה תקבילית וספרתית.",
};

export default function AllExamsPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "ראשי", href: "/" }, { label: "כל המבחנים" }]} />
      <header className="mt-6">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">כל המבחנים</h1>
        <p className="mt-2 text-base text-text-muted">
          <span className="num">{exams.length}</span> מבחנים במאגר. סנן לפי תחום, סוג, שנה או מועד.
        </p>
      </header>
      <div className="mt-8">
        <AllExamsClient items={exams} />
      </div>
    </div>
  );
}
