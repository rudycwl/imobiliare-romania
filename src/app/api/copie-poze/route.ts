import { cerereDeLaServer } from "@/lib/alerte";
import { copiazaPozele } from "@/lib/copie-poze";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

/** Copia de rezervă a pozelor, pornită noaptea de cheiamea-copie-poze.timer. */
export async function POST(req: Request) {
  if (!cerereDeLaServer(req)) return Response.json({ eroare: "cheie greșită" }, { status: 401 });
  return Response.json(await copiazaPozele());
}
