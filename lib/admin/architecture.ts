// Registry of every external service the site depends on. It feeds:
//   - the "ארכיטקטורה" tab (plain-language explanations + diagram)
//   - the health checks (which service a check belongs to, env vars)
//   - the settings page env checklist
// Keep the texts simple — they are written for the site owner, not developers.

export type ServiceId =
  | "namecheap"
  | "vercel"
  | "github"
  | "neon"
  | "mux"
  | "r2"
  | "blob"
  | "resend"
  | "youtube"
  | "simulators";

export type ServiceCategory = "domain" | "hosting" | "code" | "data" | "media" | "email" | "external";

export interface EnvVarInfo {
  name: string;
  /** Alternative names that satisfy the same requirement. */
  alt?: string[];
  purpose: string;
  /** The site breaks without it (vs. a feature degrades). */
  critical?: boolean;
}

export interface ServiceInfo {
  id: ServiceId;
  name: string;
  /** One short line under the name. */
  tagline: string;
  category: ServiceCategory;
  /** Brand-ish accent used for the diagram node. */
  color: string;
  whatItIs: string;
  whyWeUseIt: string;
  whatLivesThere: string[];
  ifItFails: string;
  dashboardUrl: string;
  dashboardLabel: string;
  envVars: EnvVarInfo[];
  /** Paid service whose plan / renewal date the owner tracks. */
  billable: boolean;
  /** Default plan text shown until the owner fills in their own. */
  defaultPlan?: string;
}

export const SERVICES: ServiceInfo[] = [
  {
    id: "namecheap",
    name: "Namecheap",
    tagline: "הדומיין yomtovian.com",
    category: "domain",
    color: "#DE3723",
    whatItIs: "החברה שממנה קנינו את השם yomtovian.com. היא גם מנהלת את ה-DNS — \"ספר הטלפונים\" שאומר לדפדפן לאיזה שרת לפנות כשמקלידים את הכתובת.",
    whyWeUseIt: "בלי דומיין אין כתובת לאתר. ה-DNS ב-Namecheap מפנה את yomtovian.com לשרתים של Vercel, ובנוסף מעביר מיילים שנשלחים לכתובות @yomtovian.com לתיבת ה-Gmail.",
    whatLivesThere: [
      "רישום הדומיין (בתוקף עד 2036)",
      "רשומות DNS שמפנות ל-Vercel",
      "העברת מיילים (Email Forwarding)",
    ],
    ifItFails: "האתר לא נגיש בכלל לגולשים, גם אם כל השאר תקין. כך קרה בספטמבר 2026: שינוי ב-Nameservers הפיל את האתר ל-3 ימים. בדיקת ה-DNS בפאנל מתריעה על זה עכשיו.",
    dashboardUrl: "https://ap.www.namecheap.com/domains/list/",
    dashboardLabel: "ניהול הדומיין ב-Namecheap",
    envVars: [],
    billable: true,
    defaultPlan: "דומיין .com",
  },
  {
    id: "vercel",
    name: "Vercel",
    tagline: "השרת שמריץ את האתר",
    category: "hosting",
    color: "#111111",
    whatItIs: "שירות האחסון (Hosting) שבו האתר רץ. בכל פעם שיש שינוי בקוד או בתוכן ב-GitHub, Vercel בונה גרסה חדשה של האתר ומעלה אותה אוטומטית (\"דיפלוי\").",
    whyWeUseIt: "הוא מגיש את האתר מהר מכל מקום בעולם, בונה אותו אוטומטית מכל שינוי, מריץ את הבדיקה היומית של הפאנל, ומודד כניסות (Analytics).",
    whatLivesThere: [
      "האתר עצמו וכל הגרסאות שלו (דיפלוים)",
      "משתני סביבה — המפתחות הסודיים לכל השירותים",
      "Vercel Analytics — סטטיסטיקת כניסות",
      "Cron — הבדיקה היומית שמריצה את ההתראות",
    ],
    ifItFails: "האתר לא עולה. אם רק דיפלוי חדש נכשל — האתר ממשיך לעבוד על הגרסה הקודמת, אבל השינויים האחרונים לא יופיעו עד שהתקלה תתוקן.",
    dashboardUrl: "https://vercel.com/yom-tov/yomtov-web",
    dashboardLabel: "הפרויקט ב-Vercel",
    envVars: [
      { name: "VERCEL_TOKEN", purpose: "גישה ל-API של Vercel (סטטוס דיפלויים, בדיקות)" },
      { name: "VERCEL_PROJECT_ID", purpose: "מזהה הפרויקט ב-Vercel" },
      { name: "VERCEL_TEAM_ID", purpose: "מזהה הצוות ב-Vercel" },
      { name: "CRON_SECRET", purpose: "סוד שמאמת את הבדיקה היומית האוטומטית" },
      { name: "SESSION_SECRET", purpose: "חתימה על התחברות משתמשים ואדמין", critical: true },
      { name: "ADMIN_PASSWORD_HASH", purpose: "הסיסמה לפאנל האדמין (מוצפנת)", critical: true },
      { name: "SOLUTION_PASSWORD_HASH", purpose: "הסיסמה לפתרונות המטלות (מוצפנת)" },
    ],
    billable: true,
    defaultPlan: "Hobby (חינם)",
  },
  {
    id: "github",
    name: "GitHub",
    tagline: "הקוד + מבחנים ומטלות",
    category: "code",
    color: "#24292F",
    whatItIs: "המקום שבו נשמר כל הקוד של האתר, עם היסטוריה מלאה של כל שינוי (\"קומיטים\"). גם רשימות המבחנים, המטלות, הנוסחאונים והמעבדות נשמרות שם כקבצים.",
    whyWeUseIt: "כל שינוי נשמר עם תאריך ואפשר לחזור אחורה. כשמוסיפים מבחן בפאנל, הפאנל שומר את השינוי ב-GitHub, ו-Vercel בונה מזה גרסה חדשה של האתר תוך כדקה.",
    whatLivesThere: [
      "קוד האתר",
      "רשימת המבחנים, המטלות, הנוסחאונים והמעבדות (קבצי JSON)",
      "היסטוריה של כל שינוי",
    ],
    ifItFails: "האתר הקיים ממשיך לעבוד, אבל לא ניתן להוסיף או לערוך מבחנים, מטלות, נוסחאונים ומעבדות מהפאנל.",
    dashboardUrl: "https://github.com/yom-tov/yomtov-web",
    dashboardLabel: "המאגר ב-GitHub",
    envVars: [
      { name: "GITHUB_TOKEN", purpose: "הרשאה לפאנל לשמור שינויים ב-GitHub" },
      { name: "GITHUB_REPO_OWNER", purpose: "שם בעל המאגר" },
      { name: "GITHUB_REPO_NAME", purpose: "שם המאגר" },
      { name: "GITHUB_BRANCH", purpose: "הענף הראשי (main)" },
    ],
    billable: false,
    defaultPlan: "חינם",
  },
  {
    id: "neon",
    name: "Neon",
    tagline: "מסד הנתונים",
    category: "data",
    color: "#00E599",
    whatItIs: "מסד נתונים (Postgres) בענן — \"טבלאות אקסל\" חכמות שהאתר קורא וכותב אליהן בזמן אמת.",
    whyWeUseIt: "כל מה שמשתנה כל הזמן נשמר כאן, ושינוי מופיע באתר מיד, בלי דיפלוי.",
    whatLivesThere: [
      "משתמשים רשומים והרשאות לקורסים",
      "קורסים ורשימת הסרטונים בכל קורס",
      "התקדמות צפייה ופעילות משתמשים",
      "טקסטים של האתר, סרטוני YouTube ו-Shorts",
      "התראות הפאנל",
    ],
    ifItFails: "אי אפשר להתחבר, לצפות בקורסים או לערוך תוכן. דפי התוכן הציבוריים ממשיכים לעבוד עם הטקסטים האחרונים ששמורים בזיכרון.",
    dashboardUrl: "https://console.neon.tech/",
    dashboardLabel: "הקונסולה של Neon",
    envVars: [
      {
        name: "POSTGRES_URL",
        alt: ["yomtob_database_POSTGRES_URL"],
        purpose: "כתובת החיבור למסד הנתונים",
        critical: true,
      },
    ],
    billable: true,
    defaultPlan: "Free (0.5GB)",
  },
  {
    id: "mux",
    name: "Mux",
    tagline: "סרטוני הקורסים",
    category: "media",
    color: "#FA50B5",
    whatItIs: "שירות וידאו מקצועי. מעלים אליו סרטון והוא דואג להזרים אותו באיכות המתאימה לכל מכשיר.",
    whyWeUseIt: "סרטוני הקורסים בתשלום מוגנים: כל צפייה מקבלת \"כרטיס כניסה\" זמני וחתום, כך שאי אפשר לשתף קישור ישיר לסרטון. בנוסף מוצג סימן מים עם פרטי הצופה.",
    whatLivesThere: ["כל סרטוני הקורסים", "תמונות ממוזערות של הסרטונים"],
    ifItFails: "סרטוני הקורסים (כולל הפרומו החינמי) לא מתנגנים. שאר האתר עובד.",
    dashboardUrl: "https://dashboard.mux.com/",
    dashboardLabel: "הדשבורד של Mux",
    envVars: [
      { name: "MUX_TOKEN_ID", purpose: "גישה ל-API של Mux (העלאה וסנכרון)" },
      { name: "MUX_TOKEN_SECRET", purpose: "גישה ל-API של Mux (העלאה וסנכרון)" },
      { name: "MUX_SIGNING_KEY_ID", purpose: "חתימה על כרטיסי צפייה", critical: true },
      { name: "MUX_SIGNING_KEY_PRIVATE", purpose: "חתימה על כרטיסי צפייה", critical: true },
    ],
    billable: true,
    defaultPlan: "לפי שימוש",
  },
  {
    id: "r2",
    name: "Cloudflare R2",
    tagline: "קבצי ה-PDF",
    category: "media",
    color: "#F38020",
    whatItIs: "\"כונן\" בענן של Cloudflare לאחסון קבצים גדולים.",
    whyWeUseIt: "כל קבצי ה-PDF (מבחנים, פתרונות, מטלות) יושבים כאן ונשלחים לגולשים מהר ובזול, בלי להכביד על האתר עצמו.",
    whatLivesThere: ["קבצי PDF של מבחנים ופתרונות", "קבצי PDF של מטלות", "מדריכי מעבדה"],
    ifItFails: "הדפים נטענים, אבל קבצי ה-PDF לא נפתחים.",
    dashboardUrl: "https://dash.cloudflare.com/?to=/:account/r2/overview",
    dashboardLabel: "R2 ב-Cloudflare",
    envVars: [
      { name: "NEXT_PUBLIC_PDF_BASE_URL", purpose: "הכתובת הציבורית של קבצי ה-PDF", critical: true },
      { name: "R2_ENDPOINT", purpose: "העלאת קבצים מהפאנל" },
      { name: "R2_ACCESS_KEY_ID", purpose: "העלאת קבצים מהפאנל" },
      { name: "R2_SECRET_ACCESS_KEY", purpose: "העלאת קבצים מהפאנל" },
    ],
    billable: true,
    defaultPlan: "Free (10GB)",
  },
  {
    id: "blob",
    name: "Vercel Blob",
    tagline: "העלאות זמניות ותמונות",
    category: "media",
    color: "#6B7280",
    whatItIs: "אחסון קבצים קטן שמובנה ב-Vercel.",
    whyWeUseIt: "כשמעלים PDF בפאנל הוא עובר כאן לרגע בדרך ל-R2. תמונות ממוזערות של קורסים נשמרות כאן דרך קבע.",
    whatLivesThere: ["תמונות ממוזערות של קורסים וסרטונים", "קבצים בדרך ל-R2 (נמחקים אוטומטית)"],
    ifItFails: "לא ניתן להעלות קבצים ותמונות מהפאנל. תמונות קורסים שהועלו עלולות לא להופיע.",
    dashboardUrl: "https://vercel.com/yom-tov/yomtov-web/stores",
    dashboardLabel: "Storage ב-Vercel",
    envVars: [{ name: "BLOB_READ_WRITE_TOKEN", purpose: "העלאת קבצים ותמונות" }],
    billable: false,
    defaultPlan: "כלול ב-Vercel",
  },
  {
    id: "resend",
    name: "Resend",
    tagline: "שליחת מיילים",
    category: "email",
    color: "#000000",
    whatItIs: "שירות ששולח מיילים אוטומטיים מהאתר.",
    whyWeUseIt: "מייל אימות בהרשמה, איפוס סיסמה, מייל ברוכים הבאים — וגם מייל ההתראות היומי של הפאנל.",
    whatLivesThere: ["תבניות המיילים (בקוד)", "היסטוריית מיילים שנשלחו"],
    ifItFails: "משתמשים חדשים לא מקבלים מייל אימות ולא יכולים לאפס סיסמה. גם מייל ההתראות לא יגיע.",
    dashboardUrl: "https://resend.com/emails",
    dashboardLabel: "הדשבורד של Resend",
    envVars: [
      { name: "RESEND_API_KEY", purpose: "שליחת מיילים", critical: true },
      { name: "EMAIL_FROM", purpose: "כתובת השולח במיילים" },
      { name: "ADMIN_ALERT_EMAIL", purpose: "לאן לשלוח את מייל ההתראות היומי" },
      { name: "NEXT_PUBLIC_BASE_URL", purpose: "כתובת האתר לקישורים במיילים" },
    ],
    billable: true,
    defaultPlan: "Free (3,000 מיילים בחודש)",
  },
  {
    id: "youtube",
    name: "YouTube",
    tagline: "סרטונים חינמיים ו-Shorts",
    category: "external",
    color: "#FF0000",
    whatItIs: "ערוץ היוטיוב @yomtov7.",
    whyWeUseIt: "הסרטונים החינמיים — מעבדות, מתמטיקה, פיזיקה, פסיכומטרי ו-Shorts — מוטמעים באתר ישירות מיוטיוב, בחינם וללא הגבלה.",
    whatLivesThere: ["הסרטונים החינמיים וה-Shorts"],
    ifItFails: "הסרטונים החינמיים לא מתנגנים. שאר האתר עובד.",
    dashboardUrl: "https://studio.youtube.com/",
    dashboardLabel: "YouTube Studio",
    envVars: [],
    billable: false,
  },
  {
    id: "simulators",
    name: "Falstad / PhET",
    tagline: "סימולטורים",
    category: "external",
    color: "#2563EB",
    whatItIs: "סימולטורים חינמיים ללימוד (מעגלים חשמליים וטורי פורייה) מאתרים חיצוניים.",
    whyWeUseIt: "מוטמעים בדפי הנושאים ובמעבדות כדי לאפשר לתלמידים לנסות בעצמם.",
    whatLivesThere: ["הסימולטורים עצמם (אצל Falstad ו-PhET)"],
    ifItFails: "חלון הסימולטור ריק. שאר הדף עובד.",
    dashboardUrl: "https://www.falstad.com/circuit/",
    dashboardLabel: "Falstad",
    envVars: [],
    billable: false,
  },
];

export const SERVICE_BY_ID: Record<ServiceId, ServiceInfo> = Object.fromEntries(
  SERVICES.map((s) => [s.id, s]),
) as Record<ServiceId, ServiceInfo>;

export function isEnvSet(v: EnvVarInfo): boolean {
  return [v.name, ...(v.alt ?? [])].some((n) => Boolean(process.env[n]));
}

// ---------------------------------------------------------------------------
// "How it works" flows for the architecture diagram. Each step highlights the
// connection between two nodes. "visitor" and "admin" are people, not services.
// ---------------------------------------------------------------------------
export type DiagramNodeId = ServiceId | "visitor" | "admin";

export interface FlowStep {
  from: DiagramNodeId;
  to: DiagramNodeId;
  text: string;
}

export interface Flow {
  id: string;
  title: string;
  emoji: string;
  steps: FlowStep[];
  takeaway: string;
}

export const FLOWS: Flow[] = [
  {
    id: "visit",
    title: "גולש נכנס לאתר",
    emoji: "🌐",
    steps: [
      { from: "visitor", to: "namecheap", text: "הגולש מקליד yomtovian.com. הדפדפן שואל את ה-DNS ב-Namecheap: \"איפה האתר הזה נמצא?\"" },
      { from: "namecheap", to: "vercel", text: "Namecheap עונה: \"בשרתים של Vercel\" — והדפדפן פונה לשם." },
      { from: "vercel", to: "neon", text: "Vercel מכין את הדף. אם צריך — שולף טקסטים, קורסים וסרטונים ממסד הנתונים Neon." },
      { from: "vercel", to: "visitor", text: "הדף נשלח לגולש ומוצג לו. רוב הדפים מוכנים מראש, ולכן נטענים מהר מאוד." },
      { from: "visitor", to: "r2", text: "כשהגולש פותח קובץ PDF של מבחן — הקובץ מגיע ישירות מ-Cloudflare R2." },
      { from: "visitor", to: "youtube", text: "סרטונים חינמיים ו-Shorts מתנגנים ישירות מיוטיוב." },
    ],
    takeaway: "אם Namecheap לא מפנה נכון — אף אחד לא מגיע לאתר, גם כשכל השאר תקין.",
  },
  {
    id: "course-video",
    title: "תלמיד צופה בסרטון קורס",
    emoji: "🎬",
    steps: [
      { from: "visitor", to: "vercel", text: "התלמיד מתחבר ולוחץ על סרטון בקורס." },
      { from: "vercel", to: "neon", text: "האתר בודק ב-Neon שלתלמיד יש גישה בתוקף לקורס הזה." },
      { from: "vercel", to: "mux", text: "האתר חותם \"כרטיס כניסה\" זמני לסרטון (תקף ל-10 דקות) — בלי הכרטיס Mux לא ינגן את הסרטון." },
      { from: "mux", to: "visitor", text: "Mux מזרים את הסרטון לתלמיד, באיכות שמתאימה לאינטרנט שלו, עם סימן מים של פרטי התלמיד." },
      { from: "visitor", to: "neon", text: "כל כמה שניות נשמר ב-Neon איפה התלמיד עצר — כדי שיוכל להמשיך מאותה נקודה." },
    ],
    takeaway: "הסרטונים מוגנים: אי אפשר לשתף קישור ישיר, כי כל צפייה צריכה כרטיס חדש מהאתר.",
  },
  {
    id: "add-exam",
    title: "אתה מוסיף מבחן",
    emoji: "📝",
    steps: [
      { from: "admin", to: "vercel", text: "בפאנל אתה ממלא את פרטי המבחן ומעלה את קובץ ה-PDF." },
      { from: "vercel", to: "blob", text: "הקובץ עולה קודם ל-Vercel Blob (תחנת ביניים זמנית)." },
      { from: "vercel", to: "r2", text: "הפאנל מעביר את הקובץ למקומו הקבוע ב-Cloudflare R2, ומוחק אותו מ-Blob." },
      { from: "vercel", to: "github", text: "הפאנל שומר את פרטי המבחן ברשימת המבחנים ב-GitHub (קומיט)." },
      { from: "github", to: "vercel", text: "GitHub מודיע ל-Vercel שיש שינוי, ו-Vercel בונה גרסה חדשה של האתר (כדקה)." },
      { from: "vercel", to: "visitor", text: "המבחן מופיע באתר. אם הבנייה נכשלת — תקבל התראה בפאנל." },
    ],
    takeaway: "מבחנים, מטלות, נוסחאונים ומעבדות מופיעים באתר אחרי כדקה, כי האתר נבנה מחדש.",
  },
  {
    id: "edit-text",
    title: "אתה משנה טקסט או סרטון YouTube",
    emoji: "✏️",
    steps: [
      { from: "admin", to: "vercel", text: "בפאנל אתה משנה טקסט בדף הבית, שאלה נפוצה או סרטון YouTube, ושומר." },
      { from: "vercel", to: "neon", text: "השינוי נשמר מיד במסד הנתונים Neon." },
      { from: "vercel", to: "visitor", text: "האתר מרענן את הדף הרלוונטי, והגולש הבא כבר רואה את הגרסה החדשה — תוך שניות, בלי לחכות לבנייה." },
    ],
    takeaway: "טקסטים, סרטוני YouTube, קורסים ומשתמשים מתעדכנים מיידית.",
  },
  {
    id: "signup",
    title: "הרשמה ומייל אימות",
    emoji: "✉️",
    steps: [
      { from: "visitor", to: "vercel", text: "גולש ממלא את טופס ההרשמה." },
      { from: "vercel", to: "neon", text: "המשתמש נשמר ב-Neon (הסיסמה מוצפנת — גם אתה לא יכול לראות אותה)." },
      { from: "vercel", to: "resend", text: "האתר מבקש מ-Resend לשלוח מייל אימות." },
      { from: "resend", to: "visitor", text: "המייל מגיע לגולש, הוא לוחץ על הקישור והחשבון מאומת." },
      { from: "admin", to: "neon", text: "בפאנל (משתמשים) אתה נותן לו גישה לקורס אחרי התשלום — וזה נשמר ב-Neon." },
    ],
    takeaway: "אם Resend לא עובד — משתמשים חדשים לא מקבלים מייל אימות. הבדיקה היומית מתריעה על זה.",
  },
];

// Where each kind of content lives and how fast edits reach the site.
export const CONTENT_LOCATIONS: { what: string; where: ServiceId[]; speed: "instant" | "build"; admin: string }[] = [
  { what: "מבחנים ופתרונות", where: ["github", "r2"], speed: "build", admin: "/admin/exams" },
  { what: "מטלות", where: ["github", "r2"], speed: "build", admin: "/admin/assignments" },
  { what: "נוסחאונים", where: ["github", "r2"], speed: "build", admin: "/admin/formulas" },
  { what: "סרטוני מעבדה", where: ["github", "youtube"], speed: "build", admin: "/admin/labs" },
  { what: "קטגוריות (חשמל, תקבילית…)", where: ["github"], speed: "build", admin: "/admin/subjects" },
  { what: "קורסים ומחירים", where: ["neon"], speed: "instant", admin: "/admin/packages" },
  { what: "סרטוני קורס", where: ["neon", "mux"], speed: "instant", admin: "/admin/videos" },
  { what: "סרטוני YouTube ו-Shorts", where: ["neon", "youtube"], speed: "instant", admin: "/admin/youtube" },
  { what: "טקסטים, שאלות נפוצות, פרטי קשר", where: ["neon"], speed: "instant", admin: "/admin/site" },
  { what: "משתמשים והרשאות", where: ["neon"], speed: "instant", admin: "/admin/users" },
  { what: "תמונות קורסים", where: ["blob"], speed: "instant", admin: "/admin/packages" },
];
