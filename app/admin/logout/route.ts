import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  const url = new URL("/admin/login", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
