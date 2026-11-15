// Rapoarte automate de erori: când o pagină a site-ului crapă (pe server sau în browser), eroarea se păstrează aici
// și ERP-ul Hugetech o citește la 10 minute prin GET /api/erp/erori (Rudy, 15.11.2026: fără emailuri, fără forward-uri).
// Fără „server-only”: modulul e încărcat și din src/instrumentation.ts.
//
// Păstrare: un inel în memorie (cel mult MAX_ERORI erori distincte, cu numărul de apariții, prima și ultima dată)
// și un fișier jsonl în os.tmpdir(), ca lista să rămână după o repornire a aplicației (nu după o repornire a serverului).
// Fără date personale: adresa paginii fără parametri, emailurile, telefoanele și IP-urile din mesaje se înlocuiesc.

import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const MAX_ERORI = 200;
const MAX_LINII = 2000;

export type Eroare = { mesaj: string; unde: string; detalii?: string; sursa: "server" | "browser" };
export type EroarePastrata = {
  id: string;
  sursa: Eroare["sursa"];
  unde: string;
  mesaj: string;
  detalii: string | null;
  numar: number;
  prima: string;
  ultima: string;
};

type Stare = { erori: Map<string, EroarePastrata>; fisier: string; incarcat: boolean; linii: number };
const g = globalThis as unknown as { __erori?: Stare };
// Pe globalThis: instrumentation.ts și rutele API sunt pachete separate în Next.js, dar rulează în același proces.
const stare = (g.__erori ??= { erori: new Map(), fisier: join(tmpdir(), "cheiamea-erori.jsonl"), incarcat: false, linii: 0 });

/**
 * Erori care nu sunt defecte ale site-ului, deci nu se păstrează:
 * „Failed to find Server Action” apare când cineva trimite un formular dintr-o pagină deschisă înainte de ultima actualizare
 * sau când un robot de scanare trimite cereri POST false. Next.js respinge cererea, iar site-ul nu e afectat.
 */
export function eroareIgnorata(mesaj: string) {
  return /^Failed to find Server Action/i.test(mesaj.trim());
}

/** Scoate din text datele care pot identifica o persoană (emailuri, telefoane, IP-uri, CNP-uri, tokenuri din adrese). */
export function faraDatePersonale(text: string) {
  return text
    .replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/g, "$1***@")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, "[ip]")
    .replace(/(\+?4)?\b0\s?[237]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g, "[telefon]")
    .replace(/\b\d{13}\b/g, "[numar]")
    .replace(/(https?:\/\/[^\s?"']+)\?[^\s"']*/g, "$1");
}

/** Adresa paginii fără parametri (pot conține date ale vizitatorului). */
export const curataUnde = (unde: string) => faraDatePersonale(unde.split(/[?#]/)[0]).slice(0, 300) || "/";

function incarca() {
  if (stare.incarcat) return;
  stare.incarcat = true;
  let text = "";
  try {
    text = readFileSync(stare.fisier, "utf8");
  } catch {
    return;
  }
  // Fiecare linie e starea completă a unei erori; ultima linie a unui id câștigă.
  for (const linie of text.split("\n")) {
    if (!linie.trim()) continue;
    stare.linii++;
    try {
      const e = JSON.parse(linie) as EroarePastrata;
      if (e?.id && e.mesaj && e.ultima) {
        stare.erori.delete(e.id);
        stare.erori.set(e.id, e);
      }
    } catch {}
  }
  taie();
}

/** Păstrează doar ultimele MAX_ERORI erori (după ultima apariție). Map-ul ține ordinea: cea mai veche e prima. */
function taie() {
  while (stare.erori.size > MAX_ERORI) stare.erori.delete(stare.erori.keys().next().value!);
}

function scrie(e: EroarePastrata) {
  try {
    if (stare.linii >= MAX_LINII) {
      // Compactare: o linie pe eroare, scrisă întâi într-un fișier temporar.
      const tmp = `${stare.fisier}.tmp`;
      writeFileSync(tmp, [...stare.erori.values()].map((x) => JSON.stringify(x)).join("\n") + "\n");
      renameSync(tmp, stare.fisier);
      stare.linii = stare.erori.size;
    } else {
      appendFileSync(stare.fisier, JSON.stringify(e) + "\n");
      stare.linii++;
    }
  } catch (err) {
    console.error("Raport eroare: nu pot scrie", stare.fisier, err);
  }
}

/** Notează o eroare; întoarce eroarea păstrată (sau null dacă e ignorată). */
export function pastreazaEroare(e: Eroare, acum = new Date()): EroarePastrata | null {
  const mesaj = faraDatePersonale(e.mesaj.trim() || "eroare fără mesaj").slice(0, 1000);
  if (eroareIgnorata(mesaj)) return null;
  incarca();
  const unde = curataUnde(e.unde);
  const id = createHash("sha256").update(`${e.sursa}|${unde}|${mesaj.slice(0, 200)}`).digest("hex").slice(0, 16);
  const t = acum.toISOString();
  const vechi = stare.erori.get(id);
  const nou: EroarePastrata = {
    id,
    sursa: e.sursa,
    unde,
    mesaj,
    detalii: e.detalii ? faraDatePersonale(e.detalii).slice(0, 3000) : (vechi?.detalii ?? null),
    numar: (vechi?.numar ?? 0) + 1,
    prima: vechi?.prima ?? t,
    ultima: t,
  };
  stare.erori.delete(id);
  stare.erori.set(id, nou);
  taie();
  scrie(nou);
  return nou;
}

/** Erorile păstrate, cele mai recente primele; cu `de`, doar cele apărute (ultima dată) de atunci încoace. */
export function listaErori(de?: Date): EroarePastrata[] {
  incarca();
  const lista = [...stare.erori.values()].reverse();
  return de ? lista.filter((e) => Date.parse(e.ultima) >= de.getTime()) : lista;
}

export async function raporteazaEroare(e: Eroare) {
  console.error(`[eroare ${e.sursa}] ${curataUnde(e.unde)}: ${e.mesaj}`);
  pastreazaEroare(e);
}

/** Doar pentru teste: altă cale de fișier și listă goală. */
export function _reseteaza(fisier: string) {
  Object.assign(stare, { erori: new Map(), fisier, incarcat: false, linii: 0 });
}
