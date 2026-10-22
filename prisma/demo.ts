// Date demo generate determinist, folosite doar de prisma/seed.ts.
import { JUDETE } from "../src/modules/judete";
import { slugify, TIPURI } from "../src/lib/etichete";
import type { TipProprietate, Tranzactie } from "../src/modules/types";

const PRENUME = ["Andrei", "Maria", "Ioana", "Mihai", "Elena", "Radu", "Ana", "Cristian", "Gabriela", "Alexandru"];
const NUME = ["Popescu", "Ionescu", "Pop", "Stan", "Dumitru", "Constantin", "Matei", "Marin", "Tudor", "Florea"];
const AGENTII = ["Casa Ta", "Imobil Expert", "Rezidențial Plus", "Acasă Imobiliare", "Prime Estate", "Cheia Imobiliare"];
const FIRME = ["Construct Invest", "Nova Dezvoltare", "Urban Build", "Terra Proiect"];
const CULORI_CONT = ["#0b6bcb", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#15803d"];
const ZONE = ["Centru", "Nord", "Sud", "Est", "Vest", "Periferie", "Zona Gării", "Cartier Nou"];
const CULORI = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#14b8a6"];

const telefon = (baza: number, i: number, pas: number) => `07${String(baza + i * pas).slice(0, 8)}`;

export function utilizatoriDemo() {
  return JUDETE.flatMap((j, i) => {
    const o = j.orase[0];
    const ag = `${AGENTII[i % AGENTII.length]} ${o.nume}`;
    const fi = `${FIRME[i % FIRME.length]} ${j.cod} SRL`;
    const pf = `${PRENUME[i % PRENUME.length]} ${NUME[(i * 3) % NUME.length]}`;
    const loc = { judet: j.slug, oras: o.slug };
    return [
      { id: `demo-a${i}`, slug: slugify(ag), nume: ag, tip: "agentie", telefon: telefon(20000000, i, 7919), cui: `RO${30000000 + i * 1237}`, culoare: CULORI_CONT[i % 6], ...loc },
      { id: `demo-f${i}`, slug: slugify(fi), nume: fi, tip: "firma", telefon: telefon(40000000, i, 6007), cui: `RO${40000000 + i * 911}`, culoare: CULORI_CONT[(i + 2) % 6], ...loc },
      { id: `demo-p${i}`, slug: slugify(`${pf}-${i}`), nume: pf, tip: "persoana-fizica", telefon: telefon(50000000, i, 4111), culoare: CULORI_CONT[(i + 4) % 6], ...loc },
    ];
  });
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function anunturiDemo() {
  const r = rng(2026);
  const tipuri = Object.keys(TIPURI) as TipProprietate[];
  const lista = [];
  for (const [i, j] of JUDETE.entries()) {
    const proprietari = [`demo-a${i}`, `demo-f${i}`, `demo-p${i}`];
    for (const [idx, o] of j.orase.entries()) {
      for (let k = 0; k < (idx === 0 ? 6 : 3); k++) {
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
        const zi = 1 + Math.floor(r() * 21);
        lista.push({
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
          publicatLa: new Date(`2026-10-${String(zi).padStart(2, "0")}T10:00:00Z`),
          imagine: CULORI[Math.floor(r() * CULORI.length)],
          proprietarId: proprietari[Math.floor(r() * 3)],
        });
      }
    }
  }
  return lista;
}
