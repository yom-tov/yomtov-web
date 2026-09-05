"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { FileText, Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

export interface UploadedFile {
  url: string;
  sizeBytes: number;
  pathname: string;
  filename: string;
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function FileUpload({
  label,
  value,
  onChange,
  onError,
  accept = "application/pdf",
}: {
  label: string;
  value: UploadedFile | null;
  onChange: (v: UploadedFile | null) => void;
  onError?: (msg: string) => void;
  accept?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const doUpload = async (file: File) => {
    setBusy(true);
    setProgress(0);
    setErr(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
        contentType: file.type || "application/pdf",
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });
      onChange({
        url: blob.url,
        sizeBytes: file.size,
        pathname: blob.pathname,
        filename: file.name,
      });
    } catch (e) {
      const msg = (e as Error).message || "העלאה נכשלה";
      setErr(msg);
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  const onFilePick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) doUpload(f);
    e.target.value = "";
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) doUpload(f);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold text-text">{label}</div>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-text">{value.filename}</div>
            <div className="text-xs text-text-subtle num">{fmtSize(value.sizeBytes)}</div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="הסר קובץ"
            className="rounded-lg p-1.5 text-text-subtle hover:bg-white hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className={clsx(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            busy ? "border-primary-400 bg-primary-50/40" : "border-border hover:border-primary-300 hover:bg-primary-50/30"
          )}
        >
          {busy ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <div className="text-sm text-text-muted num">מעלה… {progress}%</div>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-text-subtle" />
              <div className="text-sm text-text-muted">גרור לכאן קובץ PDF או</div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
              >
                <FileText className="h-3.5 w-3.5" />
                בחר קובץ
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={onFilePick}
              />
              <div className="text-[11px] text-text-subtle">עד 30 MB · PDF בלבד</div>
            </>
          )}
        </div>
      )}

      {err && (
        <div className="inline-flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5" />
          {err}
        </div>
      )}
    </div>
  );
}
