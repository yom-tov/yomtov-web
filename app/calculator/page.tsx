import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CalculatorClient } from "./CalculatorClient";

export const metadata: Metadata = {
  title: "מחשבון הנדסי",
  description:
    "מחשבון מדעי הנדסי מלא — מספרים מרוכבים, מטריצות, מערכות משוואות, שורשי פולינום, בסיסי מספרים, סטטיסטיקה, קבועים פיזיקליים, ממיר יחידות וחוק אוהם.",
};

export default function CalculatorPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: "ראשי", href: "/" }, { label: "מחשבון" }]}
      />
      <header className="mt-6">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">
          מחשבון הנדסי
        </h1>
        <p className="mt-2 max-w-2xl text-base text-text-muted">
          מחשבון מדעי הנדסי ברמה הגבוהה ביותר — מספרים מרוכבים, מטריצות, מערכות משוואות, שורשי פולינום, בסיסי מספרים, סטטיסטיקה, קבועים פיזיקליים, ממיר יחידות וחוק אוהם.
        </p>
      </header>
      <div className="mt-8">
        <CalculatorClient />
      </div>
    </div>
  );
}
