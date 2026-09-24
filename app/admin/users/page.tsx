import { db } from "@/lib/db";
import { users, userPurchases, userActivity, videoProgress } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { UsersListClient } from "./UsersListClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      institution: users.institution,
      emailVerified: users.emailVerified,
      active: users.active,
      createdAt: users.createdAt,
      purchaseCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${userPurchases}
        WHERE ${userPurchases.userId} = ${users.id}
        AND ${userPurchases.status} = 'active'
      )`,
      lastSeen: sql<Date | null>`(
        SELECT GREATEST(
          (SELECT MAX(${userActivity.createdAt}) FROM ${userActivity} WHERE ${userActivity.userId} = ${users.id}),
          (SELECT MAX(${videoProgress.updatedAt}) FROM ${videoProgress} WHERE ${videoProgress.userId} = ${users.id})
        )
      )`,
      videosWatched: sql<number>`(
        SELECT COUNT(*)::int FROM ${videoProgress}
        WHERE ${videoProgress.userId} = ${users.id}
      )`,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`);

  return <UsersListClient items={allUsers} />;
}
