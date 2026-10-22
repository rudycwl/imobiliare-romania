import "server-only";
import type { Utilizator as UtilizatorDb } from "@prisma/client";
import type { Utilizator } from "@/modules/types";
import { db } from "./db";

/** Datele publice ale unui cont (fără email și parolă). */
export function laUtilizator(u: UtilizatorDb): Utilizator {
  return {
    id: u.id,
    slug: u.slug,
    nume: u.nume,
    tip: u.tip as Utilizator["tip"],
    telefon: u.telefon,
    judet: u.judet,
    oras: u.oras,
    contact: u.contact,
    cui: u.cui,
    culoare: u.culoare,
    fondator: u.fondator,
  };
}

export async function getAgentie(slug: string) {
  const u = await db.utilizator.findFirst({ where: { slug, tip: "agentie", stersLa: null } });
  return u && laUtilizator(u);
}

export async function getAgentii(judet?: string) {
  const lista = await db.utilizator.findMany({
    where: { tip: "agentie", judet, stersLa: null },
    orderBy: { nume: "asc" },
    include: { _count: { select: { anunturi: { where: { expiraLa: { gt: new Date() } } } } } },
  });
  return lista.map((u) => ({ ...laUtilizator(u), numarAnunturi: u._count.anunturi }));
}
