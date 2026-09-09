"use client";

import { useState } from "react";
import { Play, X, Maximize2 } from "lucide-react";

interface ShortItem {
  id: string;
  title: string;
}

interface ShortsRowProps {
  shorts: ShortItem[];
}

export default function ShortsRow({ shorts }: ShortsRowProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const expandedShort = shorts.find((s) => s.id === expandedId);

  return (
    <>
      <div className="mt-4 grid grid-cols-5 gap-3">
        {shorts.map((short) => (
          <div key={short.id} className="flex flex-col">
            {/* Title above video */}
            <div className="rounded-t-xl border border-b-0 border-border bg-surface px-2 py-2 text-center">
              <h3 className="text-xs font-bold leading-snug text-text line-clamp-2 sm:text-sm">
                {short.title}
              </h3>
            </div>
            {/* Video thumbnail */}
            <div
              className="group relative overflow-hidden rounded-b-xl border border-border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary-200 cursor-pointer"
              onClick={() => setExpandedId(short.id)}
            >
              <div
                className="relative w-full"
                style={{ paddingBottom: "177.78%" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${short.id}/0.jpg`}
                  alt={short.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/30 transition-transform duration-300 group-hover:scale-110">
                    <Play className="h-4 w-4 fill-white text-white mr-[-1px]" />
                  </div>
                </div>
                <button
                  className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
                  aria-label={`הגדל סרטון: ${short.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(short.id);
                  }}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded modal */}
      {expandedId && expandedShort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setExpandedId(null)}
        >
          <div
            className="relative w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedId(null)}
              className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="סגור"
            >
              <X className="h-4 w-4" />
              סגור
            </button>
            <div className="rounded-t-2xl border border-b-0 border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-sm font-bold text-white">
                {expandedShort.title}
              </p>
            </div>
            <div className="overflow-hidden rounded-b-2xl border border-white/10 shadow-2xl">
              <div
                className="relative w-full"
                style={{ paddingBottom: "177.78%" }}
              >
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${expandedId}?autoplay=1&rel=0`}
                  title={expandedShort.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Navigation dots */}
            <div className="mt-4 flex justify-center gap-2">
              {shorts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setExpandedId(s.id)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    s.id === expandedId
                      ? "bg-white scale-125"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={s.title}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
