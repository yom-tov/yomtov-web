"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { setHidden } from "@/lib/admin/mutations";
import { HiddenKindSchema } from "@/lib/admin/validators";

const LIST_PATH = {
  exam: "/admin/exams",
  assignment: "/admin/assignments",
  formula: "/admin/formulas",
  lab: "/admin/labs",
  subject: "/admin/subjects",
} as const;

/** Hide / show an exam, assignment, formula, lab or subject on the public site. */
export async function setHiddenAction(
  kind: string,
  id: string,
  hidden: boolean,
): Promise<{ ok: boolean; error?: string; commitUrl?: string }> {
  try {
    await requireSession();
    const k = HiddenKindSchema.parse(kind);
    const commit = await setHidden(k, id, hidden);
    revalidatePath(LIST_PATH[k]);
    return { ok: true, commitUrl: commit.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
