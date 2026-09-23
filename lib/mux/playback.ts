import { SignJWT, importPKCS8 } from "jose";

const MUX_PLAYBACK_RESTRICTION_ID = "jzFra8s4AW7ut00fHvK2DZHTdg1DyyAI68WR3fnKqVLo";

function getSigningKey() {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_KEY_PRIVATE;
  if (!keyId || !keySecret) {
    throw new Error("MUX_SIGNING_KEY_ID and MUX_SIGNING_KEY_PRIVATE must be set");
  }
  return { keyId, keySecret };
}

function derLength(len: number): Uint8Array {
  if (len < 128) return new Uint8Array([len]);
  if (len < 256) return new Uint8Array([0x81, len]);
  return new Uint8Array([0x82, (len >> 8) & 0xff, len & 0xff]);
}

function wrapDer(tag: number, content: Uint8Array): Uint8Array {
  const lenBytes = derLength(content.length);
  const result = new Uint8Array(1 + lenBytes.length + content.length);
  result[0] = tag;
  result.set(lenBytes, 1);
  result.set(content, 1 + lenBytes.length);
  return result;
}

function pkcs1DerToPkcs8Der(pkcs1: Uint8Array): Uint8Array {
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const rsaOid = new Uint8Array([
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00,
  ]);
  const keyOctet = wrapDer(0x04, pkcs1);
  const inner = new Uint8Array(version.length + rsaOid.length + keyOctet.length);
  inner.set(version, 0);
  inner.set(rsaOid, version.length);
  inner.set(keyOctet, version.length + rsaOid.length);
  return wrapDer(0x30, inner);
}

function pemToPkcs8Pem(pem: string): string {
  if (pem.includes("-----BEGIN PRIVATE KEY-----")) {
    return pem;
  }
  const body = pem
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, "")
    .replace(/-----END RSA PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const pkcs1Der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  const pkcs8Der = pkcs1DerToPkcs8Der(pkcs1Der);
  const b64 = btoa(String.fromCharCode(...pkcs8Der));
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----`;
}

async function getPrivateKey() {
  const { keySecret } = getSigningKey();

  let pem = keySecret;

  if (!pem.includes("-----BEGIN")) {
    const decoded = Buffer.from(pem, "base64").toString("utf-8");
    if (decoded.includes("-----BEGIN")) {
      pem = decoded;
    } else {
      const doubleDecoded = Buffer.from(decoded, "base64").toString("utf-8");
      if (doubleDecoded.includes("-----BEGIN")) {
        pem = doubleDecoded;
      } else {
        throw new Error("Could not decode MUX_SIGNING_KEY_PRIVATE to PEM format");
      }
    }
  }

  const pkcs8Pem = pemToPkcs8Pem(pem);
  return importPKCS8(pkcs8Pem, "RS256");
}

export async function signPlaybackToken(
  playbackId: string,
  options?: { assetEndTime?: number },
): Promise<string> {
  const { keyId } = getSigningKey();
  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  const claims: Record<string, unknown> = {
    sub: playbackId,
    aud: "v",
    kid: keyId,
    playback_restriction_id: MUX_PLAYBACK_RESTRICTION_ID,
  };
  if (options?.assetEndTime !== undefined) {
    claims.asset_end_time = options.assetEndTime;
  }

  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: keyId })
    .setIssuedAt(now)
    .setExpirationTime(now + 1800)
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
    playback_restriction_id: MUX_PLAYBACK_RESTRICTION_ID,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: keyId })
    .setIssuedAt(now)
    .setExpirationTime(now + 86400)
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
    playback_restriction_id: MUX_PLAYBACK_RESTRICTION_ID,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: keyId })
    .setIssuedAt(now)
    .setExpirationTime(now + 86400)
    .sign(privateKey);
}
