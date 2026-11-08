import { cerereDeLaServer } from "@/lib/alerte";
import { ruleazaFeeduri } from "@/lib/feeduri";

export const dynamic = "force-dynamic";

/** Citește feed-urile agențiilor. O apelează doar timerul de pe server (cheiamea-feeduri.timer), cu cheia din /etc/cheiamea/cheie-alerte. */
export async function POST(req: Request) {
  if (!cerereDeLaServer(req)) return Response.json({ eroare: "cheie greșită" }, { status: 401 });
  return Response.json(await ruleazaFeeduri());
}
