"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { ItemShape, LooseItem } from "@/lib/site-content/fields";
import { Btn, Field, Input, Textarea } from "@/components/admin/ui/primitives";
import { SortableList, VisibilityToggle } from "@/components/admin/ui/interactive";

type Item = LooseItem & { _k: string };

let keySeq = 0;
const withKeys = (items: LooseItem[]): Item[] => items.map((i) => ({ ...i, _k: `k${++keySeq}` }));
const stripKeys = (items: Item[]): LooseItem[] =>
  items.map(({ _k, ...rest }) => {
    void _k;
    return rest as LooseItem;
  });

export function ListEditor({
  shape,
  titleKey,
  value,
  onChange,
  max,
}: {
  shape: ItemShape;
  titleKey: string;
  value: LooseItem[];
  onChange: (next: LooseItem[]) => void;
  max?: number;
}) {
  // Stable keys for React while the admin reorders/edits.
  const [items, setItems] = useState<Item[]>(() => withKeys(value));
  const [openKey, setOpenKey] = useState<string | null>(null);

  const commit = (next: Item[]) => {
    setItems(next);
    onChange(stripKeys(next));
  };

  const update = (k: string, patch: Partial<Item>) => commit(items.map((i) => (i._k === k ? { ...i, ...patch } : i)));

  const add = () => {
    const blank: LooseItem = Object.fromEntries(Object.keys(shape).map((f) => [f, ""]));
    const [item] = withKeys([blank]);
    commit([...items, item]);
    setOpenKey(item._k);
  };

  const canAdd = !max || items.length < max;

  return (
    <div className="space-y-2">
      <SortableList
        items={items}
        getKey={(i) => i._k}
        onReorder={commit}
        renderItem={(item) => {
          const open = openKey === item._k;
          const title = String(item[titleKey] ?? "") || "(ללא כותרת)";
          return (
            <div className={clsx(item.hidden && "opacity-60")}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : item._k)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-right"
                >
                  <ChevronDown className={clsx("h-4 w-4 shrink-0 text-text-subtle transition-transform", open && "rotate-180")} />
                  <span className="truncate text-sm font-semibold text-text">{title}</span>
                </button>
                <VisibilityToggle compact hidden={!!item.hidden} onToggle={() => update(item._k, { hidden: !item.hidden })} />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`למחוק את "${title}"?`)) commit(items.filter((i) => i._k !== item._k));
                  }}
                  className="rounded-lg p-1.5 text-text-subtle hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  aria-label="מחק"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {open && (
                <div className="mt-3 grid gap-3 border-t border-border pt-3">
                  {Object.entries(shape).map(([key, f]) => (
                    <Field key={key} label={f.label} hint={f.help}>
                      {f.kind === "textarea" ? (
                        <Textarea
                          rows={Math.min(
                            8,
                            Math.max(2, Math.ceil(String(item[key] ?? "").length / 70) + String(item[key] ?? "").split("\n").length),
                          )}
                          value={String(item[key] ?? "")}
                          onChange={(e) => update(item._k, { [key]: e.target.value })}
                        />
                      ) : (
                        <Input
                          dir={f.kind === "url" || f.kind === "email" ? "ltr" : undefined}
                          value={String(item[key] ?? "")}
                          onChange={(e) => update(item._k, { [key]: e.target.value })}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />
      <Btn size="sm" onClick={add} disabled={!canAdd}>
        <Plus className="h-3.5 w-3.5" />
        הוסף פריט
        {max ? <span className="text-text-subtle">({items.length}/{max})</span> : null}
      </Btn>
    </div>
  );
}
