import { db } from "@/lib/db";
import { semnaturaBuna } from "@/lib/alerte";
import { adresaSite } from "@/lib/email";

/** Linkul „Oprește alerta” din email: merge fără autentificare, dar doar cu semnătura corectă. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = Number(u.searchParams.get("c"));
  const ok = Number.isInteger(id) && semnaturaBuna(id, u.searchParams.get("s") ?? "");
  if (ok) await db.cautareSalvata.updateMany({ where: { id }, data: { alertaEmail: false } });
  return Response.redirect(`${adresaSite()}/cont/cautari?alerta=${ok ? "oprita" : "link-gresit"}`, 303);
}
