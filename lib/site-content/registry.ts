import type { SectionDef } from "./fields";
import { globalSections } from "./sections/global";
import { homeSections, HOME_PLACEHOLDERS } from "./sections/home";
import { pageSections } from "./sections/pages";

export const SECTIONS = { ...globalSections, ...homeSections, ...pageSections };

export type SectionId = keyof typeof SECTIONS;

type Reval = { path: string; type?: "page" | "layout" };

export interface ContentPage {
  id: string;
  title: string;
  description: string;
  /** Public page to open from the editor. */
  previewHref: string;
  sections: SectionId[];
  /** What to refresh on the public site after a save. */
  revalidate: Reval[];
  placeholders?: string;
}

// How the sections are grouped in the admin ("טקסטים ודפים").
export const CONTENT_PAGES: ContentPage[] = [
  {
    id: "global",
    title: "פרטי קשר, תפריט ופוטר",
    description: "מיילים, רשתות חברתיות, התפריט העליון, הפוטר ומשך הפרומו — מופיעים בכל האתר",
    previewHref: "/",
    sections: ["global.contact", "global.social", "global.brand", "global.nav", "global.footer", "global.promo"],
    revalidate: [{ path: "/", type: "layout" }],
  },
  {
    id: "home",
    title: "דף הבית",
    description: "כל הטקסטים בדף הבית, מהפתיחה ועד השאלות הנפוצות",
    previewHref: "/",
    sections: [
      "home.hero",
      "home.what",
      "home.stats",
      "home.audience",
      "home.subjects",
      "home.how",
      "home.tools",
      "home.courses",
      "home.start",
      "home.extras",
      "home.faq",
      "home.cta",
    ],
    revalidate: [{ path: "/" }],
    placeholders: HOME_PLACEHOLDERS,
  },
  {
    id: "courses",
    title: "קורסים",
    description: "דף הקורסים, השיעורים הפרטיים, חלון הרכישה ותיבת הפרומו",
    previewHref: "/courses",
    sections: ["courses.list", "courses.lessons", "courses.purchase", "courses.detail"],
    revalidate: [{ path: "/courses" }, { path: "/courses/[slug]", type: "page" }],
  },
  {
    id: "about",
    title: "אודות",
    description: "הטקסט והצוות בדף אודות",
    previewHref: "/about",
    sections: ["about.main"],
    revalidate: [{ path: "/about" }],
  },
  {
    id: "subjects",
    title: "דפי התחומים",
    description: "ספרתית, מתמטיקה, פיסיקה, פסיכומטרי, וחשמל / תקבילית",
    previewHref: "/digital",
    sections: ["digital.page", "math.page", "physics.page", "psychometric.page", "subject.tiles"],
    revalidate: [
      { path: "/digital" },
      { path: "/math" },
      { path: "/physics" },
      { path: "/psychometric" },
      { path: "/[subject]", type: "page" },
    ],
  },
  {
    id: "labs",
    title: "מעבדות וסימולטורים",
    description: "מדריכי המעבדה ודפי הסימולטורים",
    previewHref: "/labs",
    sections: ["labs.guides", "fourier.page", "simulator.page"],
    revalidate: [{ path: "/labs" }, { path: "/fourier" }, { path: "/simulator" }],
  },
];

export function pageOfSection(id: SectionId): ContentPage | undefined {
  return CONTENT_PAGES.find((p) => p.sections.includes(id));
}

export function getSectionDef(id: string): SectionDef | undefined {
  return (SECTIONS as Record<string, SectionDef>)[id];
}
