"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import { ChevronDown, Loader2, RotateCcw, Save, Undo2 } from "lucide-react";
import type { Field as FieldDef, ItemShape, LooseItem, SectionDef } from "@/lib/site-content/fields";
import { Badge, Btn, Field, Input, Textarea } from "@/components/admin/ui/primitives";
import { saveSectionAction, resetSectionAction } from "@/app/admin/site/actions";
import { ListEditor } from "./ListEditor";

type Values = Record<string, unknown>;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function SectionEditor({
  id,
  def,
  initial,
  defaultOpen,
  placeholders,
}: {
  id: string;
  def: SectionDef;
  initial: Values;
  defaultOpen?: boolean;
  placeholders?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!!defaultOpen);
  const [saved, setSaved] = useState<Values>(initial);
  const [values, setValues] = useState<Values>(initial);
  const [version, setVersion] = useState(0); // remounts list editors on cancel/reset
  const [pending, start] = useTransition();

  const dirty = !same(values, saved);
  const modifiedFields = Object.entries(def.fields).filter(([k, f]) => !same(saved[k], f.default)).length;

  const set = (k: string, v: unknown) => setValues((prev) => ({ ...prev, [k]: v }));

  const save = () =>
    start(async () => {
      const res = await saveSectionAction(id, values);
      if (!res.ok) {
        toast.error(res.error ?? "השמירה נכשלה");
        return;
      }
      setSaved(values);
      toast.success("נשמר — השינוי כבר באתר");
      router.refresh();
    });

  const resetAll = () => {
    if (!confirm(`להחזיר את "${def.title}" לטקסטים המקוריים? השינויים שעשית כאן יימחקו.`)) return;
    start(async () => {
      const res = await resetSectionAction(id);
      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      const defaults = Object.fromEntries(Object.entries(def.fields).map(([k, f]) => [k, f.default]));
      setSaved(defaults);
      setValues(defaults);
      setVersion((v) => v + 1);
      toast.success("הוחזר למקור");
      router.refresh();
    });
  };

  const cancel = () => {
    setValues(saved);
    setVersion((v) => v + 1);
  };

  return (
    <section className={clsx("rounded-2xl border bg-surface", dirty ? "border-primary-300 dark:border-primary-500/50" : "border-border")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-right"
        aria-expanded={open}
      >
        <ChevronDown className={clsx("h-4 w-4 shrink-0 text-text-subtle transition-transform", open && "rotate-180")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-text">{def.title}</span>
            {modifiedFields > 0 && <Badge tone="primary">{modifiedFields} שדות שונו מהמקור</Badge>}
            {dirty && <Badge tone="warn">לא נשמר</Badge>}
          </div>
          {def.description && <div className="mt-0.5 text-xs text-text-subtle">{def.description}</div>}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {placeholders && (
            <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-text-muted">
              <b>מספרים חיים:</b> אפשר לכתוב בטקסט <span dir="ltr">{placeholders}</span> והם יוחלפו אוטומטית במספר העדכני.
            </p>
          )}
          <div className="grid gap-4">
            {Object.entries(def.fields).map(([key, f]) => (
              <FieldInput
                key={`${key}-${version}`}
                field={f}
                value={values[key]}
                modified={!same(values[key], f.default)}
                onChange={(v) => set(key, v)}
                onResetField={() => {
                  set(key, f.default);
                  setVersion((v) => v + 1);
                }}
              />
            ))}
          </div>

          <div className="sticky bottom-20 mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/95 p-2 backdrop-blur md:bottom-3">
            <Btn variant="primary" onClick={save} disabled={!dirty || pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              שמור
            </Btn>
            <Btn variant="ghost" onClick={cancel} disabled={!dirty || pending}>
              <Undo2 className="h-4 w-4" />
              בטל שינויים
            </Btn>
            <span className="flex-1" />
            {modifiedFields > 0 && (
              <Btn variant="ghost" size="sm" onClick={resetAll} disabled={pending}>
                <RotateCcw className="h-3.5 w-3.5" />
                החזר הכל למקור
              </Btn>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function FieldInput({
  field,
  value,
  modified,
  onChange,
  onResetField,
}: {
  field: FieldDef;
  value: unknown;
  modified: boolean;
  onChange: (v: unknown) => void;
  onResetField: () => void;
}) {
  const label = (
    <span className="flex items-center gap-2">
      {field.label}
      {modified && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onResetField();
          }}
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary-600 hover:underline dark:text-primary-300"
          title="החזר את השדה הזה לטקסט המקורי"
        >
          <RotateCcw className="h-3 w-3" />
          מקור
        </button>
      )}
    </span>
  );

  if (field.kind === "list") {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-subtle">{label}</span>
        {field.help && <span className="text-[11px] text-text-subtle">{field.help}</span>}
        <ListEditor
          shape={field.item as ItemShape}
          titleKey={field.titleKey}
          value={(value as LooseItem[]) ?? []}
          onChange={onChange}
          max={field.max}
        />
      </div>
    );
  }

  if (field.kind === "number") {
    return (
      <Field label={label} hint={field.help}>
        <Input
          type="number"
          min={field.min}
          max={field.max}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value === "" ? field.default : Number(e.target.value))}
          className="max-w-40"
        />
      </Field>
    );
  }

  const str = String(value ?? "");
  if (field.kind === "textarea") {
    return (
      <Field label={label} hint={field.help}>
        <Textarea
          rows={Math.min(10, Math.max(2, Math.ceil(str.length / 80) + str.split("\n").length - 1))}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }

  return (
    <Field label={label} hint={field.help}>
      <Input
        type={field.kind === "email" ? "email" : "text"}
        dir={field.kind === "email" || field.kind === "url" ? "ltr" : undefined}
        value={str}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
