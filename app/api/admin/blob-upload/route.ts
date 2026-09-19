import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_BYTES = 30 * 1024 * 1024; // 30 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const PDF_TYPES = ["application/pdf"];

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
      onBeforeGenerateToken: async (pathname) => {
        const isImage = /\.(jpe?g|png|webp|gif)$/i.test(pathname);
        return {
          allowedContentTypes: isImage
            ? [...IMAGE_TYPES, ...PDF_TYPES]
            : [...PDF_TYPES, ...IMAGE_TYPES],
          maximumSizeInBytes: isImage ? MAX_IMAGE_BYTES : MAX_PDF_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: isImage ? 31536000 : 60,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
