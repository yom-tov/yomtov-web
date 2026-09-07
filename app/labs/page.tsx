import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { labs } from "@/lib/content";
import LabsClient from "./LabsClient";

export const metadata: Metadata = {
  title: "מעבדות",
  description:
    "סרטוני הדרכה קצרים למעבדות פרקטיות בחשמל ואלקטרוניקה — סקופ, מולטימטר, מגבר שרת, ספקי כוח ועוד.",
};

export default function LabsPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "ראשי", href: "/" }, { label: "מעבדות" }]} />
      <header className="mt-6">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">
          מעבדות
        </h1>
        <p className="mt-2 max-w-2xl text-base text-text-muted">
          סרטוני הדרכה קצרים למעבדות פרקטיות — איך עובדים עם סקופ, מולטימטר,
          מחולל אותות, מגבר שרת ועוד. לחצו על סרטון כדי לצפות.
        </p>
      </header>
      <LabsClient labs={labs} />
    </div>
  );
}
