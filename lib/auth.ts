// Admin auth primitives.
//
// - Password: bcrypt hash stored in ADMIN_PASSWORD_HASH env.
// - Session: JWT signed with SESSION_SECRET, HS256, 7-day expiry, delivered
//   as an httpOnly SameSite=Strict cookie named `yomtov_admin_session`.
// - Uses `jose` for JWT so middleware (edge runtime) can verify without
//   pulling in bcrypt. bcryptjs runs in node-only paths (login route).

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "yomtov_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short (expected 32+ chars)."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSession extends JWTPayload {
  sub: "admin";
}

export async function signSession(): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_MAX_AGE_SECONDS)
    .sign(getSecretKey());
}

export async function verifySession(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (payload.sub !== "admin") return null;
    return payload as AdminSession;
  } catch {
    return null;
  }
}

// Server-side helper — throws if the current request isn't authed.
// Use inside server actions and node-runtime route handlers.
export async function requireSession(): Promise<AdminSession> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

// Password verification — node runtime only (uses bcryptjs).
// Import lazily to keep this module edge-safe when only signing/verifying JWT.
export async function verifyPassword(plain: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) throw new Error("ADMIN_PASSWORD_HASH is not set");
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.compare(plain, hash);
}

// ----------------------------------------------------------------------------
// In-memory per-IP rate limiter for the login endpoint.
// Not a security guarantee — a determined attacker can wait it out — but it
// slows down credential-stuffing to a manageable pace. For a single-admin
// site with a strong 12+ char password this is sufficient.
// ----------------------------------------------------------------------------
type Bucket = { hits: number[]; lockedUntil: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_HITS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function loginRateCheck(ip: string): { allowed: true } | { allowed: false; retryInSec: number } {
  const now = Date.now();
  const b = buckets.get(ip) ?? { hits: [], lockedUntil: 0 };
  if (b.lockedUntil > now) {
    return { allowed: false, retryInSec: Math.ceil((b.lockedUntil - now) / 1000) };
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

export function loginRateRecord(ip: string): void {
  const b = buckets.get(ip) ?? { hits: [], lockedUntil: 0 };
  b.hits.push(Date.now());
  buckets.set(ip, b);
}

export function loginRateReset(ip: string): void {
  buckets.delete(ip);
}
