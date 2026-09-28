import { notFound } from "next/navigation";
import { Sigma } from "lucide-react";
import { readFormulas } from "@/lib/admin/content-io";
import { FormulaForm } from "@/components/admin/FormulaForm";
import { PageHeader } from "@/components/admin/ui/primitives";

export const dynamic = "force-dynamic";

export default async function EditFormulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: encoded } = await params;
  const id = decodeURIComponent(encoded);
  const { data } = await readFormulas();
  const f = data.find((x) => x.id === id);
  if (!f) notFound();
  return (
    <div className="max-w-3xl">
      <PageHeader
        icon={<Sigma className="h-5 w-5" />}
        title="עריכת נוסחאון"
        description={f.title}
        back={{ href: "/admin/formulas", label: "לכל הנוסחאונים" }}
      />
      <FormulaForm mode="edit" initial={f} />
    </div>
  );
}
