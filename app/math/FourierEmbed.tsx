"use client";

import { useState } from "react";
import { Maximize2, Minimize2, ExternalLink } from "lucide-react";
import Link from "next/link";

const PHET_URL =
  "https://phet.colorado.edu/sims/html/fourier-making-waves/latest/fourier-making-waves_en.html";

export default function FourierEmbed() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg bg-neutral-900">
          <div className="relative w-full" style={{ paddingBottom: "62.5%" }}>
            <iframe
              src={PHET_URL}
              title="Fourier: Making Waves — PhET"
              className="absolute inset-0 h-full w-full"
              allow="fullscreen"
              allowFullScreen
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary-200"
          >
            <Maximize2 className="h-4 w-4" />
            הגדל
          </button>
          <Link
            href="/fourier"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary-200"
          >
            <ExternalLink className="h-4 w-4" />
            פתח בדף נפרד
          </Link>
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative h-[90vh] w-[95vw] max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpanded(false)}
              className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="סגור תצוגה מורחבת"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
            <iframe
              src={PHET_URL}
              title="Fourier: Making Waves — PhET (תצוגה מורחבת)"
              className="h-full w-full"
              allow="fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
