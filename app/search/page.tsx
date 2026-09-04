import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "חיפוש",
  description: "חיפוש חופשי בכל המבחנים, המטלות והמעבדות במאגר.",
};

export default function SearchPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "ראשי", href: "/" }, { label: "חיפוש" }]} />
      <header className="mt-6">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">
          חיפוש במאגר
        </h1>
        <p className="mt-2 max-w-2xl text-base text-text-muted">
          מצא מבחן, מטלה, שנה, מועד או נושא. החיפוש מסנן בזמן אמת מתוך כל המאגר.
        </p>
      </header>
      <div className="mt-8">
        <SearchClient />
      </div>
    </div>
  );
}
