"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteContent } from "@/lib/db/schema";
import { diffFromDefaults, type Field, type SectionDef } from "@/lib/site-content/fields";
import { getSectionDef, pageOfSection, type SectionId } from "@/lib/site-content/registry";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const MAX_TEXT = 5000;

function fieldSchema(f: Field): z.ZodTypeAny {
  if (f.kind === "number") {
    return z.number().int().min(f.min ?? Number.MIN_SAFE_INTEGER).max(f.max ?? Number.MAX_SAFE_INTEGER);
  }
  if (f.kind === "list") {
    const item = z
      .object(Object.fromEntries(Object.keys(f.item).map((k) => [k, z.string().max(MAX_TEXT)])))
      .extend({ hidden: z.boolean().optional() });
    return z.array(item).max(f.max ?? 100);
  }
  if (f.kind === "email") return z.string().trim().email("כתובת מייל לא תקינה").or(z.literal(""));
  return z.string().max(MAX_TEXT);
}

function sectionSchema(def: SectionDef) {
  return z.object(Object.fromEntries(Object.entries(def.fields).map(([k, f]) => [k, fieldSchema(f)]))).partial();
}

function revalidateFor(id: SectionId) {
  const page = pageOfSection(id);
  for (const r of page?.revalidate ?? [{ path: "/", type: "layout" as const }]) {
    if (r.type) revalidatePath(r.path, r.type);
    else revalidatePath(r.path);
  }
  revalidatePath("/admin/site", "layout");
}

export async function saveSectionAction(id: string, values: Record<string, unknown>): Promise<ActionResult> {
  try {
    await requireSession();
    const def = getSectionDef(id);
    if (!def) return { ok: false, error: "סקשן לא מוכר" };
    const parsed = sectionSchema(def).safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = def.fields[String(issue.path[0])];
      return { ok: false, error: `${field?.label ?? issue.path.join(".")}: ${issue.message}` };
    }
    const stored = diffFromDefaults(def, parsed.data);
    if (Object.keys(stored).length === 0) {
      await db.delete(siteContent).where(eq(siteContent.key, id));
    } else {
      await db
        .insert(siteContent)
        .values({ key: id, value: stored, updatedAt: new Date() })
        .onConflictDoUpdate({ target: siteContent.key, set: { value: stored, updatedAt: new Date() } });
    }
    revalidateFor(id as SectionId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function resetSectionAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    if (!getSectionDef(id)) return { ok: false, error: "סקשן לא מוכר" };
    await db.delete(siteContent).where(eq(siteContent.key, id));
    revalidateFor(id as SectionId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
