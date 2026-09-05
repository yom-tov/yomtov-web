"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "@/lib/admin/mutations";
import {
  AssignmentCreateSchema,
  AssignmentUpdateSchema,
  type AssignmentCreateInput,
  type AssignmentUpdateInput,
} from "@/lib/admin/validators";

export interface ActionResult { ok: boolean; error?: string; commitUrl?: string; }

async function guard(): Promise<ActionResult | null> {
  try { await requireSession(); return null; }
  catch { return { ok: false, error: "לא מאומת" }; }
}

export async function createAssignmentAction(input: AssignmentCreateInput): Promise<ActionResult> {
  const g = await guard(); if (g) return g;
  const parsed = AssignmentCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join("; ") };
  try {
    const c = await createAssignment(parsed.data);
    revalidatePath("/admin/assignments");
    return { ok: true, commitUrl: c.url };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function updateAssignmentAction(id: string, input: AssignmentUpdateInput): Promise<ActionResult> {
  const g = await guard(); if (g) return g;
  const parsed = AssignmentUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join("; ") };
  try {
    const c = await updateAssignment(id, parsed.data);
    revalidatePath("/admin/assignments");
    revalidatePath(`/admin/assignments/${encodeURIComponent(id)}/edit`);
    return { ok: true, commitUrl: c.url };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function deleteAssignmentAction(id: string): Promise<ActionResult> {
  const g = await guard(); if (g) return g;
  try {
    const c = await deleteAssignment(id);
    revalidatePath("/admin/assignments");
    return { ok: true, commitUrl: c.url };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}
