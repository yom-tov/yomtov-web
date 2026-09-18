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
  const decoded = Buffer.from(keySecret, "base64").toString("utf-8");
  if (decoded.includes("-----BEGIN")) {
    return importPKCS8(decoded, "RS256");
  }
  // Mux provides the key as base64-encoded DER in PKCS#1 format
  return createPrivateKey({
    key: Buffer.from(keySecret, "base64"),
    format: "der",
    type: "pkcs1",
  });
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
