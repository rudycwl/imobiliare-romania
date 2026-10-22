import type { Anunt, TipProprietate, Tranzactie } from "@/modules/types";
import { JUDETE } from "./geo";
import { getUtilizator, proprietariJudet } from "./utilizatori";

// Date demo generate determinist. Se înlocuiesc cu o bază de date reală
// păstrând aceeași semnătură pentru funcțiile de mai jos.

export const TIPURI: Record<TipProprietate, string> = {
  apartament: "Apartament",
  casa: "Casă / vilă",
  teren: "Teren",
  "spatiu-comercial": "Spațiu comercial",
};

export const TRANZACTII: Record<Tranzactie, string> = {
  vanzare: "Vânzare",
  inchiriere: "Închiriere",
};

const ZONE = ["Centru", "Nord", "Sud", "Est", "Vest", "Periferie", "Zona Gării", "Cartier Nou"];
const CULORI = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#14b8a6"];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function genereaza(): Anunt[] {
  const r = rng(2026);
  const tipuri = Object.keys(TIPURI) as TipProprietate[];
  const lista: Anunt[] = [];
  let n = 1;
  for (const j of JUDETE) {
    const proprietari = proprietariJudet(j.slug);
    j.orase.forEach((o, idx) => {
      const count = idx === 0 ? 6 : 3;
      for (let k = 0; k < count; k++) {
        const tip = tipuri[Math.floor(r() * tipuri.length)];
        const tranzactie: Tranzactie = tip !== "teren" && r() < 0.35 ? "inchiriere" : "vanzare";
        const camere = tip === "apartament" ? 1 + Math.floor(r() * 4) : tip === "casa" ? 3 + Math.floor(r() * 4) : null;
        const suprafata =
          tip === "teren" ? 300 + Math.floor(r() * 2700) : tip === "casa" ? 90 + Math.floor(r() * 200) : 35 + Math.floor(r() * 110);
        const pretMp = tip === "teren" ? 20 + r() * 80 : (idx === 0 ? 1300 : 800) + r() * 1400;
        const pret =
          tranzactie === "inchiriere"
            ? Math.round((suprafata * (5 + r() * 9)) / 10) * 10
            : Math.round((suprafata * pretMp) / 500) * 500;
        const zona = ZONE[Math.floor(r() * ZONE.length)];
        const titluTip = camere && tip === "apartament" ? `Apartament ${camere} ${camere === 1 ? "cameră" : "camere"}` : TIPURI[tip];
        const id = String(n++).padStart(5, "0");
        const zi = 1 + Math.floor(r() * 21);
        lista.push({
          id,
          titlu: `${titluTip} de ${tranzactie === "vanzare" ? "vânzare" : "închiriat"}, ${o.nume} – ${zona}`,
          descriere: `${titluTip} în zona ${zona}, ${o.nume}, județul ${j.nume}. Suprafață ${suprafata} m². Anunț demonstrativ generat automat pentru prezentarea platformei.`,
          tip,
          tranzactie,
          pret,
          suprafata,
          camere,
          judet: j.slug,
          oras: o.slug,
          zona,
          dataPublicarii: `2026-10-${String(zi).padStart(2, "0")}`,
          imagine: CULORI[Math.floor(r() * CULORI.length)],
          proprietarId: proprietari[Math.floor(r() * proprietari.length)].id,
        });
      }
    });
  }
  return lista;
}

const ANUNTURI = genereaza();

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

export function cautaAnunturi(f: Filtre): Anunt[] {
  const q = f.q?.trim().toLowerCase();
  const pretMin = Number(f.pretMin) || 0;
  const pretMax = Number(f.pretMax) || Infinity;
  const camere = Number(f.camere) || 0;
  const rezultat = ANUNTURI.filter(
    (a) =>
      (!f.judet || a.judet === f.judet) &&
      (!f.oras || a.oras === f.oras) &&
      (!f.tip || a.tip === f.tip) &&
      (!f.tranzactie || a.tranzactie === f.tranzactie) &&
      a.pret >= pretMin &&
      a.pret <= pretMax &&
      (!camere || (a.camere ?? 0) >= camere) &&
      (!f.proprietar || a.proprietarId === f.proprietar) &&
      (!f.oferit || getUtilizator(a.proprietarId)?.tip === f.oferit) &&
      (!q || `${a.titlu} ${a.descriere}`.toLowerCase().includes(q)),
  );
  switch (f.sort) {
    case "pret-asc":
      return rezultat.sort((a, b) => a.pret - b.pret);
    case "pret-desc":
      return rezultat.sort((a, b) => b.pret - a.pret);
    default:
      return rezultat.sort((a, b) => b.dataPublicarii.localeCompare(a.dataPublicarii) || a.id.localeCompare(b.id));
  }
}

export function getAnunt(id: string) {
  return ANUNTURI.find((a) => a.id === id);
}

export function numarAnunturi(judet: string, oras?: string) {
  return ANUNTURI.filter((a) => a.judet === judet && (!oras || a.oras === oras)).length;
}

export function formatPret(a: Anunt) {
  const p = new Intl.NumberFormat("ro-RO").format(a.pret) + " €";
  return a.tranzactie === "inchiriere" ? `${p} / lună` : p;
}
