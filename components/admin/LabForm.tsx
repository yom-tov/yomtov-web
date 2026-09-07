"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Video } from "lucide-react";
import { createLabAction, updateLabAction } from "@/app/admin/labs/actions";
import type { Lab } from "@/types/content";

type Mode = "create" | "edit";

function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  const shortMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];
  if (/^[a-zA-Z0-9_-]{5,20}$/.test(trimmed)) return trimmed;
  return trimmed;
}

export function LabForm({ mode, initial }: { mode: Mode; initial?: Lab }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(
    initial?.youtubeId ? `https://www.youtube.com/shorts/${initial.youtubeId}` : ""
  );

  const youtubeId = useMemo(() => extractYouTubeId(youtubeUrl), [youtubeUrl]);

  const submit = () => {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createLabAction({ slug, title, youtubeId })
          : await updateLabAction(initial!.id, { title, youtubeId });
      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success(mode === "create" ? "הסרטון נשמר" : "הסרטון עודכן", {
        action: res.commitUrl
          ? { label: "commit", onClick: () => window.open(res.commitUrl, "_blank") }
          : undefined,
      });
      router.push("/admin/labs");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="max-w-3xl space-y-6"
    >
      <Link
        href="/admin/labs"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" /> חזרה לרשימת הסרטונים
      </Link>

      {mode === "create" && (
        <Field label="Slug (לדוגמה measure-voltage-scope)">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="input font-mono"
            placeholder="a-z 0-9 -"
          />
        </Field>
      )}

      <Field label="כותרת">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="input"
        />
      </Field>

      <Field label="קישור YouTube Short (או מזהה סרטון)">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 shrink-0 text-red-500" />
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            required
            className="input flex-1"
            placeholder="https://www.youtube.com/shorts/..."
            dir="ltr"
          />
        </div>
      </Field>

      {youtubeId && youtubeId.length >= 5 && (
        <div className="rounded-xl border border-border bg-neutral-50 p-4 dark:bg-neutral-900">
          <p className="mb-2 text-xs font-semibold text-text-subtle">תצוגה מקדימה</p>
          <div className="mx-auto max-w-[200px] overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/0.jpg`}
              alt="תמונה ממוזערת"
              className="w-full"
            />
          </div>
          <p className="mt-2 text-center font-mono text-[11px] text-text-subtle">
            ID: {youtubeId}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-subtle">
          שמירה תפרוס לפרודקשן תוך ~30-60 שניות.
        </div>
        <button
          type="submit"
          disabled={pending || !title || !youtubeId || youtubeId.length < 5}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending ? "שומר…" : mode === "create" ? "שמור סרטון" : "עדכן"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text);
          font-size: 14px;
        }
        .input:focus {
          outline: none;
          border-color: var(--primary-500);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-text-subtle">{label}</span>
      {children}
    </label>
  );
}
