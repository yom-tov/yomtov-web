"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, Play, Video } from "lucide-react";
import type { Lab } from "@/types/content";

function YouTubeCard({ lab }: { lab: Lab }) {
  const [playing, setPlaying] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${lab.youtubeId}/0.jpg`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-primary-200">
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-neutral-900">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${lab.youtubeId}?autoplay=1&rel=0`}
            title={lab.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`הפעל סרטון: ${lab.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-xl shadow-red-600/30 transition-transform duration-300 group-hover:scale-110">
                <Play className="h-7 w-7 fill-white text-white mr-[-2px]" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                <Video className="h-3 w-3" />
                YouTube Short
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="flex flex-1 items-center p-3.5">
        <h3 className="text-sm font-bold leading-snug text-text line-clamp-2">
          {lab.title}
        </h3>
      </div>
    </article>
  );
}

export default function LabsClient({ labs }: { labs: Lab[] }) {
  const [query, setQuery] = useState("");

  const clearSearch = useCallback(() => setQuery(""), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return labs;
    const q = query.trim().toLowerCase();
    return labs.filter((lab) => lab.title.toLowerCase().includes(q));
  }, [labs, query]);

  return (
    <>
      {/* Search bar */}
      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש סרטון..."
          className="h-11 w-full rounded-xl border border-border bg-surface pr-10 pl-10 text-sm text-text placeholder:text-text-subtle focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-text-subtle hover:text-text"
            aria-label="נקה חיפוש"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Count badge */}
      <p className="mt-4 text-sm text-text-muted">
        {filtered.length === labs.length ? (
          <>
            <span className="num font-semibold text-text">{labs.length}</span> סרטונים
          </>
        ) : (
          <>
            נמצאו <span className="num font-semibold text-text">{filtered.length}</span> סרטונים
            {" "}מתוך {labs.length}
          </>
        )}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((lab) => (
            <YouTubeCard key={lab.id} lab={lab} />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-primary-300">
            <Search className="h-6 w-6" />
          </div>
          <p className="mt-3 font-bold text-text">לא נמצאו סרטונים</p>
          <p className="mt-1 text-sm text-text-muted">
            נסו לחפש עם מילים אחרות
          </p>
          <button
            onClick={clearSearch}
            className="mt-4 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            נקה חיפוש
          </button>
        </div>
      )}
    </>
  );
}
