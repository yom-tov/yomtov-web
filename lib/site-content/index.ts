// Reading admin-editable site content on the public site.
//
//   const hero = await getSection("home.hero");   // typed, defaults merged
//
// All rows are loaded with one query per request (React cache). If the
// database is unreachable the defaults from the registry are used, so the
// public site keeps rendering no matter what.

import { cache } from "react";
import { db } from "@/lib/db";
import { siteContent } from "@/lib/db/schema";
import { mergeValues, type SectionValues } from "./fields";
import { SECTIONS, type SectionId } from "./registry";

export { visible, fill, parseLinks, lines } from "./fields";

const loadAll = cache(async (): Promise<Map<string, Record<string, unknown>>> => {
  try {
    const rows = await db.select().from(siteContent);
    return new Map(rows.map((r) => [r.key, (r.value ?? {}) as Record<string, unknown>]));
  } catch (e) {
    console.error("[site-content] falling back to defaults:", (e as Error).message);
    return new Map();
  }
});

export async function getSection<K extends SectionId>(id: K): Promise<SectionValues<(typeof SECTIONS)[K]>> {
  const all = await loadAll();
  return mergeValues(SECTIONS[id], all.get(id));
}

/** Stored overrides only (admin editor). */
export async function getStoredOverrides(id: SectionId): Promise<Record<string, unknown>> {
  const all = await loadAll();
  return all.get(id) ?? {};
}

/** Placeholder values shared by several pages ({contactEmail}, {promoMinutes}…). */
export async function getGlobalVars(): Promise<Record<string, string | number>> {
  const [contact, promo] = await Promise.all([getSection("global.contact"), getSection("global.promo")]);
  return {
    contactEmail: contact.contactEmail,
    lessonsEmail: contact.lessonsEmail,
    coursesEmail: contact.coursesEmail,
    promoMinutes: promo.promoMinutes,
  };
}
