// Single source for the icons a subject (category) can use. The admin form,
// its validator and every public renderer read from here, so an icon picked
// in the admin always renders on the site.
import {
  Zap,
  CircuitBoard,
  Binary,
  Sigma,
  Atom,
  Beaker,
  Calculator,
  ClipboardCheck,
  Cpu,
  Radio,
  Lightbulb,
  BookOpen,
} from "lucide-react";

export const SUBJECT_ICON_NAMES = [
  "Zap",
  "CircuitBoard",
  "Binary",
  "Sigma",
  "Atom",
  "Beaker",
  "Calculator",
  "ClipboardCheck",
  "Cpu",
  "Radio",
  "Lightbulb",
  "BookOpen",
] as const;

export type SubjectIconName = (typeof SUBJECT_ICON_NAMES)[number];

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export const SUBJECT_ICONS: Record<SubjectIconName, IconComponent> = {
  Zap,
  CircuitBoard,
  Binary,
  Sigma,
  Atom,
  Beaker,
  Calculator,
  ClipboardCheck,
  Cpu,
  Radio,
  Lightbulb,
  BookOpen,
};

export function subjectIcon(name: string): IconComponent {
  return SUBJECT_ICONS[name as SubjectIconName] ?? Zap;
}
