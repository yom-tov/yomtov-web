export const SITE_DOMAIN = "yomtovian.com";
export const SITE_WWW = `www.${SITE_DOMAIN}`;
export const SITE_URL = `https://${SITE_WWW}`;

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysUntil(date: Date, now = new Date()): number {
  return Math.floor((date.getTime() - now.getTime()) / DAY_MS);
}

export function minutesSince(ms: number, now = Date.now()): number {
  return Math.floor((now - ms) / 60_000);
}

export function fmtDateHe(d: Date | number | string): string {
  return new Date(d).toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" });
}

export function fmtDateTimeHe(d: Date | number | string): string {
  return new Date(d).toLocaleString("he-IL", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });
}

export function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message.slice(0, 300);
  return String(e).slice(0, 300);
}

/** Resolve a DNS record via Cloudflare's public DNS-over-HTTPS resolver. */
export async function dohQuery(
  name: string,
  type: "A" | "AAAA" | "CNAME" | "NS" | "MX" | "TXT",
  signal?: AbortSignal,
): Promise<string[]> {
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { accept: "application/dns-json" }, signal, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`DNS lookup failed (${res.status})`);
  const json = (await res.json()) as { Status: number; Answer?: { type: number; data: string }[] };
  const TYPE_CODE: Record<string, number> = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28 };
  return (json.Answer ?? [])
    .filter((a) => a.type === TYPE_CODE[type])
    .map((a) => a.data.replace(/\.$/, "").toLowerCase());
}
