import { revalidatePath } from "next/cache";
import { STARI_PLATITE, verificaNotificare } from "@/lib/plati/netopia";
import { plataRespinsa, plataReusita } from "@/lib/plati/comenzi";
import { db } from "@/lib/db";

// Notificarea (IPN) de la NETOPIA despre starea unei plăți. Răspunsul cu errorType 0 confirmă primirea.
const raspuns = (errorType: number, errorMessage = "", status = 200) =>
  Response.json({ errorType, errorCode: errorType ? 1 : null, errorMessage }, { status });

export async function POST(req: Request) {
  const corp = await req.text();
  if (!verificaNotificare(corp, req.headers.get("Verification-token"))) return raspuns(1, "semnatura invalida", 401);
  const n = JSON.parse(corp) as { order?: { orderID?: string }; payment?: { status?: number; ntpID?: string; amount?: number } };
  const id = n.order?.orderID;
  const stare = Number(n.payment?.status);
  if (!id) return raspuns(1, "lipseste orderID", 400);
  const c = await db.comanda.findUnique({ where: { id } });
  if (!c) return raspuns(1, "comanda necunoscuta", 404);
  if (STARI_PLATITE.includes(stare)) {
    if (Math.round(Number(n.payment?.amount) * 100) !== c.sumaBani) return raspuns(1, "suma diferita", 400);
    await plataReusita(id, n.payment?.ntpID ?? null, stare);
    revalidatePath("/", "layout");
  } else if (stare === 12) {
    await plataRespinsa(id, n.payment?.ntpID ?? null, stare);
  } else {
    await db.comanda.update({ where: { id }, data: { stareNetopia: stare } });
  }
  return raspuns(0);
}
