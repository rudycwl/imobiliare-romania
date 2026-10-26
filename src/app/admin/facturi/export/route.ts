import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { exportCsv, lunaCurenta } from "@/lib/facturare";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await cerePanou();
  const cerut = new URL(req.url).searchParams.get("luna") ?? "";
  const luna = /^\d{4}-\d{2}$/.test(cerut) ? cerut : lunaCurenta();
  return new Response(await exportCsv(luna), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="facturi-cheiamea-${luna}.csv"`,
    },
  });
}
