import "server-only";
import type { Prisma } from "@prisma/client";
import type { Anunt, TipProprietate, Tranzactie } from "@/modules/types";
import { db } from "./db";
import { TIPURI, TRANZACTII } from "./etichete";
import { laUtilizator } from "./utilizatori";

export type Filtre = {
  q?: string;
  judet?: string;
  oras?: string;
  tip?: string;
  tranzactie?: string;
  pretMin?: string;
  pretMax?: string;
  camere?: string;
  /** Tipul de vânzător: persoana-fizica | firma | agentie */
  oferit?: string;
  /** Id-ul proprietarului (ex. pagina unei agenții). */
  proprietar?: string;
  sort?: string;
};

const LIMITA = 60;

const cuProprietar = { proprietar: true } satisfies Prisma.AnuntInclude;
type AnuntDb = Prisma.AnuntGetPayload<{ include: typeof cuProprietar }>;

function laAnunt(a: AnuntDb) {
  return {
    ...a,
    tip: a.tip as TipProprietate,
    tranzactie: a.tranzactie as Tranzactie,
    proprietar: laUtilizator(a.proprietar),
  } satisfies Anunt & { proprietar: unknown };
}

export type AnuntCuProprietar = ReturnType<typeof laAnunt>;

function unde(f: Filtre): Prisma.AnuntWhereInput {
  const q = f.q?.trim();
  const pretMin = Number(f.pretMin) || undefined;
  const pretMax = Number(f.pretMax) || undefined;
  const camere = Number(f.camere) || undefined;
  return {
    judet: f.judet || undefined,
    oras: f.oras || undefined,
    tip: f.tip && f.tip in TIPURI ? f.tip : undefined,
    tranzactie: f.tranzactie && f.tranzactie in TRANZACTII ? f.tranzactie : undefined,
    pret: pretMin || pretMax ? { gte: pretMin, lte: pretMax } : undefined,
    camere: camere ? { gte: camere } : undefined,
    proprietarId: f.proprietar || undefined,
    proprietar: f.oferit ? { tip: f.oferit } : undefined,
    OR: q
      ? [{ titlu: { contains: q, mode: "insensitive" } }, { descriere: { contains: q, mode: "insensitive" } }]
      : undefined,
  };
}

/** Întoarce primele anunțuri care corespund filtrelor și numărul lor total. */
export async function cautaAnunturi(f: Filtre, limita = LIMITA) {
  const where = unde(f);
  const orderBy: Prisma.AnuntOrderByWithRelationInput[] =
    f.sort === "pret-asc" ? [{ pret: "asc" }] : f.sort === "pret-desc" ? [{ pret: "desc" }] : [{ publicatLa: "desc" }, { id: "desc" }];
  const [lista, total] = await Promise.all([
    db.anunt.findMany({ where, orderBy, take: limita, include: cuProprietar }),
    db.anunt.count({ where }),
  ]);
  return { anunturi: lista.map(laAnunt), total };
}

export async function getAnunt(id: string) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return null;
  const a = await db.anunt.findUnique({ where: { id: n }, include: cuProprietar });
  return a && laAnunt(a);
}

/** Numărul de anunțuri pe județ sau, dacă e dat județul, pe orașele lui. */
export async function numarAnunturi(judet?: string): Promise<Record<string, number>> {
  const r = judet
    ? await db.anunt.groupBy({ by: ["oras"], where: { judet }, _count: true })
    : await db.anunt.groupBy({ by: ["judet"], _count: true });
  return Object.fromEntries(r.map((x) => ["oras" in x ? x.oras : x.judet, x._count]));
}

export type AnuntNou = Omit<Anunt, "id" | "publicatLa" | "imagine" | "proprietarId">;

export async function creeazaAnunt(proprietarId: string, a: AnuntNou) {
  return db.anunt.create({ data: { ...a, proprietarId, imagine: "#64748b" } });
}

/** Statistici pentru paginile de oraș/județ: număr de anunțuri și prețuri medii (apartamente). */
export async function statisticiZona(judet: string, oras?: string) {
  const zona = { judet, oras: oras || undefined };
  const [vanzare, inchiriere, apVanzare, apChirie] = await Promise.all([
    db.anunt.count({ where: { ...zona, tranzactie: "vanzare" } }),
    db.anunt.count({ where: { ...zona, tranzactie: "inchiriere" } }),
    db.anunt.aggregate({ where: { ...zona, tranzactie: "vanzare", tip: "apartament" }, _sum: { pret: true, suprafata: true }, _count: true }),
    db.anunt.aggregate({ where: { ...zona, tranzactie: "inchiriere", tip: "apartament" }, _avg: { pret: true }, _count: true }),
  ]);
  const s = apVanzare._sum;
  return {
    vanzare,
    inchiriere,
    // Media ponderată: total preț / total suprafață, ca un apartament foarte mare să nu strice media.
    pretMp: apVanzare._count && s.suprafata ? Math.round((s.pret ?? 0) / s.suprafata) : null,
    chirieMedie: apChirie._count ? Math.round(apChirie._avg.pret ?? 0) : null,
  };
}
