import { requireCompanyAdmin } from "@/lib/auth";
import { buildCsvTemplate } from "@/lib/csv";

export async function GET() {
  await requireCompanyAdmin();
  const csv = `\uFEFF${buildCsvTemplate()}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="distribpro-modele-produits.csv"',
      "Cache-Control": "no-store",
    },
  });
}
