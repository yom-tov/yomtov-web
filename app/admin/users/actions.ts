"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPurchases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  PurchaseGrantSchema,
  UserUpdateSchema,
} from "@/lib/admin/user-validators";
import { getEmailProvider } from "@/lib/email";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function grantAccessAction(input: {
  userId: string;
  packageId: string;
  expiresAt?: string | null;
  paymentMethod?: string | null;
  paymentNote?: string | null;
  adminNotes?: string | null;
}): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = PurchaseGrantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    await db
      .insert(userPurchases)
      .values({
        userId: parsed.data.userId,
        packageId: parsed.data.packageId,
        grantedBy: "admin",
        expiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : null,
        status: "active",
        paymentMethod: parsed.data.paymentMethod ?? null,
        paymentNote: parsed.data.paymentNote ?? null,
        adminNotes: parsed.data.adminNotes ?? null,
      })
      .onConflictDoUpdate({
        target: [userPurchases.userId, userPurchases.packageId],
        set: {
          status: "active",
          grantedAt: new Date(),
          expiresAt: parsed.data.expiresAt
            ? new Date(parsed.data.expiresAt)
            : null,
          revokedAt: null,
          paymentMethod: parsed.data.paymentMethod ?? null,
          paymentNote: parsed.data.paymentNote ?? null,
          adminNotes: parsed.data.adminNotes ?? null,
        },
      });
    revalidatePath(`/admin/users/${parsed.data.userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function revokeAccessAction(
  purchaseId: string,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    await db
      .update(userPurchases)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(eq(userPurchases.id, purchaseId));
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function toggleUserActiveAction(
  userId: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    await db.update(users).set({ active }).where(eq(users.id, userId));
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateUserAction(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    institution?: string | null;
  },
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = UserUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    await db
      .update(users)
      .set({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone ?? null,
        institution: parsed.data.institution ?? null,
      })
      .where(eq(users.id, userId));
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function resendVerificationAction(
  userId: string,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return { ok: false, error: "משתמש לא נמצא" };
    if (user.emailVerified) return { ok: false, error: "המייל כבר אומת" };

    const token = nanoid(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      })
      .where(eq(users.id, userId));

    await getEmailProvider().sendVerificationEmail(
      user.email,
      token,
      user.firstName,
    );

    revalidatePath(`/admin/users/${userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function extendAccessAction(
  purchaseId: string,
  newExpiry: string,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    await db
      .update(userPurchases)
      .set({ expiresAt: new Date(newExpiry) })
      .where(eq(userPurchases.id, purchaseId));
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
