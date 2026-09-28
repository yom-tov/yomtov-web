import { NextRequest, NextResponse } from "next/server";

// Public proxy for private Vercel Blob images. The Blob token is attached to
// the upstream request, so the target host MUST be validated strictly —
// otherwise any caller could make us send the token to a host they control.
function parseBlobUrl(raw: string | null): URL | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  if (!u.hostname.endsWith(".blob.vercel-storage.com")) return null;
  return u;
}

export async function GET(req: NextRequest) {
  const url = parseBlobUrl(req.nextUrl.searchParams.get("url"));
  if (!url) {
    return new NextResponse("Not found", { status: 404 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new NextResponse("Server error", { status: 500 });
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: "error",
  });

  if (!response.ok) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
