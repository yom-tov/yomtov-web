"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { CollectionInfo } from "@/lib/site-content/youtube";
import { Badge, Btn, EmptyState, Field, Input, LinkBtn, Textarea } from "@/components/admin/ui/primitives";
import { SortableList, VisibilityToggle } from "@/components/admin/ui/interactive";
import {
  addYoutubeVideoAction,
  deleteYoutubeVideoAction,
  lookupYoutubeAction,
  reorderYoutubeAction,
  setYoutubeHiddenAction,
  updateYoutubeVideoAction,
} from "@/app/admin/youtube/actions";

export interface YtRow {
  id: string;
  collection: string;
  youtubeId: string;
  title: string;
  description: string | null;
  isShort: boolean;
  hidden: boolean;
}

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

export function YoutubeManager({
  collections,
  rows,
  initialCollection,
}: {
  collections: CollectionInfo[];
  rows: YtRow[];
  initialCollection: string;
}) {
  const [active, setActive] = useState(initialCollection);
  const info = collections.find((c) => c.id === active) ?? collections[0];
  const items = rows.filter((r) => r.collection === info.id);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {collections.map((c) => {
          const n = rows.filter((r) => r.collection === c.id && !r.hidden).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActive(c.id);
                window.history.replaceState(null, "", `?c=${c.id}`);
              }}
              className={clsx(
                "shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                c.id === info.id ? "border-primary-500 bg-primary-600 text-white" : "border-border bg-surface text-text hover:bg-surface-2",
              )}
            >
              {c.title}
              <span className={clsx("ms-1.5 text-xs", c.id === info.id ? "text-white/80" : "text-text-subtle")}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-text">{info.title}</h2>
            <p className="mt-0.5 text-xs text-text-muted">{info.description}</p>
            {info.single && (
              <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                בדף מוצג רק הסרטון הגלוי הראשון ברשימה.
              </p>
            )}
          </div>
          <LinkBtn href={info.page} external size="sm">
            <ExternalLink className="h-3.5 w-3.5" />
            צפה בדף
          </LinkBtn>
        </div>

        <AddVideo key={info.id} collection={info.id} />
      </div>

      <VideoList
        key={`${info.id}|${items.map((i) => `${i.id}:${i.youtubeId}:${i.hidden}:${i.title}`).join("|")}`} collection={info.id} items={items} single={!!info.single} />
    </div>
  );
}

function AddVideo({ collection }: { collection: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState<{ youtubeId: string; isShort?: boolean; author?: string } | null>(null);
  const [looking, startLookup] = useTransition();
  const [adding, startAdd] = useTransition();

  const lookup = () =>
    startLookup(async () => {
      const res = await lookupYoutubeAction(url);
      if (!res.ok || !res.youtubeId) {
        toast.error(res.error ?? "לא נמצא");
        setPreview(res.youtubeId ? { youtubeId: res.youtubeId } : null);
        return;
      }
      setPreview({ youtubeId: res.youtubeId, isShort: res.isShort, author: res.author });
      if (!title) setTitle(res.title ?? "");
    });

  const add = () =>
    startAdd(async () => {
      const res = await addYoutubeVideoAction({ collection, url, title });
      if (!res.ok) {
        toast.error(res.error ?? "ההוספה נכשלה");
        return;
      }
      toast.success("הסרטון נוסף — הוא כבר באתר");
      setUrl("");
      setTitle("");
      setPreview(null);
      router.refresh();
    });

  return (
    <div className="mt-4 rounded-xl border border-dashed border-border-strong p-4">
      <div className="text-sm font-bold text-text">הוספת סרטון</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Field label="קישור לסרטון ב-YouTube (רגיל או Shorts)">
          <Input
            dir="ltr"
            placeholder="https://www.youtube.com/shorts/…"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setPreview(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                lookup();
              }
            }}
          />
        </Field>
        <div className="flex items-end">
          <Btn onClick={lookup} disabled={!url.trim() || looking}>
            {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            בדוק
          </Btn>
        </div>
      </div>

      {preview && (
        <div className="mt-3 flex flex-wrap items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb(preview.youtubeId)} alt="" className="h-20 w-36 rounded-lg object-cover" />
          <div className="min-w-0 flex-1 space-y-2">
            <Field label="כותרת (אפשר לשנות)">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-subtle">
              {preview.isShort && <Badge tone="info">Short</Badge>}
              {preview.author && <span>ערוץ: {preview.author}</span>}
            </div>
          </div>
          <Btn variant="primary" onClick={add} disabled={adding || !title.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            הוסף לאתר
          </Btn>
        </div>
      )}
    </div>
  );
}

function VideoList({ collection, items: initial, single }: { collection: string; items: YtRow[]; single: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  if (!items.length) {
    return <EmptyState title="אין עדיין סרטונים באוסף הזה" description="הדבק קישור למעלה כדי להוסיף את הראשון." />;
  }

  const reorder = (next: YtRow[]) => {
    const prev = items;
    setItems(next);
    start(async () => {
      const res = await reorderYoutubeAction(collection, next.map((i) => i.id));
      if (!res.ok) {
        toast.error(res.error ?? "הסידור נכשל");
        setItems(prev);
        return;
      }
      router.refresh();
    });
  };

  const firstVisibleId = items.find((i) => !i.hidden)?.id;

  return (
    <SortableList
      items={items}
      getKey={(i) => i.id}
      onReorder={reorder}
      renderItem={(v) =>
        editing === v.id ? (
          <EditVideo
            video={v}
            onDone={(updated) => {
              setEditing(null);
              if (updated) {
                setItems((all) => all.map((x) => (x.id === v.id ? { ...x, ...updated } : x)));
                router.refresh();
              }
            }}
          />
        ) : (
          <div className={clsx("flex items-center gap-3", v.hidden && "opacity-55")}>
            <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(v.youtubeId)} alt="" className="h-12 w-20 rounded-md object-cover" />
            </a>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-text" title={v.title}>
                {v.title}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {v.isShort && <Badge tone="info">Short</Badge>}
                {single && v.id === firstVisibleId && <Badge tone="success">מוצג בדף</Badge>}
                <span className="text-[10px] text-text-subtle" dir="ltr">
                  {v.youtubeId}
                </span>
              </div>
            </div>
            <VisibilityToggle
              compact
              hidden={v.hidden}
              pending={busy === v.id}
              onToggle={() => {
                setBusy(v.id);
                start(async () => {
                  const res = await setYoutubeHiddenAction(v.id, !v.hidden);
                  setBusy(null);
                  if (!res.ok) {
                    toast.error(res.error ?? "שגיאה");
                    return;
                  }
                  setItems((all) => all.map((x) => (x.id === v.id ? { ...x, hidden: !v.hidden } : x)));
                  toast.success(v.hidden ? "הסרטון מוצג באתר" : "הסרטון הוסתר מהאתר");
                  router.refresh();
                });
              }}
            />
            <button
              type="button"
              onClick={() => setEditing(v.id)}
              className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text"
              aria-label="עריכה"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirm(`למחוק את "${v.title}" מהאתר? (הסרטון נשאר ב-YouTube)`)) return;
                start(async () => {
                  const res = await deleteYoutubeVideoAction(v.id);
                  if (!res.ok) {
                    toast.error(res.error ?? "שגיאה");
                    return;
                  }
                  setItems((all) => all.filter((x) => x.id !== v.id));
                  toast.success("נמחק");
                  router.refresh();
                });
              }}
              className="rounded-lg p-1.5 text-text-subtle hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
              aria-label="מחק"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      }
    />
  );
}

function EditVideo({ video, onDone }: { video: YtRow; onDone: (updated: Partial<YtRow> | null) => void }) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [url, setUrl] = useState(`https://www.youtube.com/watch?v=${video.youtubeId}`);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateYoutubeVideoAction(video.id, { title, description: description || null, url });
          if (!res.ok) {
            toast.error(res.error ?? "השמירה נכשלה");
            return;
          }
          toast.success("נשמר");
          onDone({ title, description: description || null });
        });
      }}
    >
      <Field label="כותרת">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="קישור">
        <Input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <Field label="תיאור (לא חובה)">
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Btn type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          שמור
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onDone(null)}>
          <X className="h-3.5 w-3.5" />
          ביטול
        </Btn>
      </div>
    </form>
  );
}
