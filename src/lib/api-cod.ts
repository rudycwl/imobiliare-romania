import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { anunturiActive, creeazaAnunt, limitaAnunturi, notaPret } from "./anunturi";
import { randDinJson } from "./api-format";
import { cheieProprietate } from "./duplicate";
import { citesteRand, descarcaPoza, importaRanduri } from "./import-masa";
import { aplicaFiltru } from "./moderare";
import { adaugaPoza, cheieNoua, CULOARE_FARA_POZA, MAX_POZE, stergePoza } from "./poze";
import { salveazaLocal, stocareLocala, urlPublic } from "./stocare";
import { ZILE_VALABILITATE } from "./tarife";

// API-ul agențiilor cu „cod”: identificatorul anunțului în programul agenției (CRM), ca la feed-ul XML (Anunt.externId).
// Rudy 17.11.2026 („OK cod API”): la teste, un anunț retrimis cu alt preț devenea dublură, iar unul retras sau expirat
// nu mai putea fi republicat („există deja”). Cu „cod”:
//   - cod nou pentru cont → anunț nou;
//   - cod existent al aceluiași cont → același anunț se ACTUALIZEAZĂ (preț, titlu, descriere, poze, caracteristici)
//     și, dacă era retras sau expirat, se REACTIVEAZĂ (doar dacă mai e loc în limita abonamentului);
//   - același cod la alt cont → alt anunț (codul e unic doar în contul agenției: @@unique([proprietarId, externId])).
// Fără „cod”, totul rămâne ca înainte (importaRanduri: același titlu și preț nu se dublează).

export const MAX_COD = 100;

const peste = (zile: number) => new Date(Date.now() + zile * 864e5);

/** Codul din anunțul JSON: null = fără cod (comportamentul vechi); text sau număr, maximum 100 de caractere. */
export function codDin(a: unknown): string | null | { eroare: string } {
  if (!a || typeof a !== "object" || Array.isArray(a)) return null;
  const v = (a as Record<string, unknown>).cod;
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v !== "string") return { eroare: "„cod” trebuie să fie text sau număr" };
  const cod = v.trim();
  if (!cod) return null;
  if (cod.length > MAX_COD) return { eroare: `„cod” are peste ${MAX_COD} de caractere` };
  return cod;
}

export type DecizieCod = "creeaza" | "actualizeaza" | "reactiveaza" | "limita" | "respins";

/**
 * Ce facem cu un anunț trimis cu cod. `existent`: anunțul contului cu același cod (sau null);
 * `locuri`: câte anunțuri mai pot fi active în limita abonamentului.
 * Actualizarea unui anunț activ nu ocupă loc nou; crearea și reactivarea da.
 */
export function decizieCod(existent: { expiraLa: Date; moderare: string } | null, locuri: number, acum = new Date()): DecizieCod {
  if (!existent) return locuri > 0 ? "creeaza" : "limita";
  if (existent.moderare === "respins") return "respins";
  if (existent.expiraLa > acum) return "actualizeaza";
  return locuri > 0 ? "reactiveaza" : "limita";
}

export type RezultatApi = {
  publicate: { rand: number; id: number; cod?: string }[];
  actualizate: { rand: number; id: number; cod: string; reactivat: boolean }[];
  cuPoze: number;
  sarite: { rand: number; motiv: string }[];
  oprit?: string;
};

/**
 * După unirea caracteristicilor dedicate (PR #137), citesteRand întoarce și `caracteristici` (din câmpurile trimise)
 * și `extrase` (din descriere). Pe main ele se citesc din descriere la afișare, deci ajunge actualizarea descrierii.
 */
function caracteristici(citit: object, nou: boolean): object {
  const c = citit as { caracteristici?: object; extrase?: object };
  return nou ? { ...c.extrase, ...c.caracteristici } : { ...c.caracteristici };
}

const mesajLimita = (limita: number | null) =>
  `Ai ajuns la limita abonamentului (${limita} anunțuri active). Anunțurile noi sau retrase nu au fost publicate; cele active s-au actualizat. Alege un abonament mai mare din „Abonament”.`;

/**
 * Pozele trimise prin API sunt lista completă: cele noi se descarcă, cele scoase din listă se șterg, ordinea e cea din listă.
 * Pozele puse de mână pe site (fără link-sursă) rămân. Lista goală sau lipsă = pozele nu se ating.
 * Întoarce true dacă anunțul are acum cel puțin o poză venită prin API.
 */
export async function sincronizeazaPoze(anuntId: number, urluri: string[]): Promise<boolean> {
  if (!urluri.length || !stocareLocala()) return false;
  const existente = await db.poza.findMany({ where: { anuntId }, select: { id: true, sursaUrl: true } });
  const dinSursa = new Map(existente.filter((p) => p.sursaUrl).map((p) => [p.sursaUrl!, p.id]));
  const deSters = [...dinSursa].filter(([url]) => !urluri.includes(url)).map(([, id]) => id);
  const manuale = existente.length - dinSursa.size;
  let loc = MAX_POZE - manuale - (dinSursa.size - deSters.length);
  // Întâi descărcăm pozele noi: dacă site-ul agenției nu răspunde, păstrăm pozele vechi.
  const noi: { url: string; date: Buffer; tip: string }[] = [];
  for (const url of urluri) {
    if (loc <= 0) break;
    if (dinSursa.has(url)) continue;
    const p = await descarcaPoza(url).catch(() => null);
    if (p) noi.push({ url, ...p }), loc--;
  }
  const pastrate = urluri.filter((u) => dinSursa.has(u)).length;
  if (!noi.length && !pastrate) return false;
  for (const id of deSters) await stergePoza(anuntId, id);
  for (const p of noi) {
    const cheie = cheieNoua(anuntId, p.tip);
    await salveazaLocal(cheie, p.date);
    await adaugaPoza(anuntId, cheie, p.url);
  }
  // Ordinea din listă (prima = coperta); pozele de mână vin după ele.
  const acum = await db.poza.findMany({ where: { anuntId }, select: { id: true, sursaUrl: true, ordine: true } });
  for (const p of acum) {
    const i = p.sursaUrl ? urluri.indexOf(p.sursaUrl) : -1;
    const ordine = i >= 0 ? i : p.ordine >= MAX_POZE ? p.ordine : MAX_POZE + Math.max(0, p.ordine);
    if (ordine !== p.ordine) await db.poza.update({ where: { id: p.id }, data: { ordine } });
  }
  // Coperta (Anunt.imagine) e prima poză după reordonare.
  const prima = await db.poza.findFirst({ where: { anuntId }, orderBy: [{ ordine: "asc" }, { id: "asc" }] });
  const imagine = prima ? `url("${urlPublic(prima.cheie)}") center / cover no-repeat ${CULOARE_FARA_POZA}` : CULOARE_FARA_POZA;
  await db.anunt.update({ where: { id: anuntId }, data: { imagine } });
  return true;
}

const campuriExistent = {
  id: true, expiraLa: true, moderare: true, titlu: true, descriere: true, pret: true, judet: true, oras: true, zona: true, punctProprietar: true,
} satisfies Prisma.AnuntSelect;

/** POST /api/v1/anunturi: anunțurile cu cod se creează sau se actualizează; cele fără cod merg ca înainte. */
export async function publicaPrinApi(utilizatorId: string, lista: unknown[]): Promise<RezultatApi> {
  const rez: RezultatApi = { publicate: [], actualizate: [], cuPoze: 0, sarite: [] };
  const limita = await limitaAnunturi(utilizatorId);
  let locuri = limita === null ? Infinity : limita - (await anunturiActive(utilizatorId));
  const faraCod: { rand: number; date: Record<string, string> }[] = [];
  const vazute = new Set<string>();

  for (const [i, item] of lista.entries()) {
    const rand = i + 1;
    const cod = codDin(item);
    if (cod === null) {
      faraCod.push({ rand, date: randDinJson(item) });
      continue;
    }
    if (typeof cod !== "string") {
      rez.sarite.push({ rand, motiv: cod.eroare });
      continue;
    }
    if (vazute.has(cod)) {
      rez.sarite.push({ rand, motiv: `codul „${cod}” apare de două ori în aceeași cerere` });
      continue;
    }
    vazute.add(cod);
    const citit = citesteRand(randDinJson(item));
    if ("eroare" in citit) {
      rez.sarite.push({ rand, motiv: citit.eroare });
      continue;
    }

    // Anunțul cu acest cod; altfel unul publicat mai demult fără cod, cu același titlu și preț (îl legăm de cod, nu-l dublăm).
    const existent =
      (await db.anunt.findUnique({ where: { proprietarId_externId: { proprietarId: utilizatorId, externId: cod } }, select: campuriExistent })) ??
      (await db.anunt.findFirst({
        where: { proprietarId: utilizatorId, externId: null, titlu: citit.date.titlu, pret: citit.date.pret },
        orderBy: { id: "desc" },
        select: campuriExistent,
      }));

    const decizie = decizieCod(existent, locuri);
    if (decizie === "respins") {
      rez.sarite.push({ rand, motiv: "anunțul cu acest cod a fost respins de moderare; scrieți-ne la agentii@cheiamea.ro" });
      continue;
    }
    if (decizie === "limita") {
      rez.oprit = mesajLimita(limita);
      rez.sarite.push({ rand, motiv: `limita abonamentului (${limita} anunțuri active)` });
      continue;
    }

    if (decizie === "creeaza") {
      let id: number;
      try {
        const a = await creeazaAnunt(
          utilizatorId,
          { ...citit.date, ...caracteristici(citit, true), externId: cod } as typeof citit.date,
          { lat: null, lng: null, punctProprietar: false },
        );
        id = a.id;
      } catch (e) {
        // Două cereri simultane cu același cod: a doua găsește codul ocupat.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          rez.sarite.push({ rand, motiv: `codul „${cod}” se publică chiar acum într-o altă cerere; retrimiteți peste câteva secunde` });
          continue;
        }
        throw e;
      }
      await aplicaFiltru(id, citit.date.titlu, citit.date.descriere);
      locuri--;
      rez.publicate.push({ rand, id, cod });
      if (await sincronizeazaPoze(id, citit.poze)) rez.cuPoze++;
      continue;
    }

    // actualizeaza / reactiveaza
    const ex = existent!;
    const locSchimbat = ex.judet !== citit.date.judet || ex.oras !== citit.date.oras || ex.zona !== citit.date.zona;
    await db.anunt.update({
      where: { id: ex.id },
      data: {
        ...citit.date,
        ...caracteristici(citit, false),
        externId: cod,
        cheieProprietate: cheieProprietate(citit.date),
        // Cât timp agenția îl retrimite, anunțul rămâne public încă 60 de zile (ca la feed).
        expiraLa: peste(ZILE_VALABILITATE),
        // Alt cartier: punctul găsit de noi se recalculează (geocodarea completează coordonatele goale).
        ...(locSchimbat && !ex.punctProprietar ? { lat: null, lng: null } : {}),
      },
    });
    if (ex.pret !== citit.date.pret) await notaPret(ex.id, citit.date.pret);
    if (ex.titlu !== citit.date.titlu || ex.descriere !== citit.date.descriere) await aplicaFiltru(ex.id, citit.date.titlu, citit.date.descriere);
    if (decizie === "reactiveaza") locuri--;
    rez.actualizate.push({ rand, id: ex.id, cod, reactivat: decizie === "reactiveaza" });
    if (await sincronizeazaPoze(ex.id, citit.poze)) rez.cuPoze++;
  }

  if (faraCod.length) {
    const r = await importaRanduri(utilizatorId, faraCod.map((f) => f.date), 0);
    for (const p of r.publicate ?? []) rez.publicate.push({ rand: faraCod[p.rand].rand, id: p.id });
    for (const s of r.sarite) rez.sarite.push({ rand: faraCod[s.rand].rand, motiv: s.motiv });
    rez.cuPoze += r.cuPoze;
    if (r.oprit) rez.oprit = r.oprit;
  }
  rez.publicate.sort((a, b) => a.rand - b.rand);
  rez.sarite.sort((a, b) => a.rand - b.rand);
  return rez;
}
