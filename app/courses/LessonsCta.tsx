"use client";

import { useState, useEffect } from "react";
import {
  Video,
  Sparkles,
  Mail,
  ArrowLeft,
  X,
  User,
  BookOpen,
  FileText,
  Phone,
} from "lucide-react";

const LESSONS_EMAIL = "lessons@yomtovian.com";

export function LessonsCta() {
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
      <div className="mb-10 relative overflow-hidden rounded-2xl border border-primary-300/50 bg-gradient-to-bl from-primary-700 via-primary-600 to-accent-500 shadow-xl">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent-400/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative flex flex-col items-center gap-6 px-6 py-10 text-center sm:flex-row sm:text-right sm:py-8 sm:px-10">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 shadow-lg ring-1 ring-white/10">
            <Video className="h-10 w-10 text-white drop-shadow-sm" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-400/30 backdrop-blur-sm px-3 py-1 text-xs font-bold text-accent-100 mb-3 border border-accent-300/30">
              <Sparkles className="h-3.5 w-3.5" />
              שיעור אישי 1 על 1
            </div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl drop-shadow-sm">
              שיעורים פרטיים בזום
            </h2>
            <p className="mt-2 text-sm text-primary-100 max-w-lg leading-relaxed">
              למידה מותאמת אישית, בקצב שלך, עם הסברים ברורים ומפורטים.
              מתאים להכנה למבחנים, השלמת פערים, או העמקה בנושאים מורכבים.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex flex-col items-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent-400/20 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4.5 w-4.5" />
              לפרטים ותיאום
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span className="mt-1">נא לפנות במייל</span>
          </button>
        </div>
        <div className="relative border-t border-white/15 bg-white/10 backdrop-blur-sm px-6 py-4 text-center sm:px-10 sm:text-right">
          <span className="text-lg text-white font-bold tracking-wide">
            <Mail className="inline h-5 w-5 ml-2 -mt-0.5" />
            {LESSONS_EMAIL}
          </span>
        </div>
      </div>

      {/* Popup */}
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
                איך לפנות אלינו?
              </h3>
              <p className="mt-1 text-sm text-primary-100">
                נשמח לעזור לך! יש לשלוח מייל עם הפרטים הבאים:
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text">שם מלא</div>
                  <div className="text-sm text-text-muted">
                    כדי שנדע למי לפנות
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text">
                    החומר המתבקש לשיעור
                  </div>
                  <div className="text-sm text-text-muted">
                    נושא, קורס, או תחום שתרצו ללמוד
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text">
                    פרטים נוספים
                  </div>
                  <div className="text-sm text-text-muted">
                    רמת הידע, מועד מבחן, או כל מידע רלוונטי
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text">מספר טלפון</div>
                  <div className="text-sm text-text-muted">
                    ליצירת קשר מהירה ותיאום
                  </div>
                </div>
              </div>
            </div>

            {/* Email CTA */}
            <div className="border-t border-border bg-surface-2/50 px-6 py-5 text-center">
              <a
                href={`mailto:${LESSONS_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-600 px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Mail className="h-5 w-5" />
                שלח מייל עכשיו
              </a>
              <div className="mt-3" dir="ltr">
                <span className="text-lg font-bold text-primary-700 tracking-wide">
                  {LESSONS_EMAIL}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
