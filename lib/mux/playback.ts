import { SignJWT, importPKCS8 } from "jose";
import { createPrivateKey } from "node:crypto";

function getSigningKey() {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_KEY_PRIVATE;
  if (!keyId || !keySecret) {
    throw new Error("MUX_SIGNING_KEY_ID and MUX_SIGNING_KEY_PRIVATE must be set");
  }
  return { keyId, keySecret };
}

async function getPrivateKey() {
  const { keySecret } = getSigningKey();

  // Log format hints for debugging (no sensitive data)
  console.log("MUX key debug:", {
    len: keySecret.length,
    startsWith: keySecret.substring(0, 10),
    includesBegin: keySecret.includes("-----BEGIN"),
    includesNewline: keySecret.includes("\n"),
  });

  // Case 1: env var is the PEM string directly (not base64 encoded)
  if (keySecret.includes("-----BEGIN")) {
    return importPKCS8(keySecret, "RS256");
  }

  // Case 2: env var is base64 of PEM
  const decoded = Buffer.from(keySecret, "base64").toString("utf-8");
  if (decoded.includes("-----BEGIN")) {
    return importPKCS8(decoded, "RS256");
  }

  // Case 3: env var is base64 of DER — try both PKCS#8 and PKCS#1
  const derBuf = Buffer.from(keySecret, "base64");
  try {
    return createPrivateKey({ key: derBuf, format: "der", type: "pkcs8" });
  } catch {
    return createPrivateKey({ key: derBuf, format: "der", type: "pkcs1" });
  }
}

export async function signPlaybackToken(playbackId: string): Promise<string> {
  const { keyId } = getSigningKey();
  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: playbackId,
    aud: "v",
    kid: keyId,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: keyId })
    .setIssuedAt(now)
    .setExpirationTime(now + 7200) // 2 hours
    .sign(privateKey);
}

export async function signThumbnailToken(
  playbackId: string,
): Promise<string> {
  const { keyId } = getSigningKey();
  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: playbackId,
    aud: "t",
    kid: keyId,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: keyId })
    .setIssuedAt(now)
    .setExpirationTime(now + 86400) // 24 hours
    .sign(privateKey);
}

export async function signStoryboardToken(
  playbackId: string,
): Promise<string> {
  const { keyId } = getSigningKey();
  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: playbackId,
    aud: "s",
    kid: keyId,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: keyId })
    .setIssuedAt(now)
    .setExpirationTime(now + 86400)
    .sign(privateKey);
}
