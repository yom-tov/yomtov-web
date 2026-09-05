"use client";
import { useState } from "react";
import { Maximize2, Loader2 } from "lucide-react";

export function PdfPreview({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/40 px-4 py-2.5">
        <div className="text-sm font-semibold text-text truncate">{title}</div>
        <a
          href={src}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface hover:text-primary-700 dark:hover:text-primary-300"
          aria-label="פתח PDF בכרטיסייה חדשה"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          מסך מלא
        </a>
      </div>
      <div className="relative min-h-[640px] bg-surface-2">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex items-center gap-2 text-sm text-text-subtle">
              <Loader2 className="h-4 w-4 animate-spin" />
              טוען תצוגה מקדימה…
            </div>
          </div>
        )}
        <iframe
          src={`${src}#toolbar=1&view=FitH`}
          title={`תצוגה מקדימה: ${title}`}
          className="h-[80vh] max-h-[900px] w-full"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
