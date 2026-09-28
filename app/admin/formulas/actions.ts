"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createFormula, updateFormula, deleteFormula } from "@/lib/admin/mutations";
import {
  FormulaCreateSchema,
  FormulaUpdateSchema,
  type FormulaCreateInput,
  type FormulaUpdateInput,
} from "@/lib/admin/validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
  commitUrl?: string;
}

async function guard(): Promise<ActionResult | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
}

export async function createFormulaAction(input: FormulaCreateInput): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = FormulaCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  try {
    const c = await createFormula(parsed.data);
    revalidatePath("/admin/formulas");
    return { ok: true, commitUrl: c.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateFormulaAction(id: string, input: FormulaUpdateInput): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = FormulaUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  try {
    const c = await updateFormula(id, parsed.data);
    revalidatePath("/admin/formulas");
    return { ok: true, commitUrl: c.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteFormulaAction(id: string): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  try {
    const c = await deleteFormula(id);
    revalidatePath("/admin/formulas");
    return { ok: true, commitUrl: c.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
