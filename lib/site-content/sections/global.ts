import { area, email, itemText, list, num, section, text, url } from "../fields";

const link = { label: itemText("טקסט"), href: itemText("קישור (למשל /labs)") };

export const globalSections = {
  "global.contact": section({
    title: "כתובות מייל",
    description: "הכתובות שמופיעות באתר. שינוי כאן מעדכן את כל המקומות שבהם הכתובת מופיעה.",
    fields: {
      contactEmail: email("מייל ליצירת קשר כללי", "contact@yomtovian.com", "מופיע בדף הבית (שאלות נפוצות), אודות וסרגל הנגישות"),
      lessonsEmail: email("מייל לשיעורים פרטיים", "lessons@yomtovian.com", "דף הבית ודף הקורסים"),
      coursesEmail: email("מייל לרכישת קורסים", "courses@yomtovian.com", "כפתור \"לרכישה\" בדף הקורס"),
      footerEmail: email("מייל בפוטר (תחתית כל עמוד)", "yomtov7@gmail.com"),
    },
  }),

  "global.social": section({
    title: "רשתות חברתיות",
    fields: {
      youtubeUrl: url("ערוץ YouTube", "https://www.youtube.com/@yomtov7"),
      tiktokUrl: url("TikTok", "https://www.tiktok.com/@avi_yomtovian"),
    },
  }),

  "global.brand": section({
    title: "מיתוג ותיאור האתר",
    fields: {
      siteName: text("שם האתר", "אבי יומטוביאן"),
      tagline: text("סלוגן", "פשוט להבין!"),
      footerAbout: area(
        "תיאור קצר בפוטר",
        'מאגר לימוד לסטודנטים ללימודי חשמל ואלקטרוניקה - מבחני מה"ט, מבחני משרד החינוך, מטלות, מעבדות ומחשבונים.',
      ),
      seoDescription: area(
        "תיאור לגוגל (מופיע בתוצאות החיפוש)",
        'כל מבחני מה"ט ומשרד החינוך עם פתרונות, מטלות, נוסחאונים, מעבדות, מחשבון הנדסי, סימולטורים וקורסי וידאו — במקום אחד. המאגר פתוח וחינמי.',
      ),
    },
  }),

  "global.nav": section({
    title: "תפריט עליון",
    description: "הקישורים בתפריט שבראש כל עמוד.",
    fields: {
      links: list("קישורים", link, "label", [
        { label: "חשמל", href: "/electricity" },
        { label: "תקבילית", href: "/analog" },
        { label: "ספרתית", href: "/digital" },
        { label: "מתמטיקה", href: "/math" },
        { label: "פיסיקה", href: "/physics" },
        { label: "פסיכומטרי", href: "/psychometric" },
        { label: "מעבדות", href: "/labs" },
        { label: "מחשבון", href: "/calculator" },
        { label: "מבחנים", href: "/exams" },
        { label: "קורסים", href: "/courses" },
      ], { max: 14 }),
    },
  }),

  "global.footer": section({
    title: "פוטר (תחתית כל עמוד)",
    fields: {
      col1Title: text("עמודה 1 — כותרת", "תחומי לימוד"),
      col1Links: list("עמודה 1 — קישורים", link, "label", [
        { label: "חשמל", href: "/electricity" },
        { label: "תקבילית", href: "/analog" },
        { label: "ספרתית", href: "/digital" },
        { label: "מתמטיקה", href: "/math" },
        { label: "פיסיקה", href: "/physics" },
        { label: "פסיכומטרי", href: "/psychometric" },
      ]),
      col2Title: text("עמודה 2 — כותרת", "כלים"),
      col2Links: list("עמודה 2 — קישורים", link, "label", [
        { label: "מעבדות", href: "/labs" },
        { label: "מחשבון", href: "/calculator" },
        { label: "כל המבחנים", href: "/exams" },
      ]),
      col3Title: text("עמודה 3 — כותרת", "מידע"),
      col3Links: list("עמודה 3 — קישורים", link, "label", [
        { label: "חיפוש", href: "/search" },
        { label: "אודות", href: "/about" },
        { label: "הצהרת נגישות", href: "/accessibility" },
        { label: "תנאי שימוש ופרטיות", href: "/terms" },
      ]),
    },
  }),

  "global.promo": section({
    title: "פרומו חינמי של קורסים",
    fields: {
      promoMinutes: num("כמה דקות מהסרטון הראשון אפשר לראות בחינם", 30, {
        min: 1,
        max: 240,
        help: "משפיע גם על הנגן עצמו וגם על כל הטקסטים באתר שמזכירים את מספר הדקות.",
      }),
    },
  }),
};
