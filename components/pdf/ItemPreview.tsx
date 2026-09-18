"use client";

import { useState } from "react";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PdfPreview } from "./PdfPreview";
import { SolutionLock } from "./SolutionLock";
import { formatSize } from "@/lib/content";

interface FileInfo {
  label: string;
  role: "primary" | "solution" | "extra";
  url: string;
  path: string;
  sizeBytes: number | null;
}

export function ItemPreview({
  files,
  hasAssignmentSolutions,
  subject,
  slug,
}: {
  files: FileInfo[];
  hasAssignmentSolutions: boolean;
  subject: string;
  slug: string;
}) {
  const [activeSrc, setActiveSrc] = useState(files[0]?.path ?? "");
  const [activeLabel, setActiveLabel] = useState(files[0]?.label ?? "");

  function selectFile(path: string, label: string) {
    setActiveSrc(path);
    setActiveLabel(label);
  }

  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <PdfPreview key={activeSrc} src={activeSrc} title={activeLabel} />
      </div>

      <aside className="space-y-3">
        {files.map((f) => {
          const isActive = activeSrc === f.path;
          return (
            <div
              key={f.path}
              onClick={() => selectFile(f.path, f.label)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                isActive
                  ? "border-primary-400 bg-primary-50/30 ring-2 ring-primary-200/60 dark:border-primary-500 dark:bg-primary-500/10 dark:ring-primary-500/20"
                  : "border-border bg-surface hover:border-primary-200 dark:hover:border-primary-500/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200"
                      : "bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300"
                  }`}
                >
                  <FileText className="h-4.5 w-4.5" />
                </div>
                {f.role === "solution" ? (
                  <Badge tone="success">פתרון</Badge>
                ) : f.role === "extra" ? (
                  <Badge tone="neutral">נספח</Badge>
                ) : (
                  <Badge tone="primary">מבחן</Badge>
                )}
              </div>
              <div className="mt-3 text-sm font-semibold text-text">
                {f.label}
              </div>
              <div className="mt-1 text-xs text-text-subtle num">
                PDF · {formatSize(f.sizeBytes)}
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={f.path}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  הורדה
                </a>
                <a
                  href={f.path}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text hover:bg-surface-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  פתיחה
                </a>
              </div>
            </div>
          );
        })}

        {hasAssignmentSolutions && (
          <SolutionLock
            subject={subject}
            slug={slug}
            onPreview={(path, label) => selectFile(path, label)}
            activePreviewSrc={activeSrc}
          />
        )}
      </aside>
    </section>
  );
}
