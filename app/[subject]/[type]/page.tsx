import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  assignmentsFor,
  examsFor,
  getSubject,
  sourceFromSlug,
  SOURCE_TITLE_HE,
  SUBJECT_TITLE_HE,
  subjects,
} from "@/lib/content";
import type { SubjectId } from "@/types/content";
import { ExamListClient } from "./ExamListClient";
import { AssignmentListClient } from "./AssignmentListClient";

const VALID_TYPES = ["mahat-exams", "ministry-exams", "assignments"] as const;
type ListType = (typeof VALID_TYPES)[number];

export function generateStaticParams() {
  const params: { subject: string; type: string }[] = [];
  for (const s of subjects) {
    for (const t of VALID_TYPES) params.push({ subject: s.id, type: t });
  }
  return params;
}

type Params = Promise<{ subject: string; type: string }>;

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const { subject: subjectRaw, type: typeRaw } = await params;
  const subject = subjectRaw as SubjectId;
  const type = typeRaw as ListType;
  const s = getSubject(subject);
  if (!s || !(VALID_TYPES as readonly string[]).includes(type)) return {};
  const src = sourceFromSlug(type);
  const kind =
    type === "assignments" ? "עבודות ותרגולים" : src ? SOURCE_TITLE_HE[src] : "";
  return {
    title: `${kind} — ${s.hebrewTitle}`,
    description: `${kind} בתחום ${s.hebrewTitle}. מאגר מקצועי מקוטלג לפי שנה ומועד.`,
  };
}

export default async function ListPage({
  params,
}: { params: Params }) {
  const { subject: subjectRaw, type: typeRaw } = await params;
  const subject = subjectRaw as SubjectId;
  const type = typeRaw as ListType;
  const s = getSubject(subject);
  if (!s || !(VALID_TYPES as readonly string[]).includes(type)) notFound();

  const src = sourceFromSlug(type);
  const isAssignments = type === "assignments";
  const title = isAssignments
    ? "עבודות ותרגולים"
    : src
      ? SOURCE_TITLE_HE[src]
      : "";

  const items = isAssignments
    ? assignmentsFor(subject)
    : src
      ? examsFor(subject, src)
      : [];

  if (items.length === 0) notFound();

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: "ראשי", href: "/" },
          { label: s.hebrewTitle, href: `/${subject}` },
          { label: title },
        ]}
      />
      <header className="mt-6">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-base text-text-muted">
          {SUBJECT_TITLE_HE[subject]} · <span className="num">{items.length}</span> פריטים במאגר
        </p>
      </header>

      <div className="mt-8">
        {isAssignments ? (
          <AssignmentListClient items={items as ReturnType<typeof assignmentsFor>} />
        ) : (
          <ExamListClient items={items as ReturnType<typeof examsFor>} />
        )}
      </div>
    </div>
  );
}
