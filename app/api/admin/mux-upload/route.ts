import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { getMuxClient } from "@/lib/mux/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Direct upload of course videos from the admin panel to Mux.
//   POST  → creates an upload URL (the browser PUTs the file straight to Mux)
//   GET   → ?id=<uploadId> — upload/asset status; once the asset is ready it
//           returns the asset id, the signed playback id and the duration.

async function guard() {
  try {
    await requireSession();
    return null;
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const origin = req.headers.get("origin") ?? req.nextUrl.origin;
    const upload = await getMuxClient().video.uploads.create({
      cors_origin: origin,
      // Course videos are paid content: playback needs a signed token.
      new_asset_settings: { playback_policies: ["signed"] },
    });
    return NextResponse.json({ id: upload.id, url: upload.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const mux = getMuxClient();
    const upload = await mux.video.uploads.retrieve(id);
    if (!upload.asset_id) {
      return NextResponse.json({ stage: upload.status === "waiting" ? "uploading" : upload.status });
    }
    const asset = await mux.video.assets.retrieve(upload.asset_id);
    const playback = asset.playback_ids?.find((p) => p.policy === "signed") ?? asset.playback_ids?.[0];
    return NextResponse.json({
      stage: asset.status === "ready" ? "ready" : asset.status === "errored" ? "errored" : "processing",
      assetId: asset.id,
      playbackId: playback?.id ?? null,
      durationSeconds: asset.duration ? Math.round(asset.duration) : null,
      error: asset.errors?.messages?.join(" ") ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
