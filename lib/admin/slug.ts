// Slug + title helpers shared by:
//   - the admin panel (server actions, form previews)
//   - the offline content build (`scripts/build-content.mjs`)
// Keep this file the single source of truth for the naming logic.

import crypto from "node:crypto";
import type {
  Season,
  ExamVersion,
  SubjectId,
  ExamSource,
} from "@/types/content";

const SEASON_MAP: Record<string, Season> = {
  קיץ: "summer",
  אביב: "spring",
  חורף: "winter",
  סתיו: "fall",
};

const VERSION_MAP: Record<string, ExamVersion> = {
  א: "a",
  ב: "b",
  "א/ב": "combined",
  "ב/א": "combined",
};

const SUBJECT_MAP: Record<string, SubjectId> = {
  תקבילית: "analog",
  ספרתית: "digital",
  חשמל: "electricity",
};

export function parseExamTitle(title: string): {
  year: number | null;
  season: Season;
  version: ExamVersion;
  subject: SubjectId | null;
} {
  const t = title.replace(/[״"]/g, "").trim();
  const year = (t.match(/\b(19|20)\d{2}\b/) || [])[0];
  let season: Season = null;
  for (const [heb, en] of Object.entries(SEASON_MAP)) {
    if (t.includes(heb)) {
      season = en;
      break;
    }
  }
  let version: ExamVersion = null;
  const vmatch = t.match(/[אב]\/?[אב]?/g);
  if (vmatch) {
    const vs = vmatch.join("");
    if (VERSION_MAP[vs]) version = VERSION_MAP[vs];
    else if (vs.includes("א") && vs.includes("ב")) version = "combined";
    else if (vs === "א") version = "a";
    else if (vs === "ב") version = "b";
  }
  let subject: SubjectId | null = null;
  for (const [heb, en] of Object.entries(SUBJECT_MAP)) {
    if (t.includes(heb)) {
      subject = en;
      break;
    }
  }
  return { year: year ? Number(year) : null, season, version, subject };
}

export function toEnglishSlug(parts: (string | number | null | undefined)[]): string {
  const s = parts.filter(Boolean).join("-");
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function hashSlug(seed: string): string {
  return crypto.createHash("sha1").update(seed).digest("hex").slice(0, 8);
}

// Compose an exam slug from year/season/version. Falls back to a hash of
// the title if none of those are present.
export function examSlug(input: {
  year: number | null;
  season: Season;
  version: ExamVersion;
  title?: string;
}): string {
  const slug = toEnglishSlug([input.season, input.year, input.version]);
  if (slug) return slug;
  return `item-${hashSlug(input.title || `${Date.now()}`)}`;
}

// Compose an assignment slug from an optional english hint (like "dc-1")
// or from the Hebrew title (hashed).
export function assignmentSlug(input: {
  englishHint?: string | null;
  title: string;
}): string {
  const hint = (input.englishHint || "").trim();
  if (/^[a-zA-Z0-9\-]{2,}$/.test(hint)) return hint.toLowerCase();
  return `item-${hashSlug(input.title)}`;
}

export const SEASON_LABEL_HE: Record<NonNullable<Season>, string> = {
  summer: "קיץ",
  spring: "אביב",
  winter: "חורף",
  fall: "סתיו",
};
export const VERSION_LABEL_HE: Record<NonNullable<ExamVersion>, string> = {
  a: "מועד א",
  b: "מועד ב",
  combined: "מועד א/ב",
};
export const SUBJECT_LABEL_HE: Record<SubjectId, string> = {
  electricity: "חשמל",
  analog: "אלקטרוניקה תקבילית",
  digital: "אלקטרוניקה ספרתית",
};
export const SOURCE_LABEL_HE: Record<ExamSource, string> = {
  mahat: 'מבחני מה"ט',
  education: "מבחני משרד החינוך",
};

// Build the display title an exam should carry when the admin creates one
// (used when the admin doesn't type a title explicitly).
export function defaultExamTitle(input: {
  year: number | null;
  season: Season;
  version: ExamVersion;
}): string {
  const parts: string[] = [];
  if (input.season) parts.push(SEASON_LABEL_HE[input.season]);
  if (input.year) parts.push(String(input.year));
  if (input.version && input.version !== "combined") {
    parts.push(input.version === "a" ? "א" : "ב");
  } else if (input.version === "combined") {
    parts.push("א/ב");
  }
  return parts.join(" ");
}
