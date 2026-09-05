"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { updateSubject } from "@/lib/admin/mutations";
import { SubjectUpdateSchema, type SubjectUpdateInput } from "@/lib/admin/validators";
import type { SubjectId } from "@/types/content";

export interface ActionResult { ok: boolean; error?: string; commitUrl?: string; }

export async function updateSubjectAction(id: SubjectId, input: SubjectUpdateInput): Promise<ActionResult> {
  try { await requireSession(); } catch { return { ok: false, error: "לא מאומת" }; }
  const parsed = SubjectUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join("; ") };
  try {
    const c = await updateSubject(id, parsed.data);
    revalidatePath("/admin/subjects");
    revalidatePath(`/admin/subjects/${id}/edit`);
    return { ok: true, commitUrl: c.url };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}
