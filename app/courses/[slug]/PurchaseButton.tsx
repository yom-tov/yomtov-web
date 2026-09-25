"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, X, Mail, BookOpen, HelpCircle } from "lucide-react";

const COURSES_EMAIL = "courses@yomtovian.com";

export function PurchaseButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 py-3.5 text-base font-bold text-white shadow-lg transition-all duration-300 hover:brightness-105 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
      >
        <ShoppingBag className="h-5 w-5" />
        לרכישה
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-bl from-primary-700 via-primary-600 to-accent-500 px-6 py-5 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-xl font-extrabold text-white">
                רכישת קורס
              </h3>
              <p className="mt-1 text-sm text-primary-100">
                על מנת לרכוש את הקורס — יש לפנות אלינו במייל
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text">
                    באיזה קורס אתם מעוניינים
                  </div>
                  <div className="text-sm text-text-muted">
                    ציינו את שם הקורס שתרצו לרכוש
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text">
                    שאלות נוספות
                  </div>
                  <div className="text-sm text-text-muted">
                    כל שאלה לגבי התוכן, משך הגישה, או כל מידע
                    אחר
                  </div>
                </div>
              </div>
            </div>

            {/* Email CTA */}
            <div className="border-t border-border bg-surface-2/50 px-6 py-5 text-center">
              <a
                href={`mailto:${COURSES_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-600 px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Mail className="h-5 w-5" />
                שלח מייל עכשיו
              </a>
              <div className="mt-3" dir="ltr">
                <span className="text-lg font-bold text-primary-700 tracking-wide">
                  {COURSES_EMAIL}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
