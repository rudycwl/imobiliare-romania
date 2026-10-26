import "server-only";
import { lookup } from "dns/promises";
import { isIP } from "net";
import { db } from "./db";
import { slugify, TIPURI, TRANZACTII } from "./etichete";
import { getJudet, getOras } from "./geo";
import { JUDETE } from "@/modules/judete";
import { anunturiActive, creeazaAnunt, limitaAnunturi, type AnuntNou } from "./anunturi";
import { aplicaFiltru } from "./moderare";
import { LUNGIME } from "./lungimi";
import { adaugaPoza, cheieNoua, MAX_POZE } from "./poze";
import { salveazaLocal, stocareLocala } from "./stocare";

// Importul în masă pentru agenții: un fișier CSV (salvat din Excel sau exportat din programul agenției),
// un rând pe anunț. Coloanele sunt cele din public/model-import-cheiamea.csv; ordinea nu contează.

export const MAX_RANDURI = 500;
/** Pozele din import nu trec prin micșorarea din browser, deci acceptăm fișiere mai mari decât la încărcarea manuală. */
const MAX_POZA_IMPORT = 6 * 1024 * 1024;

export type RezultatImport = {
  importate: number;
  cuPoze: number;
  sarite: { rand: number; motiv: string }[];
  oprit?: string;
  /** Numărul anunțului creat pentru fiecare rând publicat (API-ul îl întoarce, ca programul agenției să-l poată retrage mai târziu). */
  publicate?: { rand: number; id: number }[];
};

/** CSV cu „;” (Excel în română) sau „,”, cu ghilimele și rânduri noi în interiorul câmpurilor. */
export function citesteCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, "");
  const primul = t.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primul.match(/;/g)?.length ?? 0) >= (primul.match(/,/g)?.length ?? 0) ? ";" : ",";
  const randuri: string[][] = [];
  let rand: string[] = [];
  let camp = "";
  let inGhilimele = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inGhilimele) {
      if (c === '"' && t[i + 1] === '"') (camp += '"'), i++;
      else if (c === '"') inGhilimele = false;
      else camp += c;
    } else if (c === '"') inGhilimele = true;
    else if (c === sep) rand.push(camp), (camp = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      rand.push(camp), (camp = "");
      if (rand.some((x) => x.trim())) randuri.push(rand);
      rand = [];
    } else camp += c;
  }
  rand.push(camp);
  if (rand.some((x) => x.trim())) randuri.push(rand);
  return randuri;
}

/** Acceptă atât codul („apartament”), cât și eticheta („Casă / vilă”, „casa”). */
function gasesteCheie<T extends string>(lista: Record<T, string>, v: string): T | null {
  const s = slugify(v);
  if (!s) return null;
  for (const [k, eticheta] of Object.entries(lista) as [T, string][]) {
    if (k === s || slugify(eticheta) === s || slugify(eticheta).startsWith(s + "-")) return k;
  }
  return null;
}

function gasesteLoc(judetText: string, orasText: string) {
  const sj = slugify(judetText).replace(/^judetul-/, "");
  const judet = getJudet(sj) ?? JUDETE.find((j) => slugify(j.nume) === sj || j.cod.toLowerCase() === sj);
  if (!judet) return null;
  const so = slugify(orasText).replace(/^(municipiul|orasul|oras)-/, "");
  const oras = getOras(judet.slug, so) ?? judet.orase.find((o) => slugify(o.nume) === so);
  return oras ? { judet: judet.slug, oras: oras.slug } : null;
}

const numar = (v: string) => Number(v.replace(/[\s.€]/g, "").replace(",", "."));

function citesteRand(r: Record<string, string>): { eroare: string } | { date: AnuntNou; poze: string[] } {
  const tip = gasesteCheie(TIPURI, r.tip ?? "");
  const tranzactie = gasesteCheie(TRANZACTII, r.tranzactie ?? "");
  const titlu = (r.titlu ?? "").trim().slice(0, LUNGIME.titlu);
  const pret = numar(r.pret ?? "");
  const suprafata = numar(r.suprafata ?? "");
  const loc = gasesteLoc(r.judet ?? "", r.oras ?? "");
  if (!tip) return { eroare: `tipul „${r.tip ?? ""}” nu e recunoscut (ex. apartament, casa, teren)` };
  if (!tranzactie) return { eroare: `tranzacția „${r.tranzactie ?? ""}” nu e recunoscută (vanzare sau inchiriere)` };
  if (titlu.length < 10) return { eroare: "titlul are sub 10 caractere" };
  if (!(pret > 0) || !(suprafata > 0)) return { eroare: "prețul sau suprafața lipsesc" };
  if (!loc) return { eroare: `localitatea „${r.oras ?? ""}, ${r.judet ?? ""}” nu e în lista site-ului` };
  return {
    date: {
      titlu,
      descriere: (r.descriere ?? "").trim().slice(0, LUNGIME.descriere),
      tip,
      tranzactie,
      pret: Math.round(pret),
      suprafata: Math.round(suprafata),
      camere: Math.round(numar(r.camere ?? "")) || null,
      judet: loc.judet,
      oras: loc.oras,
      zona: (r.zona ?? "").trim().slice(0, LUNGIME.zona) || "Centru",
    },
    poze: (r.poze ?? "").split(/[\s|]+/).filter((u) => /^https:\/\//i.test(u)).slice(0, MAX_POZE),
  };
}

/** Doar adrese publice: serverul nu trebuie să poată fi folosit pentru a citi adrese din rețeaua internă. */
function ipPrivat(ip: string) {
  if (isIP(ip) === 6) return /^(::1?$|f[cd]|fe80|::ffff:(10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\.)/i.test(ip);
  return /^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01])|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\./.test(ip);
}

async function descarcaPoza(url: string): Promise<{ date: Buffer; tip: string } | null> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const adrese = await lookup(u.hostname, { all: true }).catch(() => []);
  if (!adrese.length || adrese.some((a) => ipPrivat(a.address))) return null;
  const r = await fetch(u, { redirect: "error", signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r?.ok) return null;
  const tip = (r.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const tipBun = tip === "image/jpg" ? "image/jpeg" : tip;
  if (tipBun !== "image/jpeg" && tipBun !== "image/webp") return null;
  if (Number(r.headers.get("content-length") ?? 0) > MAX_POZA_IMPORT) return null;
  const date = Buffer.from(await r.arrayBuffer());
  return date.length && date.length <= MAX_POZA_IMPORT ? { date, tip: tipBun } : null;
}

export async function importaCsv(utilizatorId: string, text: string): Promise<RezultatImport> {
  const randuri = citesteCsv(text);
  const antet = (randuri.shift() ?? []).map((h) => slugify(h));
  if (!antet.includes("titlu") || !antet.includes("pret")) return { importate: 0, cuPoze: 0, sarite: [], oprit: "Prima linie a fișierului trebuie să conțină numele coloanelor (titlu, pret, …). Folosește modelul de mai sus." };
  if (randuri.length > MAX_RANDURI) return { importate: 0, cuPoze: 0, sarite: [], oprit: `Fișierul are ${randuri.length} anunțuri. Maximum ${MAX_RANDURI} odată: împarte-l în mai multe fișiere.` };
  return importaRanduri(
    utilizatorId,
    randuri.map((valori) => Object.fromEntries(antet.map((h, j) => [h, valori[j] ?? ""]))),
    2,
  );
}

/** Rândurile au aceleași coloane ca fișierul model; primulRand e numărul afișat pentru primul (2 în CSV, după antet; 1 în API). */
export async function importaRanduri(utilizatorId: string, randuri: Record<string, string>[], primulRand: number): Promise<RezultatImport> {
  const limita = await limitaAnunturi(utilizatorId);
  let locuri = limita === null ? Infinity : limita - (await anunturiActive(utilizatorId));
  // Anunțurile deja publicate (același titlu și preț) nu se dublează la un al doilea import.
  const existente = new Set(
    (await db.anunt.findMany({ where: { proprietarId: utilizatorId }, select: { titlu: true, pret: true } })).map((a) => `${a.titlu}|${a.pret}`),
  );

  const rez: RezultatImport = { importate: 0, cuPoze: 0, sarite: [], publicate: [] };
  for (const [i, r] of randuri.entries()) {
    const nrRand = i + primulRand;
    const citit = citesteRand(r);
    if ("eroare" in citit) {
      rez.sarite.push({ rand: nrRand, motiv: citit.eroare });
      continue;
    }
    if (existente.has(`${citit.date.titlu}|${citit.date.pret}`)) {
      rez.sarite.push({ rand: nrRand, motiv: "există deja un anunț cu același titlu și preț" });
      continue;
    }
    if (locuri <= 0) {
      rez.oprit = `Ai ajuns la limita abonamentului (${limita} anunțuri active). Restul rândurilor nu au fost importate; alege un abonament mai mare din „Abonament”.`;
      break;
    }
    const a = await creeazaAnunt(utilizatorId, citit.date, { lat: null, lng: null, punctProprietar: false });
    await aplicaFiltru(a.id, citit.date.titlu, citit.date.descriere);
    existente.add(`${citit.date.titlu}|${citit.date.pret}`);
    locuri--;
    rez.importate++;
    rez.publicate?.push({ rand: nrRand, id: a.id });
    if (stocareLocala() && citit.poze.length) {
      let puse = 0;
      for (const url of citit.poze) {
        const p = await descarcaPoza(url).catch(() => null);
        if (!p) continue;
        const cheie = cheieNoua(a.id, p.tip);
        await salveazaLocal(cheie, p.date);
        await adaugaPoza(a.id, cheie);
        puse++;
      }
      if (puse) rez.cuPoze++;
    }
  }
  return rez;
}
