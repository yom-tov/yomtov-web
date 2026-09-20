import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Mail, ShieldCheck, Accessibility as AccessibilityIcon, Crown, Code2, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת נגישות לאתר אבי יומטוביאן, כולל פרטי יצירת קשר לדיווח על בעיות נגישות.",
};

const CONTACT_EMAIL = "contact@yomtovian.com";
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
            <div className="border-b border-primary-100/60 bg-primary-50/50 px-4 py-3 sm:px-7 sm:py-4 dark:border-primary-400/15 dark:bg-primary-500/5">
              <h3 className="text-base font-bold text-primary-800 dark:text-primary-200">
                צוות האתר
              </h3>
            </div>
            <div className="divide-y-2 divide-primary-200 dark:divide-primary-400/30">
              <div className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-7 sm:py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 sm:h-12 sm:w-12 dark:bg-primary-500/15 dark:text-primary-300">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text-subtle">בעלים ומנהל האתר</div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <div className="text-lg font-bold text-text">אבי יומטוביאן</div>
                    <a
                      href="mailto:contact@yomtovian.com"
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-800 sm:text-[17px] dark:text-primary-400 dark:hover:text-primary-200"
                    >
                      <Mail className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      contact@yomtovian.com
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-7 sm:py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600 sm:h-12 sm:w-12 dark:bg-accent-500/15 dark:text-accent-300">
                  <Code2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text-subtle">פיתוח, עיצוב ובניית האתר</div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <div className="text-lg font-bold text-text">סער כהן</div>
                    <a
                      href="mailto:saar_cohen@myelectroniclab.com"
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 transition-colors hover:text-accent-800 sm:text-[17px] dark:text-accent-400 dark:hover:text-accent-200"
                    >
                      <Mail className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      saar_cohen@myelectroniclab.com
                    </a>
                  </div>
                  <a
                    href="https://myelectroniclab.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn relative mt-3 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-l from-accent-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-accent-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-500/30 dark:from-accent-500 dark:to-accent-400 dark:shadow-accent-400/20"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full" />
                    <Globe className="relative h-4.5 w-4.5" />
                    <span className="relative">בקרו באתר MyElectronicLab.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
