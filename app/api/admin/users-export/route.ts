import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPurchases, videoProgress, userActivity, contentPackages } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

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
      videosWatched: sql<number>`(
        SELECT COUNT(*)::int FROM ${videoProgress}
        WHERE ${videoProgress.userId} = ${users.id}
      )`,
      totalWatchSeconds: sql<number>`(
        SELECT COALESCE(SUM(${videoProgress.positionSeconds}), 0)::int FROM ${videoProgress}
        WHERE ${videoProgress.userId} = ${users.id}
      )`,
      promoViews: sql<number>`(
        SELECT COUNT(*)::int FROM ${userActivity}
        WHERE ${userActivity.userId} = ${users.id}
        AND ${userActivity.eventType} = 'promo_view'
      )`,
      loginCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${userActivity}
        WHERE ${userActivity.userId} = ${users.id}
        AND ${userActivity.eventType} = 'login'
      )`,
      lastSeen: sql<string | null>`(
        SELECT GREATEST(
          ${users.createdAt},
          COALESCE((SELECT MAX(ua."created_at") FROM "user_activity" ua WHERE ua."user_id" = ${users.id}), ${users.createdAt}),
          COALESCE((SELECT MAX(vp."updated_at") FROM "video_progress" vp WHERE vp."user_id" = ${users.id}), ${users.createdAt})
        )::text
      )`,
      packages: sql<string>`(
        SELECT COALESCE(string_agg(${contentPackages.title}, ', '), '')
        FROM ${userPurchases}
        JOIN ${contentPackages} ON ${contentPackages.id} = ${userPurchases.packageId}
        WHERE ${userPurchases.userId} = ${users.id}
        AND ${userPurchases.status} = 'active'
      )`,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`);

  const BOM = "﻿";
  const headers = [
    "שם פרטי", "שם משפחה", "מייל", "טלפון", "מוסד",
    "אימות מייל", "סטטוס", "תאריך הרשמה",
    "רכישות פעילות", "חבילות", "סרטונים שנצפו",
    "זמן צפייה (דקות)", "צפיות פרומו", "כניסות", "נראה לאחרונה",
  ];

  const rows = allUsers.map((u) => [
    u.firstName,
    u.lastName,
    u.email,
    u.phone || "",
    u.institution || "",
    u.emailVerified ? "מאומת" : "לא מאומת",
    u.active ? "פעיל" : "חסום",
    new Date(u.createdAt).toLocaleDateString("he-IL"),
    String(u.purchaseCount),
    u.packages,
    String(u.videosWatched),
    String(Math.round(u.totalWatchSeconds / 60)),
    String(u.promoViews),
    String(u.loginCount),
    u.lastSeen ? new Date(u.lastSeen).toLocaleString("he-IL") : "",
  ]);

  const csvContent = BOM + [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
