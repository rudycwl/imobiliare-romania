// Listele și regulile câmpurilor „Caracteristici” (formular, pagina anunțului, importuri).
// Un singur loc pentru: ce câmpuri are fiecare tip de proprietate, care sunt obligatorii, etichetele și valorile.
// Fără importuri de server: îl folosesc și formularul din browser, și serverul.

import type { TipProprietate } from "@/modules/types";

/** Câmpurile secțiunii „Caracteristici” din formular (suprafața și camerele existau deja pe anunț). */
export type CampCar =
  | "suprafata"
  | "suprafataTotala"
  | "camere"
  | "compartimentare"
  | "etaj"
  | "etajeTotal"
  | "anConstructie"
  | "stare"
  | "bai"
  | "balcon"
  | "incalzire"
  | "mobilare"
  | "aerConditionat"
  | "clasaEnergetica"
  | "dotari";

/** Ordinea din formular și de pe pagina anunțului. */
export const ORDINE_CAMPURI: CampCar[] = [
  "suprafata",
  "suprafataTotala",
  "camere",
  "compartimentare",
  "etaj",
  "etajeTotal",
  "anConstructie",
  "stare",
  "bai",
  "balcon",
  "incalzire",
  "mobilare",
  "aerConditionat",
  "clasaEnergetica",
  "dotari",
];

const T = true; // obligatoriu
const O = false; // opțional

/**
 * Câmpurile fiecărui tip: true = obligatoriu în formular, false = opțional; lipsă = nu se aplică (nu apare).
 * Feed-urile XML, CSV-ul și actualizarea automată nu cer câmpurile obligatorii (sursa poate să nu le aibă);
 * la editarea manuală ulterioară devin obligatorii.
 */
export const CAMPURI_TIP: Record<TipProprietate, Partial<Record<CampCar, boolean>>> = {
  apartament: {
    suprafata: T, suprafataTotala: T, camere: T, compartimentare: T, etaj: T, etajeTotal: T, anConstructie: T, stare: T,
    bai: T, balcon: T, incalzire: T, mobilare: T, aerConditionat: T, clasaEnergetica: T, dotari: O,
  },
  // La casă nu are sens etajul; „etajeTotal” e numărul de niveluri.
  casa: {
    suprafata: T, suprafataTotala: T, camere: T, compartimentare: T, etajeTotal: T, anConstructie: T, stare: T,
    bai: T, balcon: T, incalzire: T, mobilare: T, aerConditionat: T, clasaEnergetica: T, dotari: O,
  },
  // Dotările terenului sunt utilitățile.
  teren: { suprafata: T, dotari: O },
  "spatiu-comercial": {
    suprafata: T, suprafataTotala: O, etaj: T, etajeTotal: O, anConstructie: O, stare: O, incalzire: T, aerConditionat: T,
    clasaEnergetica: O, dotari: O,
  },
  birouri: {
    suprafata: T, suprafataTotala: O, etaj: T, etajeTotal: O, anConstructie: O, stare: O, incalzire: T, mobilare: O,
    aerConditionat: T, clasaEnergetica: O, dotari: O,
  },
  depozit: { suprafata: T, suprafataTotala: O, anConstructie: O, stare: O, incalzire: O, dotari: O },
};

/** Câmpurile tipului, în ordinea afișării, cu obligativitatea. */
export function campuriTip(tip: string): { camp: CampCar; obligatoriu: boolean }[] {
  const c = CAMPURI_TIP[tip as TipProprietate] ?? CAMPURI_TIP.apartament;
  return ORDINE_CAMPURI.filter((k) => k in c).map((k) => ({ camp: k, obligatoriu: !!c[k] }));
}

export const areCamp = (tip: string, camp: CampCar) => camp in (CAMPURI_TIP[tip as TipProprietate] ?? {});
export const obligatoriu = (tip: string, camp: CampCar) => !!CAMPURI_TIP[tip as TipProprietate]?.[camp];

/**
 * La conturile de agenție, starea și clasa energetică nu sunt obligatorii (paginile agențiilor des nu le au);
 * la „Publică” formularul le cere într-o fereastră, cu opțiunea de a publica fără ele.
 */
export const OPTIONALE_AGENTIE: readonly CampCar[] = ["stare", "clasaEnergetica"];

/** Obligativitatea câmpului pentru tip, ținând cont de tipul contului. */
export const obligatoriuPentru = (tip: string, camp: CampCar, agentie = false) =>
  obligatoriu(tip, camp) && !(agentie && OPTIONALE_AGENTIE.includes(camp));

/**
 * Locația: la apartament și casă strada e obligatorie (numărul nu); la teren strada sau zona.
 * La agenții strada nu e obligatorie: ajunge zona (anunțul apare pe hartă după zonă / localitate).
 */
export function cerintaLocatie(tip: string, agentie = false): "strada" | "strada-sau-zona" | null {
  if (tip === "apartament" || tip === "casa") return agentie ? "strada-sau-zona" : "strada";
  if (tip === "teren") return "strada-sau-zona";
  return null;
}

/** Eticheta câmpului, adaptată tipului. */
export function etichetaCamp(camp: CampCar, tip: string): string {
  switch (camp) {
    case "suprafata":
      return tip === "teren" ? "Suprafață teren" : "Suprafață utilă";
    case "suprafataTotala":
      return "Suprafață totală";
    case "camere":
      return "Camere";
    case "compartimentare":
      return "Compartimentare";
    case "etaj":
      return "Etaj";
    case "etajeTotal":
      return tip === "casa" ? "Nr. niveluri" : "Regim de înălțime";
    case "anConstructie":
      return "An construcție";
    case "stare":
      return "Stare";
    case "bai":
      return "Băi";
    case "balcon":
      return "Balcon";
    case "incalzire":
      return "Încălzire";
    case "mobilare":
      return "Mobilare";
    case "aerConditionat":
      return "Aer condiționat";
    case "clasaEnergetica":
      return "Clasă energetică";
    case "dotari":
      return tip === "teren" ? "Utilități" : "Dotări";
  }
}

export const INCALZIRE = {
  centralizata: "Centralizată",
  "centrala-proprie": "Centrală proprie",
  gaz: "Pe gaz",
  pardoseala: "În pardoseală",
  electrica: "Electrică",
  alta: "Alta",
  fara: "Fără încălzire",
} as const;

export const MOBILARE = {
  nemobilat: "Nemobilat",
  semimobilat: "Semimobilat",
  mobilat: "Mobilat",
  "mobilat-utilat": "Mobilat și utilat",
} as const;

export const COMPARTIMENTARE = {
  decomandat: "Decomandat",
  semidecomandat: "Semidecomandat",
  nedecomandat: "Nedecomandat",
  circular: "Circular",
  "open-space": "Open space",
} as const;

export const STARE = {
  nou: "Nou",
  renovat: "Renovat",
  bun: "Stare bună",
  "necesita-renovare": "Necesită renovare",
} as const;

export const CLASE_ENERGETICE = ["A++", "A+", "A", "B", "C", "D", "E", "F", "G"] as const;
/** Valoarea „În curs de obținere” a clasei energetice (certificatul se face la vânzare). */
export const CLASA_IN_CURS = "in-curs";
export const eticheteClasa = (v: string) => (v === CLASA_IN_CURS ? "În curs de obținere" : v);

/** anConstructie = 0: proprietarul nu știe anul. */
export const AN_NECUNOSCUT = 0;

/** Toate dotările posibile (cod → etichetă scurtă afișată ca etichetă). */
export const DOTARI = {
  lift: "Lift",
  parcare: "Loc de parcare",
  garaj: "Garaj",
  boxa: "Boxă",
  termopan: "Termopane",
  "usa-metalica": "Ușă metalică",
  interfon: "Interfon",
  "acces-securizat": "Acces securizat",
  video: "Supraveghere video",
  alarma: "Sistem alarmă",
  internet: "Internet / fibră",
  curte: "Curte",
  amenajat: "Amenajat pentru birouri",
  "grup-sanitar": "Grup sanitar propriu",
  chicineta: "Chicinetă / bucătărie",
  frigider: "Frigider",
  "acces-24": "Acces 24/7",
  vitrina: "Vitrină",
  rampa: "Rampă de încărcare",
  curent: "Curent electric",
  apa: "Apă",
  "gaz-retea": "Gaz",
  canalizare: "Canalizare",
} as const;
export type Dotare = keyof typeof DOTARI;

/** Dotările care se pot bifa la fiecare tip, în ordinea din formular. */
export const DOTARI_TIP: Record<TipProprietate, Dotare[]> = {
  apartament: ["lift", "parcare", "boxa", "termopan", "usa-metalica", "interfon", "acces-securizat", "video", "alarma", "internet"],
  casa: ["curte", "garaj", "parcare", "termopan", "usa-metalica", "alarma", "video", "internet"],
  teren: ["curent", "apa", "gaz-retea", "canalizare"],
  "spatiu-comercial": ["vitrina", "grup-sanitar", "chicineta", "parcare", "alarma", "video", "internet", "acces-24"],
  birouri: ["amenajat", "grup-sanitar", "chicineta", "frigider", "parcare", "lift", "internet", "alarma", "acces-24"],
  depozit: ["rampa", "grup-sanitar", "parcare", "alarma", "video", "acces-24"],
};

export const dotariTip = (tip: string): Dotare[] => DOTARI_TIP[tip as TipProprietate] ?? DOTARI_TIP.apartament;

/** Câmpurile din grilă, în ordinea afișării; cele din LUNGI au valori care nu încap pe jumătate de rând pe telefon. */
const GRILA: CampCar[] = ["suprafata", "suprafataTotala", "camere", "etaj", "etajeTotal", "anConstructie", "bai", "incalzire", "mobilare", "aerConditionat", "clasaEnergetica"];
const LUNGI = new Set<CampCar>(["etajeTotal", "incalzire", "mobilare", "aerConditionat", "clasaEnergetica"]);

/**
 * Pe telefon (grila cu 2 coloane) câmpurile care ocupă tot rândul: cele cu valori lungi („Doar parter (P)”,
 * „Centrală proprie”) și câmpul rămas singur într-un șir impar de câmpuri scurte (ex. „Camere” la casă, înainte de
 * „Regim de înălțime”), ca să nu stea pe jumătate de rând cu un gol lângă el. Ordinea rămâne cea din pagină.
 */
export function latimiMobil(tip: string): Set<CampCar> {
  const lat = new Set<CampCar>();
  let sir: CampCar[] = [];
  const inchide = () => {
    if (sir.length % 2) lat.add(sir[sir.length - 1]);
    sir = [];
  };
  for (const c of GRILA.filter((k) => areCamp(tip, k))) {
    if (LUNGI.has(c)) {
      inchide();
      lat.add(c);
    } else sir.push(c);
  }
  inchide();
  return lat;
}
