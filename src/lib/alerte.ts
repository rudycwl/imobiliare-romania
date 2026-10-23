import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { readFileSync } from "fs";
import { db } from "./db";
import { anunturiNoi } from "./anunturi";
import { curataFiltre, linkCautare } from "./cautari";
import { getOras } from "./geo";
import { adresaSite, emailConfigurat, trimiteEmail } from "./email";

// Alerta zilnică: pentru fiecare căutare salvată cu alerta pornită, un email cu anunțurile noi de la ultima alertă.
// Pe serverul Oracle o pornește cheiamea-alerte.timer, în fiecare dimineață, cu cheia din /etc/cheiamea/cheie-alerte.

/** Cheia cu care timerul pornește alertele și cu care se semnează linkurile de oprire din email. */
export function cheieAlerte(): string | null {
  const dinEnv = process.env.ALERTE_CHEIE?.trim();
  if (dinEnv) return dinEnv;
  try {
    return readFileSync("/etc/cheiamea/cheie-alerte", "utf8").trim() || null;
  } catch {
    return null;
  }
}

/** Cererile de la timerele de pe server (alerte, copia pozelor) vin cu cheia în antetul x-cheie. */
export function cerereDeLaServer(req: Request) {
  const k = cheieAlerte();
  const dat = req.headers.get("x-cheie") ?? "";
  return !!k && dat.length === k.length && timingSafeEqual(Buffer.from(dat), Buffer.from(k));
}

export function semnatura(cautareId: number) {
  const k = cheieAlerte();
  return k ? createHmac("sha256", k).update(`oprire-alerta:${cautareId}`).digest("base64url").slice(0, 32) : null;
}

export function semnaturaBuna(cautareId: number, s: string) {
  const bun = semnatura(cautareId);
  return !!bun && bun.length === s.length && timingSafeEqual(Buffer.from(bun), Buffer.from(s));
}

const euro = (n: number) => new Intl.NumberFormat("ro-RO").format(n) + " €";

export async function trimiteAlerte() {
  if (!emailConfigurat()) return { trimise: 0, motiv: "lipsește BREVO_API_KEY" };
  const acum = new Date();
  const cautari = await db.cautareSalvata.findMany({
    where: { alertaEmail: true, utilizator: { stersLa: null, email: { not: null } } },
    include: { utilizator: { select: { email: true } } },
  });
  let trimise = 0;
  for (const c of cautari) {
    const f = curataFiltre(c.filtre as Record<string, unknown>);
    // Anunțurile de la ultima alertă sau de la ultima vizită pe căutare, care e mai recentă.
    const dupa = c.vazutLa > c.alertaLa ? c.vazutLa : c.alertaLa;
    const noi = await anunturiNoi(f, dupa);
    if (noi.length) {
      const site = adresaSite();
      const ok = await trimiteEmail({
        catre: c.utilizator.email!,
        subiect: noi.length === 1 ? `1 anunț nou: ${c.nume}` : `${noi.length >= 10 ? "10+" : noi.length} anunțuri noi: ${c.nume}`,
        paragrafe: [
          `Au apărut anunțuri noi pentru căutarea ta „${c.nume}”:`,
          ...noi.map((a) => `• ${a.titlu}, ${a.zona}, ${getOras(a.judet, a.oras)?.nume ?? a.oras}: ${euro(a.pret)}${a.tranzactie === "inchiriere" ? "/lună" : ""}. ${site}/anunt/${a.id}`),
        ],
        buton: { text: "Vezi toate anunțurile", link: site + linkCautare(f) },
        subsol: `Primești acest email pentru că ai salvat căutarea pe CheiaMea. Oprește alerta: ${site}/cont/cautari/oprire?c=${c.id}&s=${semnatura(c.id)}`,
      });
      if (!ok) continue;
      trimise++;
    }
    await db.cautareSalvata.update({ where: { id: c.id }, data: { alertaLa: acum } });
  }
  return { trimise };
}
