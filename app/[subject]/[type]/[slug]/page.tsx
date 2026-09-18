import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Download, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import {
  exams,
  assignments,
  formulas,
  examSubtitle,
  findAssignment,
  findExam,
  findFormula,
  getSubject,
  sourceFromSlug,
  SOURCE_TITLE_HE,
  SUBJECT_TITLE_HE,
} from "@/lib/content";
import type { SubjectId } from "@/types/content";
import { ExamCard } from "@/components/cards/ExamCard";
import { AssignmentCard } from "@/components/cards/AssignmentCard";
import { FormulaCard } from "@/components/cards/FormulaCard";
import { ItemPreview } from "@/components/pdf/ItemPreview";
import { getAssetUrl } from "@/lib/pdf-url";

const VALID_TYPES = ["mahat-exams", "ministry-exams", "technician-exams", "electrical-systems-exams", "assignments", "formulas"] as const;
type ListType = (typeof VALID_TYPES)[number];

const SOURCE_TO_SLUG: Record<string, string> = {
  mahat: "mahat-exams",
  education: "ministry-exams",
  technician: "technician-exams",
  "electrical-systems": "electrical-systems-exams",
};

export function generateStaticParams() {
  const params: { subject: string; type: string; slug: string }[] = [];
  for (const e of exams) {
    params.push({
      subject: e.subject,
      type: SOURCE_TO_SLUG[e.source] || "mahat-exams",
      slug: e.slug,
    });
  }
  for (const a of assignments) {
    params.push({ subject: a.subject, type: "assignments", slug: a.slug });
  }
  for (const f of formulas) {
    params.push({ subject: f.subject, type: "formulas", slug: f.slug });
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
  const item =
    type === "formulas"
      ? findFormula(subject, slug)
      : src
        ? findExam(subject, src, slug)
        : findAssignment(subject, slug);
  if (!item) return {};
  const title =
    "source" in item ? `${item.title} - ${SOURCE_TITLE_HE[item.source]}` : item.title;
  return {
    title: `${title} - ${s.hebrewTitle}`,
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
  const isFormula = type === "formulas";
  const exam = !isAssignment && !isFormula && src ? findExam(subject, src, slug) : null;
  const assignment = isAssignment ? findAssignment(subject, slug) : null;
  const formula = isFormula ? findFormula(subject, slug) : null;
  const item = exam || assignment || formula;
  if (!item) notFound();

  const listTitle = isFormula
    ? "נוסחאונים וסיכומים"
    : isAssignment
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
      path: getAssetUrl(exam.exam.path),
      sizeBytes: exam.exam.sizeBytes,
    });
    if (exam.solution) {
      files.push({
        label: `פתרון - ${exam.title}`,
        role: "solution",
        url: exam.solution.url,
        path: getAssetUrl(exam.solution.path),
        sizeBytes: exam.solution.sizeBytes,
      });
    }
  } else if (assignment) {
    const primary = assignment.files[0];
    if (primary) {
      files.push({
        label: assignment.title,
        role: "primary",
        url: primary.url,
        path: getAssetUrl(primary.path),
        sizeBytes: primary.sizeBytes,
      });
    }
  } else if (formula) {
    formula.files.forEach((f, idx) => {
      files.push({
        label: idx === 0 ? formula.title : `נספח ${idx + 1}`,
        role: idx === 0 ? "primary" : "extra",
        url: f.url,
        path: getAssetUrl(f.path),
        sizeBytes: f.sizeBytes,
      });
    });
  }

  // related items - same subject/type, exclude current
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
      : formula
        ? formulas
            .filter((f) => f.subject === formula.subject && f.id !== formula.id)
            .slice(0, 3)
        : [];

  const subtitle = exam ? examSubtitle(exam) : "";

  const jsonLd = exam
    ? {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: `${exam.title} - ${SOURCE_TITLE_HE[exam.source]}`,
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
          contentUrl: getAssetUrl(exam.exam.path),
          encodingFormat: "application/pdf",
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: (assignment || formula)!.title,
        inLanguage: "he",
        educationalLevel: "post-secondary",
        learningResourceType: isFormula ? "Formula Sheet" : "Assignment",
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

      <ItemPreview
        files={files}
        hasAssignmentSolutions={!!(assignment && assignment.files.length > 1)}
        subject={subject}
        slug={slug}
      />

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-extrabold text-text">
            תכנים קשורים
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) =>
              "source" in r ? (
                <ExamCard key={r.id} exam={r} />
              ) : "files" in r && isFormula ? (
                <FormulaCard key={r.id} formula={r as typeof formulas[number]} />
              ) : (
                <AssignmentCard key={r.id} assignment={r as typeof assignments[number]} />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
