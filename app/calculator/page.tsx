import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CalculatorClient } from "./CalculatorClient";

export const metadata: Metadata = {
  title: "מחשבון הנדסי",
  description: "מחשבוני עזר לחישובי חוק אוהם, מעגלים סדרתיים ומקבילים ועוד.",
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
          כלי חישוב מהירים לחוק אוהם, הספק, וקיבוץ נגדים. אין צורך במחשבון חיצוני.
        </p>
      </header>
      <div className="mt-8">
        <CalculatorClient />
      </div>
    </div>
  );
}
