import "server-only";
import type { Proiect } from "@prisma/client";
import { db } from "./db";
import { unitatiDinJson, type Unitate } from "./proiecte-unitati";
import { stergeObiect, urlPublic } from "./stocare";

// Paginile de proiect ale dezvoltatorilor imobiliari (/proiecte). Le administrează echipa CheiaMea din /admin/proiecte.

export const MAX_POZE_PROIECT = 30;

export type ProiectPublic = Omit<Proiect, "unitati"> & { unitati: Unitate[] };

const cuUnitati = (p: Proiect): ProiectPublic => ({ ...p, unitati: unitatiDinJson(p.unitati) });

/** Proiectele active, cele mai noi primele; opțional doar dintr-un județ. */
export async function proiecteActive(judet?: string, limita = 200) {
  const lista = await db.proiect.findMany({
    where: { activ: true, ...(judet ? { judet } : {}) },
    orderBy: { creatLa: "desc" },
    take: limita,
  });
  return lista.map(cuUnitati);
}

/** Proiectul public după slug; null dacă nu există sau e oprit. */
export async function getProiect(slug: string) {
  const p = await db.proiect.findUnique({ where: { slug } });
  return p?.activ ? cuUnitati(p) : null;
}

export const coperta = (p: { poze: string[] }) => (p.poze[0] ? urlPublic(p.poze[0]) : null);

/** Scoate o poză din proiect și din stocare. */
export async function stergePozaProiect(id: number, cheie: string) {
  const p = await db.proiect.findUnique({ where: { id }, select: { poze: true } });
  if (!p?.poze.includes(cheie)) return;
  await db.proiect.update({ where: { id }, data: { poze: p.poze.filter((c) => c !== cheie) } });
  await stergeObiect(cheie).catch((e) => console.error("Stocare", e));
}
