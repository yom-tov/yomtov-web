import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/user-auth";
import { db } from "@/lib/db";
import { videoProgress } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let session;
  try {
    session = await requireUserSession();
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const videoId = body?.videoId;
  const positionSeconds = body?.positionSeconds;
  const durationSeconds = body?.durationSeconds;

  if (
    !videoId ||
    typeof videoId !== "string" ||
    typeof positionSeconds !== "number"
  ) {
    return NextResponse.json(
      { error: "videoId and positionSeconds required" },
      { status: 400 },
    );
  }

  await db
    .insert(videoProgress)
    .values({
      userId: session.sub,
      videoId,
      positionSeconds,
      durationSeconds: durationSeconds ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [videoProgress.userId, videoProgress.videoId],
      set: {
        positionSeconds,
        durationSeconds: durationSeconds ?? undefined,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  let session;
  try {
    session = await requireUserSession();
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "videoId required" },
      { status: 400 },
    );
  }

  const [progress] = await db
    .select({
      positionSeconds: videoProgress.positionSeconds,
      durationSeconds: videoProgress.durationSeconds,
      updatedAt: videoProgress.updatedAt,
    })
    .from(videoProgress)
    .where(
      and(
        eq(videoProgress.userId, session.sub),
        eq(videoProgress.videoId, videoId),
      ),
    )
    .limit(1);

  return NextResponse.json({ progress: progress ?? null });
}
