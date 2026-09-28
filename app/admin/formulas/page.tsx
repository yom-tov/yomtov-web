import { readFormulas } from "@/lib/admin/content-io";
import { FormulasListClient } from "./FormulasListClient";

export const dynamic = "force-dynamic";

export default async function AdminFormulasPage() {
  const { data } = await readFormulas();
  return <FormulasListClient items={data} />;
}
