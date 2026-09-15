const CDN_BASE = process.env.NEXT_PUBLIC_PDF_BASE_URL ?? "";

export function getAssetUrl(path: string): string {
  if (!CDN_BASE || !path.startsWith("/pdfs/")) return path;
  return `${CDN_BASE}${path}`;
}
