import "server-only";
import { db } from "./db";
import { notaPret } from "./anunturi";
import { cheieProprietate } from "./duplicate";
import { cursEuro } from "./curs";
import { citesteRand } from "./import-masa";
import { aplicaFiltru } from "./moderare";
import { anuntDinPagina, decizii, diferentaPoze, pozeDinSite, type Verificare } from "./import-site-softimobiliar";
import { descarcaPaginaAgentie } from "./pagina-agentie";
import { atasazaPozeDinSite } from "./poze-agentie";
import { MAX_POZE, stergePoza } from "./poze";
import { ZILE_VALABILITATE } from "./tarife";

// Anunțurile importate din link de pe site-ul agenției se recitesc la 3 ore (odată cu feed-urile, /api/feeduri).
// Se actualizează prețul, titlul, descrierea, suprafața, camerele, zona și (doar dacă s-au schimbat) pozele.
// Pagina dispărută de 2 ori la rând → anunțul se retrage (nu se șterge). Site căzut → nu atingem nimic.

/** Cele mai vechi verificări întâi; restul intră la rularea următoare (rotație). */
export const MAX_PE_RULARE = 200;

export type RaportSite = { verificate: number; actualizate: number; retrase: number; lipsa: number; erori: number; poze: number };

export async function actualizeazaDinSite(max = MAX_PE_RULARE): Promise<RaportSite> {
  const rap: RaportSite = { verificate: 0, actualizate: 0, retrase: 0, lipsa: 0, erori: 0, poze: 0 };
  const acum = new Date();
  const lista = await db.anunt.findMany({
    where: {
      sursaLink: { not: null },
      sursaActiva: true,
      expiraLa: { gt: acum },
      moderare: { not: "respins" },
      proprietar: { tip: "agentie", stersLa: null },
    },
    orderBy: { sursaVerificatLa: { sort: "asc", nulls: "first" } },
    take: max,
    select: { id: true, proprietarId: true, sursaLink: true, sursaDisparut: true, sursaPoze: true, pret: true, titlu: true, descriere: true, proprietar: { select: { judet: true, oras: true } } },
  });
  if (!lista.length) return rap;

  // 1. Citim toate paginile (pauza de 1,5 s pe același site e în descarcaPaginaAgentie).
  let curs: number | null | undefined;
  const verificari: { a: (typeof lista)[number]; v: Verificare; sursa: string }[] = [];
  for (const a of lista) {
    let v: Verificare;
    let sursa = a.sursaLink!;
    try {
      const p = await descarcaPaginaAgentie(a.sursaLink!);
      if (p.stare === "disparut") v = { tip: "disparut" };
      else if (p.stare === "interzis") v = { tip: "eroare", motiv: "robots.txt nu mai permite citirea" };
      else {
        sursa = p.final.toString();
        if (curs === undefined && /RON|LEI/i.test(p.html)) curs = await cursEuro().catch(() => null);
        const r = anuntDinPagina(p.html, sursa, { cursEuro: curs ?? null, judet: a.proprietar.judet, oras: a.proprietar.oras });
        if ("rand" in r) v = { tip: "ok", externId: r.externId, rand: r.rand };
        // Pagina există, dar nu mai e anunț (lista sau prima pagină sub același link) = anunț dispărut.
        else if (/nu e un anunț|nu are cod/.test(r.eroare)) v = { tip: "disparut" };
        else v = { tip: "eroare", motiv: r.eroare };
      }
    } catch (e) {
      v = { tip: "eroare", motiv: e instanceof Error ? e.message : String(e) };
    }
    verificari.push({ a, v, sursa });
  }

  // 2. Decidem pe agenție (protecția la >30% eșecuri) și aplicăm.
  const ce = decizii(verificari.map(({ a, v }) => ({ anuntId: a.id, proprietarId: a.proprietarId, lipsuriInainte: a.sursaDisparut, v })));
  for (const { a, v, sursa } of verificari) {
    rap.verificate++;
    const d = ce.get(a.id);
    const azi = new Date();
    if (d === "retrage") {
      await db.anunt.update({ where: { id: a.id }, data: { expiraLa: azi, sursaVerificatLa: azi, sursaStare: "retras", sursaDisparut: { increment: 1 } } });
      rap.retrase++;
    } else if (d === "noteaza-disparut") {
      await db.anunt.update({ where: { id: a.id }, data: { sursaVerificatLa: azi, sursaStare: "disparut", sursaDisparut: { increment: 1 } } });
      rap.lipsa++;
    } else if (d === "actualizeaza" && v.tip === "ok") {
      const r = citesteRand(v.rand);
      if ("eroare" in r) {
        await db.anunt.update({ where: { id: a.id }, data: { sursaVerificatLa: azi, sursaStare: "eroare" } });
        rap.erori++;
        continue;
      }
      // Preț în lei: diferențele sub 2% vin din curs, nu din prețul agenției.
      const pret = v.rand.moneda === "RON" && Math.abs(r.date.pret - a.pret) < a.pret * 0.02 ? a.pret : r.date.pret;
      const date = { titlu: r.date.titlu, descriere: r.date.descriere, pret, suprafata: r.date.suprafata, camere: r.date.camere, zona: r.date.zona };
      const vechi = await db.anunt.findUniqueOrThrow({ where: { id: a.id }, select: { judet: true, oras: true, tip: true, tranzactie: true } });
      await db.anunt.update({
        where: { id: a.id },
        data: {
          ...date,
          cheieProprietate: cheieProprietate({ ...vechi, camere: date.camere, zona: date.zona }),
          // Cât timp anunțul e pe site-ul agenției, rămâne public (ca la feed).
          expiraLa: new Date(Date.now() + ZILE_VALABILITATE * 864e5),
          sursaVerificatLa: azi,
          sursaStare: "ok",
          sursaDisparut: 0,
        },
      });
      if (pret !== a.pret) await notaPret(a.id, pret);
      if (date.titlu !== a.titlu || date.descriere !== a.descriere) await aplicaFiltru(a.id, date.titlu, date.descriere);
      rap.actualizate++;

      // Pozele: doar dacă galeria s-a schimbat față de pozele preluate de pe site.
      const existente = await db.poza.findMany({ where: { anuntId: a.id }, select: { id: true, sursaUrl: true } });
      const noi = pozeDinSite(v.rand.poze.split(/\s+/), sursa, 100);
      const dif = diferentaPoze(existente, a.sursaPoze ? a.sursaPoze.split(" ") : null, noi, MAX_POZE);
      await db.anunt.update({ where: { id: a.id }, data: { sursaPoze: noi.join(" ") } });
      for (const id of dif.deSters) await stergePoza(a.id, id);
      if (dif.deAdaugat.length) rap.poze += await atasazaPozeDinSite(a.id, sursa, dif.deAdaugat, existente.length - dif.deSters.length);
      rap.poze += dif.deSters.length;
    } else {
      // Site-ul nu răspunde, eroare sau protecția agenției: doar notăm verificarea (pentru rotație).
      await db.anunt.update({ where: { id: a.id }, data: { sursaVerificatLa: azi, sursaStare: v.tip === "ok" ? "ok" : "eroare" } });
      rap.erori++;
    }
  }
  return rap;
}
