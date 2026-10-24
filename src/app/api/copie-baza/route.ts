import { cerereDeLaServer } from "@/lib/alerte";
import { copiazaBaza } from "@/lib/copie-baza";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/** Copia de rezervă a bazei de date, pornită noaptea de cheiamea-copie-baza.timer. */
export async function POST(req: Request) {
  if (!cerereDeLaServer(req)) return Response.json({ eroare: "cheie greșită" }, { status: 401 });
  return Response.json(await copiazaBaza());
}
