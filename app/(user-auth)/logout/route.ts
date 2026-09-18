import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_SESSION_COOKIE } from "@/lib/user-auth";

export async function POST() {
  const jar = await cookies();
  jar.delete(USER_SESSION_COOKIE);
  redirect("/login");
}
