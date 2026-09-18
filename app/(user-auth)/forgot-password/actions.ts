"use server";

import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getEmailProvider } from "@/lib/email";

export async function forgotPasswordAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();

  if (!email) {
    return { error: "יש להזין כתובת מייל" };
  }

  const [user] = await db
    .select({ id: users.id, firstName: users.firstName })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always show success to prevent email enumeration
  if (!user) {
    return {
      success: "אם הכתובת קיימת במערכת, נשלח אליה קישור לאיפוס סיסמה.",
    };
  }

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  const emailProvider = getEmailProvider();
  await emailProvider.sendPasswordResetEmail(email, token, user.firstName);

  return {
    success: "אם הכתובת קיימת במערכת, נשלח אליה קישור לאיפוס סיסמה.",
  };
}
