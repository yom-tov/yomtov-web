// Field definitions for admin-editable site content. A section is a set of
// named fields; each field knows its admin label, its input kind and its
// default value (the text that used to be hardcoded in the page).

export type TextKind = "text" | "textarea" | "email" | "url";

export interface TextField {
  kind: TextKind;
  label: string;
  default: string;
  help?: string;
}

export interface NumberField {
  kind: "number";
  label: string;
  default: number;
  min?: number;
  max?: number;
  help?: string;
}

export interface ItemField {
  kind: TextKind;
  label: string;
  help?: string;
}

export type ItemShape = Record<string, ItemField>;
export type ItemValue<I extends ItemShape> = { [K in keyof I]: string } & { hidden?: boolean };
/** Shape-agnostic list item, for code that handles any list (editor, merging). */
export type LooseItem = { [key: string]: string | boolean | undefined; hidden?: boolean };

export interface ListField<I extends ItemShape = ItemShape> {
  kind: "list";
  label: string;
  item: I;
  /** Which item field names the item in the collapsed editor row. */
  titleKey: keyof I & string;
  default: ItemValue<I>[];
  max?: number;
  help?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any list shape
export type Field = TextField | NumberField | ListField<any>;

export type FieldValue<F> = F extends NumberField
  ? number
  : F extends ListField<infer I>
    ? ItemValue<I>[]
    : string;

export interface SectionDef<F extends Record<string, Field> = Record<string, Field>> {
  title: string;
  description?: string;
  fields: F;
}

export type SectionValues<S extends SectionDef> = { [K in keyof S["fields"]]: FieldValue<S["fields"][K]> };

// ---------------------------------------------------------------------------
// Builders (keep the registry terse)
// ---------------------------------------------------------------------------
export const text = (label: string, def: string, help?: string): TextField => ({ kind: "text", label, default: def, help });
export const area = (label: string, def: string, help?: string): TextField => ({ kind: "textarea", label, default: def, help });
export const email = (label: string, def: string, help?: string): TextField => ({ kind: "email", label, default: def, help });
export const url = (label: string, def: string, help?: string): TextField => ({ kind: "url", label, default: def, help });
export const num = (label: string, def: number, opts: { min?: number; max?: number; help?: string } = {}): NumberField => ({
  kind: "number",
  label,
  default: def,
  ...opts,
});
export function list<I extends ItemShape>(
  label: string,
  item: I,
  titleKey: keyof I & string,
  def: ItemValue<I>[],
  opts: { max?: number; help?: string } = {},
): ListField<I> {
  return { kind: "list", label, item, titleKey, default: def, ...opts };
}
export const itemText = (label: string, help?: string): ItemField => ({ kind: "text", label, help });
export const itemArea = (label: string, help?: string): ItemField => ({ kind: "textarea", label, help });
export const itemUrl = (label: string, help?: string): ItemField => ({ kind: "url", label, help });

export function section<F extends Record<string, Field>>(def: SectionDef<F>): SectionDef<F> {
  return def;
}

// ---------------------------------------------------------------------------
// Merging stored overrides onto defaults
// ---------------------------------------------------------------------------
function coerceText(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function coerceList(field: ListField, v: unknown): LooseItem[] {
  if (!Array.isArray(v)) return field.default as LooseItem[];
  const keys = Object.keys(field.item);
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => {
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = typeof x[k] === "string" ? x[k] : "";
      if (x.hidden === true) out.hidden = true;
      return out as LooseItem;
    });
}

/** Stored overrides (possibly stale/partial) → full, type-safe values. */
export function mergeValues<S extends SectionDef>(def: S, stored: Record<string, unknown> | null | undefined): SectionValues<S> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(def.fields)) {
    const v = stored?.[key];
    if (field.kind === "number") {
      const n = typeof v === "number" && Number.isFinite(v) ? v : field.default;
      out[key] = n;
    } else if (field.kind === "list") {
      out[key] = v === undefined ? field.default : coerceList(field, v);
    } else {
      out[key] = coerceText(v, field.default);
    }
  }
  return out as SectionValues<S>;
}

/** Only the fields that differ from the defaults — what gets stored. */
export function diffFromDefaults(def: SectionDef, values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(def.fields)) {
    if (!(key in values)) continue;
    const v = values[key];
    if (JSON.stringify(v) !== JSON.stringify(field.default)) out[key] = v;
  }
  return out;
}

/** Drop items the admin hid. Use for every list rendered on the public site. */
export function visible<T extends { hidden?: boolean }>(items: T[]): T[] {
  return items.filter((i) => !i.hidden);
}

/** Replace {placeholders} with live values, e.g. "{exams} מבחנים". */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** "label | /href" lines → links. Used for simple link lists in textareas. */
export function parseLinks(textValue: string): { label: string; href: string }[] {
  return textValue
    .split("\n")
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter(([label, href]) => label && href)
    .map(([label, href]) => ({ label, href }));
}

/** One item per line (blank lines dropped). */
export function lines(textValue: string): string[] {
  return textValue
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
