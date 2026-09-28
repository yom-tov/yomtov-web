import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = "yomtov-assets";

function getClient(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function uploadToR2(key: string, body: Uint8Array, contentType = "application/pdf"): Promise<void> {
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  const s3 = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Server-side copy inside the bucket (used when an item is renamed/moved). */
export async function copyInR2(fromKey: string, toKey: string): Promise<void> {
  if (fromKey === toKey) return;
  const s3 = getClient();
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${fromKey.split("/").map(encodeURIComponent).join("/")}`,
      Key: toKey,
      ContentType: "application/pdf",
      CacheControl: "public, max-age=31536000, immutable",
      MetadataDirective: "REPLACE",
    }),
  );
}

export function gitPathToR2Key(gitPath: string): string {
  return gitPath.replace(/^public\//, "");
}

/** A path stored in the content JSON ("/pdfs/x.pdf?v=123") → its R2 key ("pdfs/x.pdf"). */
export function storedPathToR2Key(path: string): string {
  return path.replace(/^\//, "").replace(/\?.*$/, "");
}
