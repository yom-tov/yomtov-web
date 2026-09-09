import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "סימולטור פורייה",
  description:
    "סימולטור אינטראקטיבי של טורי פורייה — בנו גלים מהרמוניות, צפו בהתמרת פורייה בזמן אמת.",
};

const PHET_URL =
  "https://phet.colorado.edu/sims/html/fourier-making-waves/latest/fourier-making-waves_en.html";

export default function FourierPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="container-page py-4">
        <Breadcrumbs
          items={[
            { label: "ראשי", href: "/" },
            { label: "סימולטור פורייה" },
          ]}
        />
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">
              סימולטור פורייה — Fourier: Making Waves
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              סימולטור אינטראקטיבי מבית PhET — בנו גלים מהרמוניות, צפו בהתמרת
              פורייה וגלו את הקשר בין תחום הזמן לתחום התדר.
            </p>
          </div>
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary-200 sm:inline-flex"
          >
            חזרה לדף הבית
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1 border-t border-border">
        <iframe
          src={PHET_URL}
          title="Fourier: Making Waves — PhET Simulation"
          className="h-full w-full"
          style={{ minHeight: "calc(100vh - 10rem)" }}
          allow="fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
