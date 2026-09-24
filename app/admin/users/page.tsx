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
          ${users.createdAt},
          COALESCE((SELECT MAX(ua."created_at") FROM "user_activity" ua WHERE ua."user_id" = ${users.id}), ${users.createdAt}),
          COALESCE((SELECT MAX(vp."updated_at") FROM "video_progress" vp WHERE vp."user_id" = ${users.id}), ${users.createdAt})
        )
      )`,
      videosWatched: sql<number>`(
        SELECT COUNT(*)::int FROM ${videoProgress}
        WHERE ${videoProgress.userId} = ${users.id}
      )`,
      loginCount: sql<number>`(
        SELECT COUNT(*)::int FROM "user_activity" ua
        WHERE ua."user_id" = ${users.id}
        AND ua."event_type" = 'login'
      )`,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`);

  return <UsersListClient items={allUsers} />;
}
