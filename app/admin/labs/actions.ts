"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createLab, updateLab, deleteLab } from "@/lib/admin/mutations";
import {
  LabCreateSchema,
  LabUpdateSchema,
  type LabCreateInput,
  type LabUpdateInput,
} from "@/lib/admin/validators";

export interface ActionResult { ok: boolean; error?: string; commitUrl?: string; }

async function guard(): Promise<ActionResult | null> {
  try { await requireSession(); return null; }
  catch { return { ok: false, error: "לא מאומת" }; }
}

export async function createLabAction(input: LabCreateInput): Promise<ActionResult> {
  const g = await guard(); if (g) return g;
  const parsed = LabCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join("; ") };
  try {
    const c = await createLab(parsed.data);
    revalidatePath("/admin/labs");
    return { ok: true, commitUrl: c.url };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function updateLabAction(id: string, input: LabUpdateInput): Promise<ActionResult> {
  const g = await guard(); if (g) return g;
  const parsed = LabUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join("; ") };
  try {
    const c = await updateLab(id, parsed.data);
    revalidatePath("/admin/labs");
    revalidatePath(`/admin/labs/${encodeURIComponent(id)}/edit`);
    return { ok: true, commitUrl: c.url };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function deleteLabAction(id: string): Promise<ActionResult> {
  const g = await guard(); if (g) return g;
  try {
    const c = await deleteLab(id);
    revalidatePath("/admin/labs");
    return { ok: true, commitUrl: c.url };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}
