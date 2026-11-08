import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { readFileSync } from "fs";
import { db } from "./db";
import { anunturiIeftinite, anunturiNoi } from "./anunturi";
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
    const [noi, ieftinite] = await Promise.all([anunturiNoi(f, dupa), anunturiIeftinite(f, dupa)]);
    if (noi.length || ieftinite.length) {
      const site = adresaSite();
      const loc = (a: { zona: string; judet: string; oras: string }) => `${a.zona}, ${getOras(a.judet, a.oras)?.nume ?? a.oras}`;
      const luna = (a: { tranzactie: string }) => (a.tranzactie === "inchiriere" ? "/lună" : "");
      const subiect = noi.length
        ? noi.length === 1 ? `1 anunț nou: ${c.nume}` : `${noi.length >= 10 ? "10+" : noi.length} anunțuri noi: ${c.nume}`
        : ieftinite.length === 1 ? `Preț scăzut la 1 anunț: ${c.nume}` : `Prețuri scăzute la ${ieftinite.length} anunțuri: ${c.nume}`;
      const ok = await trimiteEmail({
        catre: c.utilizator.email!,
        subiect,
        paragrafe: [
          ...(noi.length
            ? [`Au apărut anunțuri noi pentru căutarea ta „${c.nume}”:`, ...noi.map((a) => `• ${a.titlu}, ${loc(a)}: ${euro(a.pret)}${luna(a)}. ${site}/anunt/${a.id}`)]
            : []),
          ...(ieftinite.length
            ? [
                noi.length ? "Și s-au ieftinit:" : `S-au ieftinit anunțuri din căutarea ta „${c.nume}”:`,
                ...ieftinite.map((a) => `• ${a.titlu}, ${loc(a)}: ${euro(a.pret)}${luna(a)} (înainte ${euro(a.pretVechi)}). ${site}/anunt/${a.id}`),
              ]
            : []),
        ],
        buton: { text: "Vezi toate anunțurile", link: site + linkCautare(f) },
        subsol: `Primești acest email pentru că ai salvat căutarea pe CheiaMea. Oprește alerta: ${site}/cont/cautari/oprire?c=${c.id}&s=${semnatura(c.id)}`,
      });
      if (!ok) continue;
      trimise++;
    }
    await db.cautareSalvata.update({ where: { id: c.id }, data: { alertaLa: acum } });
  }
  return { trimise, favorite: await trimiteScaderiFavorite(acum) };
}

const CHEIE_FAVORITE = "alerte-favorite-la";

/** Email cu favoritele care s-au ieftinit de la rularea trecută (una pe zi, odată cu alertele). */
async function trimiteScaderiFavorite(acum: Date) {
  const ultim = await db.setare.findUnique({ where: { cheie: CHEIE_FAVORITE } });
  const dupa = ultim ? new Date(ultim.valoare) : new Date(acum.getTime() - 864e5);
  const scaderi = await db.istoricPret.findMany({
    where: { la: { gt: dupa, lte: acum }, anunt: { expiraLa: { gt: acum }, moderare: "ok", favorite: { some: {} } } },
    select: { anuntId: true },
    distinct: ["anuntId"],
  });
  const peUtilizator = new Map<string, { email: string; anunturi: { id: number; titlu: string; pret: number; vechi: number; tranzactie: string }[] }>();
  for (const { anuntId } of scaderi) {
    const a = await db.anunt.findUnique({
      where: { id: anuntId },
      select: {
        id: true, titlu: true, pret: true, tranzactie: true, proprietarId: true,
        istoricPret: { where: { la: { lte: dupa } }, orderBy: { la: "desc" }, take: 1, select: { pret: true } },
        favorite: { select: { utilizator: { select: { id: true, email: true, stersLa: true } } } },
      },
    });
    const vechi = a?.istoricPret[0]?.pret;
    if (!a || !vechi || a.pret > vechi * 0.99) continue;
    for (const { utilizator: u } of a.favorite) {
      if (!u.email || u.stersLa || u.id === a.proprietarId) continue;
      const x = peUtilizator.get(u.id) ?? { email: u.email, anunturi: [] };
      x.anunturi.push({ id: a.id, titlu: a.titlu, pret: a.pret, vechi, tranzactie: a.tranzactie });
      peUtilizator.set(u.id, x);
    }
  }
  const site = adresaSite();
  let trimise = 0;
  for (const x of peUtilizator.values()) {
    const ok = await trimiteEmail({
      catre: x.email,
      subiect: x.anunturi.length === 1 ? `S-a ieftinit: ${x.anunturi[0].titlu}` : `S-au ieftinit ${x.anunturi.length} anunțuri salvate`,
      paragrafe: [
        "Anunțuri pe care le-ai salvat la favorite au acum un preț mai mic:",
        ...x.anunturi.slice(0, 20).map((a) => `• ${a.titlu}: ${euro(a.pret)}${a.tranzactie === "inchiriere" ? "/lună" : ""} (înainte ${euro(a.vechi)}). ${site}/anunt/${a.id}`),
      ],
      buton: { text: "Vezi favoritele", link: `${site}/cont/favorite` },
      subsol: "Primești acest email pentru că ai salvat anunțurile la favorite pe CheiaMea. Ca să nu mai primești, scoate-le din favorite.",
    });
    if (ok) trimise++;
  }
  await db.setare.upsert({ where: { cheie: CHEIE_FAVORITE }, create: { cheie: CHEIE_FAVORITE, valoare: acum.toISOString() }, update: { valoare: acum.toISOString() } });
  return trimise;
}
