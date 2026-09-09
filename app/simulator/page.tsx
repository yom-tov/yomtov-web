import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "סימולטור מעגלים",
  description:
    "סימולטור מעגלים חשמליים אינטראקטיבי — בנו, בדקו ולמדו מעגלים בזמן אמת.",
};

const SIMULATOR_URL =
  "https://www.falstad.com/circuit/circuitjs.html?startCircuit=voltdivide.txt";

export default function SimulatorPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="container-page py-4">
        <Breadcrumbs
          items={[
            { label: "ראשי", href: "/" },
            { label: "מעבדות", href: "/labs" },
            { label: "סימולטור מעגלים" },
          ]}
        />
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">
              סימולטור מעגלים
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              סימולטור אינטראקטיבי מבוסס CircuitJS — בנו מעגלים, הריצו סימולציה
              וצפו בתוצאות בזמן אמת.
            </p>
          </div>
          <Link
            href="/labs"
            className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary-200 sm:inline-flex"
          >
            חזרה למעבדות
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1 border-t border-border">
        <iframe
          src={SIMULATOR_URL}
          title="סימולטור מעגלים — Falstad"
          className="h-full w-full"
          style={{ minHeight: "calc(100vh - 10rem)" }}
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
}
