import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { findAssignment } from "@/lib/content";
import { getAssetUrl } from "@/lib/pdf-url";
import type { SubjectId } from "@/types/content";

const COOKIE_NAME = "solution_access";
const MAX_AGE = 30 * 60; // 30 minutes

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short");
  }
  return new TextEncoder().encode(secret);
}

async function signSolutionToken(): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub: "solution" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + MAX_AGE)
    .sign(getSecret());
}

async function verifySolutionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload.sub === "solution";
  } catch {
    return false;
  }
}

function getSolutionFiles(
  subject: string,
  slug: string
): { label: string; path: string; sizeBytes: number | null }[] | null {
  const assignment = findAssignment(subject as SubjectId, slug);
  if (!assignment || assignment.files.length < 2) return null;
  return assignment.files.slice(1).map((f, idx) => ({
    label: idx === 0 ? `פתרון - ${assignment.title}` : `פתרון ${idx + 1}`,
    path: getAssetUrl(f.path),
    sizeBytes: f.sizeBytes,
  }));
}

// Rate limit: 5 attempts per IP per 5 minutes
type Bucket = { hits: number[]; lockedUntil: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_HITS = 5;
const LOCKOUT_MS = 10 * 60 * 1000;

function rateCheck(ip: string): { ok: true } | { ok: false; retryIn: number } {
  const now = Date.now();
  const b = buckets.get(ip) ?? { hits: [], lockedUntil: 0 };
  if (b.lockedUntil > now) {
    return { ok: false, retryIn: Math.ceil((b.lockedUntil - now) / 1000) };
  }
  b.hits = b.hits.filter((t) => now - t < WINDOW_MS);
  if (b.hits.length >= MAX_HITS) {
    b.lockedUntil = now + LOCKOUT_MS;
    buckets.set(ip, b);
    return { ok: false, retryIn: Math.ceil(LOCKOUT_MS / 1000) };
  }
  return { ok: true };
}

function rateRecord(ip: string) {
  const b = buckets.get(ip) ?? { hits: [], lockedUntil: 0 };
  b.hits.push(Date.now());
  buckets.set(ip, b);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const { password, subject, slug } = body as {
    password?: string;
    subject?: string;
    slug?: string;
  };

  if (!subject || !slug) {
    return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
  }

  // If already authenticated via cookie, return files directly
  const existingToken = req.cookies.get(COOKIE_NAME)?.value;
  if (await verifySolutionToken(existingToken)) {
    const files = getSolutionFiles(subject, slug);
    if (!files) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, files });
  }

  // Need password
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "PASSWORD_REQUIRED" }, { status: 401 });
  }

  // Rate limit
  const rate = rateCheck(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED", retryIn: rate.retryIn },
      { status: 429 }
    );
  }

  // Verify password
  const hash = process.env.SOLUTION_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json(
      { error: "SERVER_CONFIG_ERROR" },
      { status: 500 }
    );
  }

  const bcrypt = (await import("bcryptjs")).default;
  const valid = await bcrypt.compare(password, hash);

  if (!valid) {
    rateRecord(ip);
    return NextResponse.json({ error: "WRONG_PASSWORD" }, { status: 401 });
  }

  // Password correct — get solution files
  const files = getSolutionFiles(subject, slug);
  if (!files) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Sign token and set cookie
  const token = await signSolutionToken();
  const res = NextResponse.json({ ok: true, files });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });
  return res;
}
