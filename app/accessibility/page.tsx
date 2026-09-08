import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Mail, ShieldCheck, Accessibility as AccessibilityIcon, Crown, Code2 } from "lucide-react";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת נגישות לאתר אבי יומטוביאן, כולל פרטי יצירת קשר לדיווח על בעיות נגישות.",
};

const CONTACT_EMAIL = "yomtov7.site@gmail.com";
const LAST_UPDATED = "ספטמבר 2026";

export default function AccessibilityPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "ראשי", href: "/" }, { label: "הצהרת נגישות" }]} />

      <div className="mt-8 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-400/25 dark:bg-primary-500/10 dark:text-primary-200">
          <AccessibilityIcon className="h-3.5 w-3.5" />
          עודכן לאחרונה: {LAST_UPDATED}
        </div>

        <h1 className="mt-4 text-3xl font-extrabold text-text sm:text-4xl">
          הצהרת נגישות
        </h1>

        <div className="mt-6 space-y-5 text-base leading-7 text-text-muted">
          <p>
            אתר <strong className="text-text">אבי יומטוביאן</strong> פועל להנגשת
            השירותים והתכנים הניתנים בו לכלל הגולשים, ובכלל זה אנשים עם
            מוגבלות, מתוך אמונה כי לכל אדם מגיעה גישה שווה למידע. אנו פועלים
            לעמוד בדרישות{" "}
            <a
              href="https://www.gov.il/he/departments/legalInfo/handicap_regulation_service"
              target="_blank"
              rel="noopener"
              className="prose-link"
            >
              תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות)
            </a>
            , על בסיס תקן ישראלי 5568 ותקן WCAG 2.1 ברמה AA, ולשפר את הנגישות
            באתר על בסיס שוטף.
          </p>

          <section>
            <h2 className="text-xl font-bold text-text">התאמות הנגישות שבוצעו באתר</h2>
            <ul className="mt-3 list-disc space-y-2 pr-5">
              <li>מבנה סמנטי (HTML5) עם כותרות מדורגות, ניווט וסימון תפקידים (ARIA) במקומות הרלוונטיים.</li>
              <li>תמיכה מלאה בניווט מקלדת, כולל קישור &quot;דלג לתוכן הראשי&quot; וטבעות מיקוד (focus) גלויות בכל רכיבי הממשק.</li>
              <li>ניגודיות צבעים שנבחרה בקפידה, וכן אפשרות למעבר לניגודיות גבוהה דרך תפריט הנגישות.</li>
              <li>תמיכה בהגדלת טקסט, עצירת אנימציות, הדגשת קישורים ופונט קריא - דרך תפריט הנגישות המרחף בכל עמוד.</li>
              <li>כיווניות RTL מלאה בעברית, עם תוויות ותיאורים ברורים לתמונות ואייקונים.</li>
              <li>האתר תומך במצב תצוגה כהה (Dark Mode) עם שמירה על ניגודיות קריאה.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text">מגבלות ידועות</h2>
            <p className="mt-3">
              קבצי ה-PDF המקוריים (מבחנים, מטלות ופתרונות) מוצגים כפי שהם
              התקבלו מהגורמים המפרסמים (מה&quot;ט, משרד החינוך), וייתכן שחלקם
              אינם נגישים באופן מלא לתוכנות הקראה. אנו פועלים לשפר את חוויית
              הצפייה בקבצים אלו לאורך זמן.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-text">
              <ShieldCheck className="h-5 w-5 text-primary-600" />
              נתקלתם בבעיית נגישות?
            </h2>
            <p className="mt-2">
              נשמח לשמוע ולתקן. ניתן לפנות אלינו בכל שאלה, הערה או בעיית
              נגישות שנתקלתם בה באתר:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Mail className="h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
          </section>

          <div className="overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/80 via-surface to-accent-50/50 shadow-lg shadow-primary-500/5 dark:border-primary-400/20 dark:from-primary-500/10 dark:via-surface dark:to-accent-500/5 dark:shadow-primary-500/10">
            <div className="border-b border-primary-100/60 bg-primary-50/50 px-6 py-3 dark:border-primary-400/15 dark:bg-primary-500/5">
              <h3 className="text-sm font-bold text-primary-800 dark:text-primary-200">
                צוות האתר
              </h3>
            </div>
            <div className="divide-y divide-primary-100/40 dark:divide-primary-400/10">
              <div className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-subtle">בעלים ומנהל האתר</div>
                  <div className="text-base font-bold text-text">אבי יומטוביאן</div>
                </div>
              </div>
              <div className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-subtle">פיתוח, עיצוב ובניית האתר</div>
                  <div className="text-base font-bold text-text">סער כהן</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
