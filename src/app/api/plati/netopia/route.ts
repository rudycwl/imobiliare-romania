import { revalidatePath } from "next/cache";
import { STARI_PLATITE, verificaNotificare } from "@/lib/plati/netopia";
import { confirmaDinNetopia, plataRespinsa, plataReusita } from "@/lib/plati/comenzi";
import { db } from "@/lib/db";

// Notificarea (IPN) de la NETOPIA despre starea unei plăți. Răspunsul cu errorType 0 confirmă primirea.
const raspuns = (errorType: number, errorMessage = "", status = 200) =>
  Response.json({ errorType, errorCode: errorType ? 1 : null, errorMessage }, { status });

export async function POST(req: Request) {
  const corp = await req.text();
  let n: { order?: { orderID?: string }; payment?: { status?: number; ntpID?: string; amount?: number } };
  try {
    n = JSON.parse(corp);
  } catch {
    return raspuns(1, "corp invalid", 400);
  }
  const id = n.order?.orderID;
  const stare = Number(n.payment?.status);
  if (!id) return raspuns(1, "lipseste orderID", 400);
  const c = await db.comanda.findUnique({ where: { id } });
  if (!c) return raspuns(1, "comanda necunoscuta", 404);
  if (!verificaNotificare(corp, req.headers.get("Verification-token"))) {
    // Nu ne bazăm pe conținutul unei notificări neverificate: întrebăm direct NETOPIA cu cheia API.
    const ntpID = c.ntpID ?? n.payment?.ntpID ?? null;
    const st = await confirmaDinNetopia({ ...c, ntpID });
    if (st === "noua") return raspuns(1, "semnatura invalida", 401);
    if (st === "platita") revalidatePath("/", "layout");
    return raspuns(0);
  }
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
