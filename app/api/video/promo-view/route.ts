import { NextResponse } from "next/server";
import { getOptionalUserSession } from "@/lib/user-auth";
import { db } from "@/lib/db";
import { userActivity } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const videoId = body?.videoId;
  if (!videoId || typeof videoId !== "string") {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const session = await getOptionalUserSession();
  if (!session) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  await db.insert(userActivity).values({
    userId: session.sub,
    eventType: "promo_view",
    videoId,
  });

  return NextResponse.json({ ok: true, tracked: true });
}
