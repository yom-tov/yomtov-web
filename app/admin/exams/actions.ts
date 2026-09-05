"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  createExam,
  updateExam,
  deleteExam,
} from "@/lib/admin/mutations";
import {
  ExamCreateSchema,
  ExamUpdateSchema,
  type ExamCreateInput,
  type ExamUpdateInput,
} from "@/lib/admin/validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
  commitUrl?: string;
}

export async function createExamAction(input: ExamCreateInput): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = ExamCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  try {
    const commit = await createExam(parsed.data);
    revalidatePath("/admin/exams");
    return { ok: true, commitUrl: commit.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateExamAction(id: string, input: ExamUpdateInput): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = ExamUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  try {
    const commit = await updateExam(id, parsed.data);
    revalidatePath("/admin/exams");
    revalidatePath(`/admin/exams/${encodeURIComponent(id)}/edit`);
    return { ok: true, commitUrl: commit.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteExamAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    const commit = await deleteExam(id);
    revalidatePath("/admin/exams");
    return { ok: true, commitUrl: commit.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
