import type { MetadataRoute } from "next";
import { exams, assignments, subjects, SOURCE_SLUG } from "@/lib/content";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yomtov-web.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [];

  const statics = ["", "/search", "/exams", "/labs", "/calculator", "/about"];
  for (const p of statics) {
    out.push({
      url: `${BASE_URL}${p || "/"}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: p === "" ? 1 : 0.6,
    });
  }

  for (const s of subjects) {
    out.push({
      url: `${BASE_URL}/${s.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const t of ["mahat-exams", "ministry-exams", "assignments"]) {
      out.push({
        url: `${BASE_URL}/${s.id}/${t}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  for (const e of exams) {
    out.push({
      url: `${BASE_URL}/${e.subject}/${SOURCE_SLUG[e.source]}/${e.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }
  for (const a of assignments) {
    out.push({
      url: `${BASE_URL}/${a.subject}/assignments/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return out;
}
