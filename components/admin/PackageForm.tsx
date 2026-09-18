"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  createPackageAction,
  updatePackageAction,
} from "@/app/admin/packages/actions";

type Mode = "create" | "edit";

interface PackageData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  priceDisplay: string;
  displayOrder: number;
  published: boolean;
}

export function PackageForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: PackageData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initial?.thumbnailUrl ?? "",
  );
  const [priceDisplay, setPriceDisplay] = useState(
    initial?.priceDisplay ?? "",
  );
  const [displayOrder, setDisplayOrder] = useState(
    initial?.displayOrder ?? 0,
  );
  const [published, setPublished] = useState(initial?.published ?? false);

  const canSubmit =
    !pending && title.trim().length > 0 && slug.trim().length > 0 && priceDisplay.trim().length > 0;

  const submit = () => {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createPackageAction({
              slug: slug.trim(),
              title: title.trim(),
              description: description.trim() || null,
              thumbnailUrl: thumbnailUrl.trim() || null,
              priceDisplay: priceDisplay.trim(),
              displayOrder,
              published,
            })
          : await updatePackageAction(initial!.id, {
              title: title.trim(),
              description: description.trim() || null,
              thumbnailUrl: thumbnailUrl.trim() || null,
              priceDisplay: priceDisplay.trim(),
              displayOrder,
              published,
            });

      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success(
        mode === "create" ? "החבילה נוצרה בהצלחה" : "החבילה עודכנה בהצלחה",
      );
      router.push("/admin/packages");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) submit();
      }}
      className="max-w-3xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <Link
          href="/admin/packages"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה לרשימת החבילות
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="כותרת">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="למשל: קורס חשמל מתקדם"
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="input font-mono"
            placeholder="advanced-electricity"
            disabled={mode === "edit"}
          />
        </Field>
        <Field label="מחיר תצוגה">
          <input
            value={priceDisplay}
            onChange={(e) => setPriceDisplay(e.target.value)}
            className="input"
            placeholder="149 ש״ח"
          />
        </Field>
        <Field label="סדר תצוגה">
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min={0}
            max={999}
            className="input"
          />
        </Field>
      </div>

      <Field label="תיאור (אופציונלי)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input !h-24 !py-2"
          placeholder="תיאור קצר של תוכן החבילה"
        />
      </Field>

      <Field label="URL תמונה ממוזערת (אופציונלי)">
        <input
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          className="input"
          placeholder="https://..."
        />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-primary-600"
        />
        <span className="font-semibold text-text">מפורסם (נראה לקונים)</span>
      </label>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-subtle">
          {mode === "create"
            ? "החבילה תישמר במסד הנתונים."
            : "שינויים ייכנסו לתוקף מיידית."}
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending
            ? "שומר…"
            : mode === "create"
              ? "צור חבילה"
              : "עדכן"}
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
        .input:disabled {
          opacity: 0.6;
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
