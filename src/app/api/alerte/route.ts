import { cerereDeLaServer, trimiteAlerte } from "@/lib/alerte";

export const dynamic = "force-dynamic";

/** Pornește alertele zilnice. O apelează doar timerul de pe server, cu cheia din /etc/cheiamea/cheie-alerte. */
export async function POST(req: Request) {
  if (!cerereDeLaServer(req)) return Response.json({ eroare: "cheie greșită" }, { status: 401 });
  return Response.json(await trimiteAlerte());
}
