import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 30 * 1024 * 1024; // 30 MB

// Vercel Blob "client upload" flow. The browser sends a small JSON handshake
// here; we verify the session, restrict to PDFs under 30 MB, and hand back
// a signed URL the browser uses to PUT the file directly to Blob.
export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf"],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
        cacheControlMaxAge: 60, // ephemeral — we delete after committing to git
      }),
      onUploadCompleted: async () => {
        // No-op: the server action that submits the form is the one that
        // reads the blob and cleans it up.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
