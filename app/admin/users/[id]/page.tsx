import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  users,
  userPurchases,
  contentPackages,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { UserDetailClient } from "./UserDetailClient";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) notFound();

  const purchases = await db
    .select({
      purchaseId: userPurchases.id,
      packageId: contentPackages.id,
      packageTitle: contentPackages.title,
      packageSlug: contentPackages.slug,
      grantedAt: userPurchases.grantedAt,
      expiresAt: userPurchases.expiresAt,
      revokedAt: userPurchases.revokedAt,
      status: userPurchases.status,
      paymentMethod: userPurchases.paymentMethod,
      paymentNote: userPurchases.paymentNote,
      adminNotes: userPurchases.adminNotes,
    })
    .from(userPurchases)
    .innerJoin(
      contentPackages,
      eq(userPurchases.packageId, contentPackages.id),
    )
    .where(eq(userPurchases.userId, id))
    .orderBy(sql`${userPurchases.grantedAt} DESC`);

  const allPackages = await db
    .select({
      id: contentPackages.id,
      title: contentPackages.title,
    })
    .from(contentPackages)
    .orderBy(contentPackages.displayOrder);

  return (
    <UserDetailClient
      user={{
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        institution: user.institution,
        emailVerified: user.emailVerified,
        active: user.active,
        createdAt: user.createdAt,
      }}
      purchases={purchases}
      allPackages={allPackages}
    />
  );
}
