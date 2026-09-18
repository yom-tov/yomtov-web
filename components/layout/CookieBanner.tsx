"use client";

import { useState, useEffect } from "react";
import { Cookie, Shield } from "lucide-react";
import Link from "next/link";

const CONSENT_KEY = "cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) {
        setVisible(true);
        document.body.style.overflow = "hidden";
      }
    } catch {}
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {}
    document.body.style.overflow = "";
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label="הסכמה לשימוש בעוגיות"
        className="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-6"
      >
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="hidden sm:grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <Cookie className="h-7 w-7" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 sm:hidden">
                <Cookie className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                <h2 className="text-lg font-bold text-text">
                  עוגיות ופרטיות
                </h2>
              </div>
              <h2 className="hidden sm:block text-lg font-bold text-text">
                עוגיות ופרטיות
              </h2>

              <p className="text-sm leading-relaxed text-text-muted">
                אתר זה משתמש בעוגיות (cookies) לצורך שיפור חוויית הגלישה,
                ניתוח סטטיסטי של השימוש באתר (אנליטיקה), ושמירת העדפות
                המשתמש. העוגיות מסייעות לנו להבין כיצד המבקרים משתמשים
                באתר ולשפר את השירות בהתאם.
              </p>

              <p className="text-xs leading-relaxed text-text-subtle">
                <Shield className="inline-block h-3.5 w-3.5 -mt-0.5 ml-1 text-primary-500" />
                השימוש באתר מהווה הסכמה ל
                <Link
                  href="/terms"
                  className="font-semibold text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  תנאי השימוש ומדיניות הפרטיות
                </Link>
                .
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={accept}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-surface"
                >
                  <Cookie className="h-4 w-4" />
                  מאשר/ת
                </button>
                <Link
                  href="/terms"
                  className="text-xs font-medium text-text-muted underline underline-offset-2 hover:text-text"
                >
                  קרא עוד
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
