import { timingSafeEqual } from "crypto";
import { cheieAlerte, trimiteAlerte } from "@/lib/alerte";

export const dynamic = "force-dynamic";

/** Pornește alertele zilnice. O apelează doar timerul de pe server, cu cheia din /etc/cheiamea/cheie-alerte. */
export async function POST(req: Request) {
  const k = cheieAlerte();
  const dat = req.headers.get("x-cheie") ?? "";
  if (!k || dat.length !== k.length || !timingSafeEqual(Buffer.from(dat), Buffer.from(k)))
    return Response.json({ eroare: "cheie greșită" }, { status: 401 });
  return Response.json(await trimiteAlerte());
}
