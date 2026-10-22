import type { TipUtilizator, Utilizator } from "@/modules/types";
import { JUDETE } from "./geo";

export const TIPURI_UTILIZATOR: Record<TipUtilizator, string> = {
  "persoana-fizica": "Persoană fizică",
  firma: "Firmă",
  agentie: "Agenție imobiliară",
};

// Date demo: câte o agenție în fiecare reședință de județ, firme și persoane fizice.
const PRENUME = ["Andrei", "Maria", "Ioana", "Mihai", "Elena", "Radu", "Ana", "Cristian", "Gabriela", "Alexandru"];
const NUME = ["Popescu", "Ionescu", "Pop", "Stan", "Dumitru", "Constantin", "Matei", "Marin", "Tudor", "Florea"];
const AGENTII = ["Casa Ta", "Imobil Expert", "Rezidențial Plus", "Acasă Imobiliare", "Prime Estate", "Cheia Imobiliare"];
const FIRME = ["Construct Invest", "Nova Dezvoltare", "Urban Build", "Terra Proiect"];
const CULORI = ["#0b6bcb", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#15803d"];

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function genereaza(): Utilizator[] {
  const lista: Utilizator[] = [];
  JUDETE.forEach((j, i) => {
    const o = j.orase[0];
    const ag = `${AGENTII[i % AGENTII.length]} ${o.nume}`;
    lista.push({ id: `a${i}`, slug: slugify(ag), nume: ag, tip: "agentie", telefon: `07${String(20000000 + i * 7919).slice(0, 8)}`, judet: j.slug, oras: o.slug, cui: `RO${30000000 + i * 1237}`, culoare: CULORI[i % CULORI.length] });
    const fi = `${FIRME[i % FIRME.length]} ${j.cod} SRL`;
    lista.push({ id: `f${i}`, slug: slugify(fi), nume: fi, tip: "firma", telefon: `07${String(40000000 + i * 6007).slice(0, 8)}`, judet: j.slug, oras: o.slug, cui: `RO${40000000 + i * 911}`, culoare: CULORI[(i + 2) % CULORI.length] });
    const pf = `${PRENUME[i % PRENUME.length]} ${NUME[(i * 3) % NUME.length]}`;
    lista.push({ id: `p${i}`, slug: slugify(`${pf}-${i}`), nume: pf, tip: "persoana-fizica", telefon: `07${String(50000000 + i * 4111).slice(0, 8)}`, judet: j.slug, oras: o.slug, culoare: CULORI[(i + 4) % CULORI.length] });
  });
  return lista;
}

const UTILIZATORI = genereaza();

export function getUtilizator(id: string) {
  return UTILIZATORI.find((u) => u.id === id);
}

export function getAgentie(slug: string) {
  return UTILIZATORI.find((u) => u.tip === "agentie" && u.slug === slug);
}

export function getAgentii(judet?: string) {
  return UTILIZATORI.filter((u) => u.tip === "agentie" && (!judet || u.judet === judet));
}

/** Proprietarii demo dintr-un județ, folosiți la generarea anunțurilor. */
export function proprietariJudet(judet: string) {
  return UTILIZATORI.filter((u) => u.judet === judet);
}
