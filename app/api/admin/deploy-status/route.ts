import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getLatestDeployment } from "@/lib/admin/deployments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  try {
    const d = await getLatestDeployment();
    return NextResponse.json({ deployment: d });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
