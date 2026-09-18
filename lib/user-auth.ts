import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const USER_SESSION_COOKIE = "yomtov_user_session";
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short (expected 32+ chars).");
  }
  return new TextEncoder().encode(secret);
}

export interface UserSession extends JWTPayload {
  sub: string;
  role: "user";
}

export async function signUserSession(userId: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: userId, role: "user" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + USER_SESSION_MAX_AGE)
    .sign(getSecretKey());
}

export async function verifyUserSession(
  token: string | undefined | null,
): Promise<UserSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.role !== "user" || !payload.sub) return null;
    return payload as UserSession;
  } catch {
    return null;
  }
}

export async function requireUserSession(): Promise<UserSession> {
  const jar = await cookies();
  const token = jar.get(USER_SESSION_COOKIE)?.value;
  const session = await verifyUserSession(token);
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function hashPassword(plain: string): Promise<string> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(plain, 12);
}

export async function verifyUserPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.compare(plain, hash);
}

// Per-IP rate limiter (same pattern as admin auth)
type Bucket = { hits: number[]; lockedUntil: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_HITS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function userRateCheck(
  ip: string,
): { allowed: true } | { allowed: false; retryInSec: number } {
  const now = Date.now();
  const b = buckets.get(ip) ?? { hits: [], lockedUntil: 0 };
  if (b.lockedUntil > now) {
    return {
      allowed: false,
      retryInSec: Math.ceil((b.lockedUntil - now) / 1000),
    };
  }
  b.hits = b.hits.filter((t) => now - t < WINDOW_MS);
  if (b.hits.length >= MAX_HITS) {
    b.lockedUntil = now + LOCKOUT_MS;
    buckets.set(ip, b);
    return { allowed: false, retryInSec: Math.ceil(LOCKOUT_MS / 1000) };
  }
  buckets.set(ip, b);
  return { allowed: true };
}

export function userRateRecord(ip: string): void {
  const b = buckets.get(ip) ?? { hits: [], lockedUntil: 0 };
  b.hits.push(Date.now());
  buckets.set(ip, b);
}

export function userRateReset(ip: string): void {
  buckets.delete(ip);
}
