import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Download, FileText, Sparkles, ExternalLink } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import {
  exams,
  assignments,
  examSubtitle,
  findAssignment,
  findExam,
  formatSize,
  getSubject,
  sourceFromSlug,
  SOURCE_TITLE_HE,
  SUBJECT_TITLE_HE,
} from "@/lib/content";
import type { SubjectId } from "@/types/content";
import { ExamCard } from "@/components/cards/ExamCard";
import { AssignmentCard } from "@/components/cards/AssignmentCard";
import { PdfPreview } from "@/components/pdf/PdfPreview";

const VALID_TYPES = ["mahat-exams", "ministry-exams", "assignments"] as const;
type ListType = (typeof VALID_TYPES)[number];

export function generateStaticParams() {
  const params: { subject: string; type: string; slug: string }[] = [];
  for (const e of exams) {
    params.push({
      subject: e.subject,
      type: e.source === "mahat" ? "mahat-exams" : "ministry-exams",
      slug: e.slug,
    });
  }
  for (const a of assignments) {
    params.push({ subject: a.subject, type: "assignments", slug: a.slug });
  }
  return params;
}

type Params = Promise<{ subject: string; type: string; slug: string }>;

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const { subject: subjectRaw, type: typeRaw, slug } = await params;
  const subject = subjectRaw as SubjectId;
  const type = typeRaw as ListType;
  const s = getSubject(subject);
  if (!s) return {};
  const src = sourceFromSlug(type);
  const item = src
    ? findExam(subject, src, slug)
    : findAssignment(subject, slug);
  if (!item) return {};
  const title =
    "source" in item ? `${item.title} — ${SOURCE_TITLE_HE[item.source]}` : item.title;
  return {
    title: `${title} — ${s.hebrewTitle}`,
    description: `הורדה וצפייה בקובץ PDF, כולל פתרון אם קיים. ${s.hebrewTitle}.`,
  };
}

export default async function ItemPage({
  params,
}: { params: Params }) {
  const { subject: subjectRaw, type: typeRaw, slug } = await params;
  const subject = subjectRaw as SubjectId;
  const type = typeRaw as ListType;
  const s = getSubject(subject);
  if (!s || !(VALID_TYPES as readonly string[]).includes(type)) notFound();

  const src = sourceFromSlug(type);
  const isAssignment = type === "assignments";
  const exam = !isAssignment && src ? findExam(subject, src, slug) : null;
  const assignment = isAssignment ? findAssignment(subject, slug) : null;
  const item = exam || assignment;
  if (!item) notFound();

  const listTitle = isAssignment
    ? "עבודות ותרגולים"
    : src
      ? SOURCE_TITLE_HE[src]
      : "";
  const listHref = `/${subject}/${type}`;

  const files: {
    label: string;
    role: "primary" | "solution" | "extra";
    url: string;
    path: string;
    sizeBytes: number | null;
  }[] = [];
  if (exam) {
    files.push({
      label: exam.title,
      role: "primary",
      url: exam.exam.url,
      path: exam.exam.path,
      sizeBytes: exam.exam.sizeBytes,
    });
    if (exam.solution) {
      files.push({
        label: `פתרון — ${exam.title}`,
        role: "solution",
        url: exam.solution.url,
        path: exam.solution.path,
        sizeBytes: exam.solution.sizeBytes,
      });
    }
  } else if (assignment) {
    assignment.files.forEach((f, idx) => {
      files.push({
        label: idx === 0 ? assignment.title : `נספח ${idx + 1}`,
        role: idx === 0 ? "primary" : "solution",
        url: f.url,
        path: f.path,
        sizeBytes: f.sizeBytes,
      });
    });
  }

  // related items — same subject/type, exclude current
  const related = exam
    ? exams
        .filter(
          (e) =>
            e.subject === exam.subject &&
            e.source === exam.source &&
            e.id !== exam.id
        )
        .slice(0, 3)
    : assignment
      ? assignments
          .filter((a) => a.subject === assignment.subject && a.id !== assignment.id)
          .slice(0, 3)
      : [];

  const subtitle = exam ? examSubtitle(exam) : "";

  const jsonLd = exam
    ? {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: `${exam.title} — ${SOURCE_TITLE_HE[exam.source]}`,
        inLanguage: "he",
        educationalLevel: "post-secondary",
        learningResourceType: "Exam",
        about: SUBJECT_TITLE_HE[subject],
        provider: {
          "@type": "Organization",
          name: exam.source === "mahat" ? 'מה"ט' : "משרד החינוך",
        },
        associatedMedia: {
          "@type": "MediaObject",
          contentUrl: exam.exam.path,
          encodingFormat: "application/pdf",
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: assignment!.title,
        inLanguage: "he",
        educationalLevel: "post-secondary",
        learningResourceType: "Assignment",
        about: SUBJECT_TITLE_HE[subject],
      };

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "ראשי", href: "/" },
          { label: s.hebrewTitle, href: `/${subject}` },
          { label: listTitle, href: listHref },
          { label: item.title },
        ]}
      />

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {exam && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={exam.source === "mahat" ? "primary" : "accent"}>
                {SOURCE_TITLE_HE[exam.source]}
              </Badge>
              {exam.solution && (
                <Badge tone="success">
                  <Sparkles className="h-3 w-3" />
                  פתרון זמין
                </Badge>
              )}
            </div>
          )}
          <h1 className="mt-3 text-3xl font-extrabold text-text sm:text-4xl">
            {item.title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-base text-text-muted num">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={files[0].path}
            download
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-md hover:bg-primary-700"
          >
            <Download className="h-4 w-4" />
            הורדת PDF
          </a>
        </div>
      </header>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Preview */}
        <div>
          <PdfPreview src={files[0].path} title={files[0].label} />
        </div>
        {/* Sidebar with files */}
        <aside className="space-y-3">
          {files.map((f) => (
            <div
              key={f.path}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                {f.role === "solution" ? (
                  <Badge tone="success">פתרון</Badge>
                ) : f.role === "extra" ? (
                  <Badge tone="neutral">נספח</Badge>
                ) : (
                  <Badge tone="primary">מבחן</Badge>
                )}
              </div>
              <div className="mt-3 text-sm font-semibold text-text">
                {f.label}
              </div>
              <div className="mt-1 text-xs text-text-subtle num">
                PDF · {formatSize(f.sizeBytes)}
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={f.path}
                  download
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  הורדה
                </a>
                <a
                  href={f.path}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text hover:bg-surface-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  פתיחה
                </a>
              </div>
            </div>
          ))}
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-extrabold text-text">
            תכנים קשורים
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) =>
              "source" in r ? (
                <ExamCard key={r.id} exam={r} />
              ) : (
                <AssignmentCard key={r.id} assignment={r} />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
