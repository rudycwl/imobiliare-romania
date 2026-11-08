import "server-only";
import { lookup } from "dns/promises";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { notaPret } from "./anunturi";
import { cheieProprietate } from "./duplicate";
import { cursEuro } from "./curs";
import { adresaSite, trimiteEmail } from "./email";
import { citesteFeed } from "./feed-xml";
import { completeazaCoordonate } from "./geocodare";
import { salveazaIndiceLunar } from "./indice";
import { citesteRand, importaRanduri, ipPrivat } from "./import-masa";
import { aplicaFiltru } from "./moderare";
import { ZILE_VALABILITATE } from "./tarife";

// Feed-urile XML ale agențiilor: serverul le citește la câteva ore (cheiamea-feeduri.timer → /api/feeduri).
// La fiecare rulare: anunțurile noi din feed se publică (aceleași verificări ca la importul din fișier),
// cele care există deja (același cod din CRM) se actualizează, iar cele care nu mai sunt în feed se retrag.

export const MAX_FEEDURI_PE_AGENTIE = 3;
const MAX_ANUNTURI_FEED = 3000;
const MAX_OCTETI = 40 * 1024 * 1024;
const ERORI_PANA_LA_OPRIRE = 5;

export type RaportFeed = {
  gasite: number;
  noi: number;
  actualizate: number;
  retrase: number;
  sarite: { id: string; motiv: string }[];
  eroare?: string;
  avertisment?: string;
};

/** Paginile se regenerează; în afara serverului Next (scripturi, teste) nu e nimic de regenerat. */
function reimprospateaza(...cai: string[]) {
  for (const c of cai) {
    try {
      revalidatePath(c);
    } catch {
      /* rulare în afara Next */
    }
  }
}

const peste = (zile: number) => new Date(Date.now() + zile * 864e5);

/** Adresa feed-ului e acceptată? (http/https, adresă publică, nu rețea internă). Întoarce mesajul de eroare sau null. */
export async function verificaAdresa(raw: string): Promise<string | null> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return "Adresa nu e un link valid (trebuie să înceapă cu https://).";
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return "Adresa trebuie să înceapă cu https:// sau http://.";
  if (u.username || u.password) return "Nu pune utilizator și parolă în link; cere programului un link de feed public.";
  const adrese = await lookup(u.hostname, { all: true }).catch(() => []);
  if (!adrese.length) return `Serverul „${u.hostname}” nu există sau nu răspunde.`;
  if (adrese.some((a) => ipPrivat(a.address))) return "Adresa feed-ului trebuie să fie publică, pe internet.";
  return null;
}

/** Descarcă feed-ul; redirecționările le urmăm doar spre adrese publice (maximum 3). */
async function descarca(url: string): Promise<string> {
  let adresa = url;
  for (let i = 0; i < 4; i++) {
    const gresit = await verificaAdresa(adresa);
    if (gresit) throw new Error(gresit);
    const r = await fetch(adresa, {
      redirect: "manual",
      headers: { "user-agent": "CheiaMea-Feed/1.0 (+https://cheiamea.ro/pentru-agentii/feed)", accept: "application/xml,text/xml,*/*" },
      signal: AbortSignal.timeout(90_000),
    });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      adresa = new URL(r.headers.get("location")!, adresa).toString();
      continue;
    }
    if (!r.ok) throw new Error(`Serverul feed-ului a răspuns cu eroarea ${r.status}.`);
    if (Number(r.headers.get("content-length") ?? 0) > MAX_OCTETI) throw new Error("Feed-ul are peste 40 MB.");
    const date = Buffer.from(await r.arrayBuffer());
    if (date.length > MAX_OCTETI) throw new Error("Feed-ul are peste 40 MB.");
    return new TextDecoder(/encoding=["']?(iso-8859-2|windows-1250)/i.test(date.subarray(0, 200).toString("latin1")) ? "windows-1250" : "utf-8").decode(date);
  }
  throw new Error("Prea multe redirecționări la adresa feed-ului.");
}

/** Rulează un feed și salvează rezultatul. */
export async function ruleazaFeed(feedId: number): Promise<RaportFeed> {
  const feed = await db.feedAgentie.findUniqueOrThrow({ where: { id: feedId }, include: { utilizator: true } });
  const u = feed.utilizator;
  const rap: RaportFeed = { gasite: 0, noi: 0, actualizate: 0, retrase: 0, sarite: [] };
  try {
    if (u.tip !== "agentie" || u.stersLa || !u.emailConfirmatLa) throw new Error("Contul agenției nu e activ sau emailul nu e confirmat.");
    const xml = await descarca(feed.url);
    const citit = citesteFeed(xml, xml.match(/RON|LEI/i) ? await cursEuro() : null);
    const lista = citit.anunturi.slice(0, MAX_ANUNTURI_FEED);
    if (citit.anunturi.length > MAX_ANUNTURI_FEED) rap.avertisment = `Feed-ul are ${citit.anunturi.length} anunțuri; am luat primele ${MAX_ANUNTURI_FEED}.`;
    rap.gasite = lista.length;

    const existente = new Map(
      (
        await db.anunt.findMany({
          where: { proprietarId: u.id, externId: { not: null } },
          select: { id: true, externId: true, pret: true, expiraLa: true, moderare: true, feedId: true, titlu: true, descriere: true },
        })
      ).map((a) => [a.externId!, a]),
    );
    const vazute = new Set<string>();
    const noi: { externId: string; rand: Record<string, string> }[] = [];

    for (const a of lista) {
      if ("eroare" in a) {
        rap.sarite.push({ id: a.externId || "?", motiv: a.eroare });
        continue;
      }
      if (vazute.has(a.externId)) {
        rap.sarite.push({ id: a.externId, motiv: "același cod apare de două ori în feed" });
        continue;
      }
      vazute.add(a.externId);
      const vechi = existente.get(a.externId);
      if (!vechi) {
        noi.push(a);
        continue;
      }
      const r = citesteRand(a.rand);
      if ("eroare" in r) {
        rap.sarite.push({ id: a.externId, motiv: r.eroare });
        continue;
      }
      if (vechi.moderare === "respins") continue;
      // Preț în lei: diferențele sub 2% vin din cursul euro, nu din prețul agenției; nu le notăm ca schimbare de preț.
      if (a.rand.moneda === "RON" && Math.abs(r.date.pret - vechi.pret) < vechi.pret * 0.02) r.date.pret = vechi.pret;
      const textSchimbat = vechi.titlu !== r.date.titlu || vechi.descriere !== r.date.descriere;
      await db.anunt.update({
        where: { id: vechi.id },
        // Cât timp anunțul e în feed, rămâne public (prelungit la fiecare rulare).
        data: { ...r.date, feedId: feed.id, cheieProprietate: cheieProprietate(r.date), expiraLa: peste(ZILE_VALABILITATE) },
      });
      if (vechi.pret !== r.date.pret) await notaPret(vechi.id, r.date.pret);
      if (textSchimbat) await aplicaFiltru(vechi.id, r.date.titlu, r.date.descriere);
      rap.actualizate++;
    }

    if (noi.length) {
      const rez = await importaRanduri(u.id, noi.map((n) => n.rand), 0);
      const dupaPozitie = new Map((rez.publicate ?? []).map((p) => [p.rand, p.id]));
      for (const [i, n] of noi.entries()) {
        const id = dupaPozitie.get(i);
        if (id) {
          await db.anunt.update({ where: { id }, data: { externId: n.externId, feedId: feed.id } });
          rap.noi++;
          continue;
        }
        const motiv = rez.sarite.find((s) => s.rand === i)?.motiv ?? rez.oprit ?? "nepublicat";
        // Anunțul există deja pe site (publicat de mână, cu același titlu și preț): îl legăm de feed, nu-l dublăm.
        if (motiv.startsWith("există deja")) {
          const r = citesteRand(n.rand);
          const gasit =
            "date" in r &&
            (await db.anunt.findFirst({ where: { proprietarId: u.id, externId: null, titlu: r.date.titlu, pret: r.date.pret }, select: { id: true } }));
          if (gasit) {
            await db.anunt.update({ where: { id: gasit.id }, data: { externId: n.externId, feedId: feed.id, expiraLa: peste(ZILE_VALABILITATE) } });
            rap.actualizate++;
            continue;
          }
        }
        rap.sarite.push({ id: n.externId, motiv });
      }
    }

    // Retragem ce a dispărut din feed. Dacă feed-ul vine brusc cu mult mai puține anunțuri (export întrerupt),
    // nu retragem nimic și avertizăm: e mai bine un anunț vândut încă o rulare decât un portofoliu întreg dispărut.
    const dinFeed = [...existente.values()].filter((a) => a.feedId === feed.id && a.expiraLa > new Date());
    const deRetras = dinFeed.filter((a) => !vazute.has(a.externId!));
    if (dinFeed.length >= 10 && vazute.size < dinFeed.length * 0.3) {
      rap.avertisment = `Feed-ul are acum ${vazute.size} anunțuri, față de ${dinFeed.length} înainte. Nu am retras nimic; verifică exportul din program.`;
    } else if (deRetras.length) {
      await db.anunt.updateMany({ where: { id: { in: deRetras.map((a) => a.id) } }, data: { expiraLa: new Date() } });
      rap.retrase = deRetras.length;
    }

    await db.feedAgentie.update({
      where: { id: feed.id },
      data: { ultimaRulare: new Date(), ultimaStare: "ok", raport: { ...rap, sarite: rap.sarite.slice(0, 200) }, eroriLaRand: 0 },
    });
    if (rap.noi || rap.actualizate || rap.retrase) {
      reimprospateaza("/", `/agentii/${u.slug}`);
      if (rap.noi) await completeazaCoordonate(Math.min(rap.noi, 200)).catch(() => undefined);
    }
  } catch (e) {
    rap.eroare = e instanceof Error ? e.message : String(e);
    const erori = feed.eroriLaRand + 1;
    const opreste = erori >= ERORI_PANA_LA_OPRIRE;
    await db.feedAgentie.update({
      where: { id: feed.id },
      data: { ultimaRulare: new Date(), ultimaStare: "eroare", raport: rap, eroriLaRand: erori, activ: opreste ? false : feed.activ },
    });
    if (opreste && u.email) {
      await trimiteEmail({
        catre: u.email,
        subiect: "Feed-ul de anunțuri s-a oprit",
        paragrafe: [
          "Bună ziua,",
          `Feed-ul de anunțuri ${feed.url} a dat eroare de ${erori} ori la rând și l-am oprit, ca să nu retragem anunțuri din greșeală. Anunțurile publicate rămân pe site.`,
          `Ultima eroare: ${rap.eroare}`,
          "După ce rezolvi problema în programul agenției, pornește feed-ul din nou din contul tău.",
        ],
        buton: { text: "Deschide importul de anunțuri", link: `${adresaSite()}/cont/import` },
        raspunsLa: "agentii@cheiamea.ro",
      }).catch(() => false);
    }
  }
  return rap;
}

/** Toate feed-urile active (le pornește timerul de pe server). */
export async function ruleazaFeeduri() {
  await completeazaChei();
  const feeduri = await db.feedAgentie.findMany({ where: { activ: true }, select: { id: true }, orderBy: { ultimaRulare: { sort: "asc", nulls: "first" } } });
  const rezultate: { id: number; raport: RaportFeed }[] = [];
  for (const f of feeduri) rezultate.push({ id: f.id, raport: await ruleazaFeed(f.id) });
  // Tot la 3 ore: fotografia lunii pentru evoluția prețurilor pe cartiere.
  const indice = await salveazaIndiceLunar().catch((e) => ({ eroare: String(e) }));
  return { feeduri: rezultate.length, rezultate, indice };
}

/** Anunțurile vechi (de dinainte de cheia de proprietate) primesc cheia, câte 2000 la o rulare. */
export async function completeazaChei() {
  const lista = await db.anunt.findMany({
    where: { cheieProprietate: null },
    select: { id: true, judet: true, oras: true, zona: true, tip: true, tranzactie: true, camere: true },
    take: 2000,
  });
  for (const a of lista) await db.anunt.update({ where: { id: a.id }, data: { cheieProprietate: cheieProprietate(a) } });
  return lista.length;
}
