// Toate prețurile CheiaMea, într-un singur loc. Se schimbă doar aici.
// Prețuri finale în lei. Hugetech SRL nu este plătitoare de TVA (confirmat 23.10.2026).

/** Cota de TVA folosită pentru afișare; 0 dacă firma nu e plătitoare de TVA. */
export const COTA_TVA = 0;

/** Persoane fizice și firme care nu sunt agenții. */
export const ANUNTURI_GRATUITE = 3;
export const ZILE_VALABILITATE = 60;

export type CodPromovare = "reactualizare" | "evidentiat" | "top-oras-7" | "top-oras-30" | "prima-pagina-judet" | "vanzare-rapida";

export type Promovare = { cod: CodPromovare; nume: string; descriere: string; pret: number; zile: number };

export const PROMOVARI: Promovare[] = [
  { cod: "reactualizare", nume: "Reactualizare", descriere: "Urcă anunțul primul în listă, o dată.", pret: 7, zile: 0 },
  { cod: "evidentiat", nume: "Evidențiat", descriere: "Chenar portocaliu și insignă, 14 zile.", pret: 19, zile: 14 },
  { cod: "top-oras-7", nume: "Top în oraș, 7 zile", descriere: "Primele poziții în orașul anunțului.", pret: 29, zile: 7 },
  { cod: "top-oras-30", nume: "Top în oraș, 30 zile", descriere: "Primele poziții în orașul anunțului, o lună.", pret: 79, zile: 30 },
  { cod: "prima-pagina-judet", nume: "Prima pagină a județului, 7 zile", descriere: "Apare pe pagina județului, înainte de căutare.", pret: 49, zile: 7 },
  { cod: "vanzare-rapida", nume: "Pachet „Vânzare rapidă”", descriere: "Top în oraș și Evidențiat 30 de zile, plus 4 reactualizări (una pe săptămână).", pret: 99, zile: 30 },
];

/** Reducere la promovările cumpărate în plus de agențiile abonate. */
export const REDUCERE_PROMOVARI_ABONATI = 0.3;

export type CodAbonament = "start" | "pro" | "business" | "nelimitat";

export type Abonament = {
  cod: CodAbonament;
  nume: string;
  /** Lei pe lună, preț de listă. */
  pret: number;
  /** null = nelimitat. */
  anunturi: number | null;
  agenti: number | null;
  credite: { reactualizari: number; top7: number };
  extra?: string;
  recomandat?: boolean;
};

export const ABONAMENTE: Abonament[] = [
  { cod: "start", nume: "Start", pret: 149, anunturi: 25, agenti: 1, credite: { reactualizari: 5, top7: 0 } },
  { cod: "pro", nume: "Pro", pret: 349, anunturi: 100, agenti: 1, credite: { reactualizari: 20, top7: 2 }, recomandat: true },
  { cod: "business", nume: "Business", pret: 699, anunturi: 300, agenti: 5, credite: { reactualizari: 60, top7: 6 } },
  { cod: "nelimitat", nume: "Nelimitat", pret: 1199, anunturi: null, agenti: null, credite: { reactualizari: 150, top7: 15 } },
];

/** Agenție Fondatoare: reducere permanentă după perioada gratuită. */
export const REDUCERE_FONDATOARE = 0.5;
/** Plata anuală: plătești atâtea luni și primești 12. */
export const LUNI_PLATITE_PE_AN = 10;

/** Prețul lunar pentru o agenție; fondatoarele au -50%, rotunjit în sus la leu întreg. */
export function pretLunar(a: Abonament, fondator = false) {
  return fondator ? Math.ceil(a.pret * (1 - REDUCERE_FONDATOARE)) : a.pret;
}

export function pretAnual(a: Abonament, fondator = false) {
  return pretLunar(a, fondator) * LUNI_PLATITE_PE_AN;
}

export function getAbonament(cod: string | null | undefined) {
  return ABONAMENTE.find((a) => a.cod === cod) ?? null;
}

export function getPromovare(cod: string | null | undefined) {
  return PROMOVARI.find((p) => p.cod === cod) ?? null;
}

export function lei(suma: number) {
  return `${suma.toLocaleString("ro-RO")} lei`;
}

/** Prețul unei promovări; agențiile abonate au reducere, rotunjit în sus la leu. */
export function pretPromovare(p: Promovare, abonat = false) {
  return abonat ? Math.ceil(p.pret * (1 - REDUCERE_PROMOVARI_ABONATI)) : p.pret;
}

/** Pagină de proiect pentru dezvoltatori imobiliari (decis 28.10.2026): primele luni gratuit, apoi preț fix pe lună per proiect, unități nelimitate. */
export const PRET_PROIECT_LUNAR = 500;
export const LUNI_GRATUITE_PROIECT = 3;
