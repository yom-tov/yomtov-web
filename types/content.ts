export type SubjectId = "electricity" | "analog" | "digital";
export type Season = "summer" | "spring" | "winter" | "fall" | null;
export type ExamVersion = "a" | "b" | "combined" | null;
export type ExamSource = "mahat" | "education";

export interface Subject {
  id: SubjectId;
  hebrewTitle: string;
  description: string;
  icon: string;
  color: string;
  hebrewOriginalPath: string;
}

export interface FileRef {
  url: string;
  path: string;
  sizeBytes: number | null;
  id: string;
}

export interface Exam {
  id: string;
  slug: string;
  subject: SubjectId;
  source: ExamSource;
  title: string;
  year: number | null;
  season: Season;
  version: ExamVersion;
  topic?: string | null;
  exam: FileRef;
  solution: FileRef | null;
  originalListUrl: string;
  originalDetailUrl: string | null;
}

export interface Assignment {
  id: string;
  slug: string;
  subject: SubjectId;
  title: string;
  topic?: string | null;
  files: FileRef[];
  originalListUrl: string;
  originalDetailUrl: string | null;
}

export interface Lab {
  id: string;
  slug: string;
  title: string;
  description?: string;
  files: FileRef[];
}

export type SearchItem =
  | {
      id: string;
      type: "exam-mahat" | "exam-education";
      title: string;
      subject: SubjectId;
      year: number | null;
      season: Season;
      version: ExamVersion;
      url: string;
    }
  | {
      id: string;
      type: "assignment";
      title: string;
      subject: SubjectId;
      url: string;
    };
