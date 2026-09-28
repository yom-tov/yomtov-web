import { Sigma } from "lucide-react";
import { FormulaForm } from "@/components/admin/FormulaForm";
import { PageHeader } from "@/components/admin/ui/primitives";

export default function NewFormulaPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        icon={<Sigma className="h-5 w-5" />}
        title="נוסחאון חדש"
        description="נוסחאון, סיכום או דף עזר — קובץ PDF אחד."
        back={{ href: "/admin/formulas", label: "לכל הנוסחאונים" }}
      />
      <FormulaForm mode="create" />
    </div>
  );
}
