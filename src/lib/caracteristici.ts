// Caracteristicile structurate ale anunțului: validarea din formular (aceeași în browser și pe server),
// precompletarea din importuri (feed XML, CSV, pagina agenției, OLX) și afișarea pe pagina anunțului.
// Funcții pure, fără importuri de server.

import { extrageCaracteristici, type Caracteristici } from "./anunt-format";
import {
  AN_NECUNOSCUT,
  areCamp,
  CLASA_IN_CURS,
  CLASE_ENERGETICE,
  COMPARTIMENTARE,
  cerintaLocatie,
  dotariTip,
  etichetaCamp,
  eticheteClasa,
  INCALZIRE,
  MOBILARE,
  obligatoriu,
  STARE,
  type CampCar,
  type Dotare,
} from "./caracteristici-liste";

export type CampuriCaracteristici = {
  etaj: number | null;
  etajeTotal: number | null;
  anConstructie: number | null;
  clasaEnergetica: string | null;
  bai: number | null;
  balcon: boolean | null;
  balconInchis: boolean | null;
  balconMp: number | null;
  incalzire: string | null;
  mobilare: string | null;
  aerConditionat: number | null;
  suprafataTotala: number | null;
  compartimentare: string | null;
  stare: string | null;
  dotari: string[];
};

export const CHEI_CARACTERISTICI: (keyof CampuriCaracteristici)[] = [
  "etaj", "etajeTotal", "anConstructie", "clasaEnergetica", "bai", "balcon", "balconInchis", "balconMp",
  "incalzire", "mobilare", "aerConditionat", "suprafataTotala", "compartimentare", "stare", "dotari",
];

/** Pentru `select` în Prisma: toate câmpurile caracteristicilor. */
export const SELECT_CARACTERISTICI = {
  etaj: true, etajeTotal: true, anConstructie: true, clasaEnergetica: true, bai: true, balcon: true, balconInchis: true,
  balconMp: true, incalzire: true, mobilare: true, aerConditionat: true, suprafataTotala: true, compartimentare: true,
  stare: true, dotari: true,
} as const;

export const GOL: CampuriCaracteristici = {
  etaj: null, etajeTotal: null, anConstructie: null, clasaEnergetica: null, bai: null, balcon: null, balconInchis: null,
  balconMp: null, incalzire: null, mobilare: null, aerConditionat: null, suprafataTotala: null, compartimentare: null,
  stare: null, dotari: [],
};

export type EroareCamp = { camp: string; mesaj: string };

const maxAn = (acum: Date) => acum.getFullYear() + 3;
const esteCheie = <T extends object>(o: T, k: string): k is Extract<keyof T, string> => Object.prototype.hasOwnProperty.call(o, k);

/** „” → null; „12” → 12; altceva → NaN (valoare greșită). */
function intreg(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  return /^-?\d+$/.test(s) ? Number(s) : NaN;
}

/**
 * Citește și verifică secțiunea „Caracteristici” (și adresa) din formular. Aceeași funcție rulează în browser
 * (marcaj lângă câmp, focus pe primul lipsă) și pe server (publicaAnunt / editeazaAnunt).
 * Câmpurile care nu se aplică tipului se golesc. `cuObligatorii: false` sare doar peste câmpurile lipsă.
 */
export function citesteCaracteristici(
  get: (k: string) => string,
  getAll: (k: string) => string[],
  tip: string,
  { cuObligatorii = true, acum = new Date() }: { cuObligatorii?: boolean; acum?: Date } = {},
): { date: CampuriCaracteristici; erori: EroareCamp[] } {
  const erori: EroareCamp[] = [];
  const d: CampuriCaracteristici = { ...GOL, dotari: [] };
  const lipsa = (camp: CampCar | "strada" | "zona", eticheta = etichetaCamp(camp as CampCar, tip)) =>
    erori.push({ camp, mesaj: `Completează „${eticheta}”.` });
  const gresit = (camp: string, mesaj: string) => erori.push({ camp, mesaj });
  const cere = (camp: CampCar, v: unknown) => {
    if ((v === null || v === "") && cuObligatorii && obligatoriu(tip, camp)) lipsa(camp);
  };
  const numar = (camp: CampCar, min: number, max: number, mesaj: string) => {
    if (!areCamp(tip, camp)) return null;
    const n = intreg(get(camp));
    if (n !== null && (Number.isNaN(n) || n < min || n > max)) {
      gresit(camp, mesaj);
      return null;
    }
    cere(camp, n);
    return n;
  };
  const alegere = (camp: CampCar, lista: object) => {
    if (!areCamp(tip, camp)) return null;
    const v = get(camp).trim();
    if (v && !esteCheie(lista, v)) {
      gresit(camp, `Alege o valoare din listă la „${etichetaCamp(camp, tip)}”.`);
      return null;
    }
    cere(camp, v);
    return v || null;
  };

  // Suprafața utilă și camerele sunt câmpurile vechi ale anunțului (le salvează citesteAnunt); aici doar le cerem.
  const suprafata = intreg(get("suprafata"));
  if (suprafata === null && cuObligatorii) lipsa("suprafata");
  if (areCamp(tip, "camere") && cuObligatorii && obligatoriu(tip, "camere") && intreg(get("camere")) === null) lipsa("camere");

  d.suprafataTotala = numar("suprafataTotala", 1, 10_000_000, "Suprafața totală trebuie să fie un număr întreg de m².");
  if (d.suprafataTotala && suprafata && suprafata > 0 && d.suprafataTotala < suprafata)
    gresit("suprafataTotala", "Suprafața totală nu poate fi mai mică decât suprafața utilă.");

  d.compartimentare = alegere("compartimentare", COMPARTIMENTARE);
  d.etaj = numar("etaj", -1, 60, "Alege etajul din listă.");
  const casa = tip === "casa";
  d.etajeTotal = numar("etajeTotal", casa ? 1 : 0, casa ? 10 : 60, casa ? "Alege numărul de niveluri din listă." : "Alege regimul de înălțime din listă.");
  if (d.etaj != null && d.etajeTotal != null && d.etaj > d.etajeTotal)
    gresit("etaj", `Etajul (${d.etaj}) nu poate fi mai mare decât ultimul etaj al clădirii (P+${d.etajeTotal}).`);
  d.anConstructie = numar("anConstructie", AN_NECUNOSCUT, maxAn(acum), `Anul construcției: între 1800 și ${maxAn(acum)} sau „Nu știu”.`);
  if (d.anConstructie != null && d.anConstructie !== AN_NECUNOSCUT && d.anConstructie < 1800) {
    gresit("anConstructie", `Anul construcției: între 1800 și ${maxAn(acum)} sau „Nu știu”.`);
    d.anConstructie = null;
  }
  d.stare = alegere("stare", STARE);
  d.bai = numar("bai", 0, 20, "Numărul de băi: între 0 și 20.");

  if (areCamp(tip, "balcon")) {
    const b = get("balcon").trim();
    d.balcon = b === "da" ? true : b === "nu" ? false : null;
    if (b && d.balcon === null) gresit("balcon", "Alege „Da” sau „Nu” la balcon.");
    else cere("balcon", d.balcon);
    if (d.balcon) {
      d.balconInchis = get("balconInchis") === "da";
      const mp = intreg(get("balconMp"));
      if (mp !== null && (Number.isNaN(mp) || mp < 1 || mp > 500)) gresit("balconMp", "Suprafața balconului: un număr întreg de m² (1–500).");
      else d.balconMp = mp;
    }
  }

  d.incalzire = alegere("incalzire", INCALZIRE);
  d.mobilare = alegere("mobilare", MOBILARE);
  d.aerConditionat = numar("aerConditionat", 0, 20, "Alege din listă la „Aer condiționat”.");
  if (areCamp(tip, "clasaEnergetica")) {
    const v = get("clasaEnergetica").trim();
    if (v && v !== CLASA_IN_CURS && !(CLASE_ENERGETICE as readonly string[]).includes(v)) gresit("clasaEnergetica", "Alege clasa energetică din listă.");
    else {
      d.clasaEnergetica = v || null;
      cere("clasaEnergetica", d.clasaEnergetica);
    }
  }
  if (areCamp(tip, "dotari")) {
    const permise = new Set<string>(dotariTip(tip));
    d.dotari = [...new Set(getAll("dotari").flatMap((x) => x.split(",")).map((x) => x.trim()).filter((x) => permise.has(x)))];
  }

  // Adresa: la apartament, casă și teren strada sau zona.
  if (cuObligatorii) {
    const c = cerintaLocatie(tip);
    if (c === "strada-sau-zona" && !get("strada").trim() && !get("zona").trim()) lipsa("strada", "Stradă sau zonă");
  }
  return { date: d, erori };
}

/** Câmpurile opționale pe care formularul le cere totuși la „Publică”, într-o fereastră. */
export type CampFereastra = "strada" | "stare" | "clasaEnergetica";

/**
 * Câmpurile goale dintre strada, starea și clasa energetică (doar cele care apar în formular pentru tip).
 * Formularul le arată într-o fereastră înainte de publicare; se poate publica și fără ele.
 */
export function campuriLipsaPublicare(get: (k: string) => string, tip: string): CampFereastra[] {
  const r: CampFereastra[] = [];
  if (!get("strada").trim()) r.push("strada");
  for (const c of ["stare", "clasaEnergetica"] as const) if (areCamp(tip, c) && !get(c).trim()) r.push(c);
  return r;
}

/**
 * Starea dedusă sigur din date, pentru precompletare la import: clădire terminată anul acesta sau anul trecut
 * (ori care urmează să fie gata) → „Nou”. Altfel nimic (omul alege).
 */
export function stareDedusa(c: Partial<CampuriCaracteristici>, acum = new Date()): string | undefined {
  const an = c.anConstructie;
  if (an && an !== AN_NECUNOSCUT && an >= acum.getFullYear() - 1) return "nou";
  return undefined;
}

// ---------- Din importuri ----------

const simplu = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const cheie = (s: string) => simplu(s).replace(/[^a-z0-9]/g, "");

/** „73,65” → 74; „1.200” → 1200; „80 mp” → 80. */
function numarText(v: string): number | null {
  const m = v.replace(/\s/g, "").match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const s = /^\d{1,3}(?:\.\d{3})+/.test(m[0]) ? m[0].replace(/\./g, "").replace(",", ".") : m[0].replace(",", ".");
  const n = Math.round(Number(s));
  return Number.isFinite(n) ? n : null;
}

function etajText(v: string): { etaj?: number; total?: number } {
  const s = simplu(v);
  const parti = s.split(/\s*(?:\/|din)\s*/);
  const unul = (x: string) => {
    if (/^(p|parter)\b/.test(x)) return 0;
    if (/^(d|demisol|s|subsol)\b/.test(x)) return -1;
    const n = x.match(/^-?\d{1,2}$/);
    return n ? Number(n[0]) : undefined;
  };
  const etaj = unul(parti[0]?.trim() ?? "");
  const total = parti[1] ? regimText(parti[1], false) : undefined;
  return { etaj, total };
}

/** „P+4” → 4 (apartament) sau 5 niveluri (casă); „4” → 4; „P+1+M” → 3 niveluri. */
function regimText(v: string, casa: boolean): number | undefined {
  const s = simplu(v).replace(/\s/g, "");
  if (/^(p|parter)$/.test(s)) return casa ? 1 : 0;
  const m = s.match(/^(?:d\+|s\+)?p\+(\d{1,2})(\+m|\+e?m)?$/);
  if (m) return casa ? 1 + Number(m[1]) + (m[2] ? 1 : 0) : Number(m[1]);
  if (/^p\+m$/.test(s)) return casa ? 2 : 0;
  const n = s.match(/^\d{1,2}$/);
  return n ? Number(n[0]) : undefined;
}

function daNu(v: string): boolean | undefined {
  const s = simplu(v);
  if (/^(da|yes|true|1|exista|are)\b/.test(s) || /^\d+$/.test(s) && Number(s) > 0) return true;
  if (/^(nu|no|false|0|fara|nu are)\b/.test(s)) return false;
  return undefined;
}

function incalzireText(v: string): string | undefined {
  const s = simplu(v);
  if (!s) return undefined;
  if (/fara/.test(s)) return "fara";
  if (/pardoseal/.test(s)) return "pardoseala";
  if (/termoficare|centralizat|agent termic|radet/.test(s)) return "centralizata";
  if (/central|\bct\b/.test(s)) return "centrala-proprie";
  if (/electric/.test(s)) return "electrica";
  if (/gaz|soba|teracot/.test(s)) return "gaz";
  return "alta";
}

function mobilareText(v: string): string | undefined {
  const s = simplu(v);
  if (/nemobilat|^nu\b|^no\b|unfurnished/.test(s)) return "nemobilat";
  if (/semi/.test(s)) return "semimobilat";
  if (/utilat|equipped/.test(s)) return "mobilat-utilat";
  if (/mobilat|^da\b|^yes\b|furnished/.test(s)) return "mobilat";
  return undefined;
}

function dinLista<T extends Record<string, string>>(lista: T, v: string): Extract<keyof T, string> | undefined {
  const s = cheie(v);
  if (!s) return undefined;
  // Cele mai lungi întâi: „semidecomandat” înaintea lui „decomandat”.
  const toate = (Object.entries(lista) as [Extract<keyof T, string>, string][]).sort((a, b) => cheie(b[1]).length - cheie(a[1]).length);
  return toate.find(([k, e]) => s === cheie(k) || s === cheie(e) || s.includes(cheie(e)) || s.includes(cheie(k)))?.[0];
}

/** Numele coloanelor acceptate în feed / CSV / pagina agenției (cheile fără diacritice și separatori). */
const COLOANE: Record<string, (keyof CampuriCaracteristici)> = {
  etaj: "etaj", etajetotal: "etajeTotal", nretaje: "etajeTotal", regiminaltime: "etajeTotal", niveluri: "etajeTotal", nrniveluri: "etajeTotal",
  anconstructie: "anConstructie", clasaenergetica: "clasaEnergetica", bai: "bai", nrbai: "bai", balcon: "balcon", balcoane: "balcon",
  balconmp: "balconMp", suprafatabalcon: "balconMp", incalzire: "incalzire", mobilare: "mobilare", mobilat: "mobilare",
  aerconditionat: "aerConditionat", suprafatatotala: "suprafataTotala", compartimentare: "compartimentare", stare: "stare",
  dotari: "dotari",
};

/**
 * Caracteristicile dintr-un rând de import (feed XML, CSV, pagina agenției), scrise liber („Parter”, „2/4”, „P+4”,
 * „Centrala proprie”, „da”). Întoarce doar ce a găsit și se aplică tipului.
 */
export function caracteristiciDinRand(rand: Record<string, string>, tip: string, acum = new Date()): Partial<CampuriCaracteristici> {
  const v: Partial<Record<keyof CampuriCaracteristici, string>> = {};
  for (const [k, x] of Object.entries(rand)) {
    const c = COLOANE[cheie(k)];
    if (c && x?.trim() && !v[c]) v[c] = x.trim();
  }
  const r: Partial<CampuriCaracteristici> = {};
  const casa = tip === "casa";
  if (v.etaj) {
    const e = etajText(v.etaj);
    if (e.etaj !== undefined) r.etaj = e.etaj;
    if (e.total !== undefined && !casa) r.etajeTotal = e.total;
  }
  if (v.etajeTotal) {
    const t = regimText(v.etajeTotal, casa);
    if (t !== undefined) r.etajeTotal = t;
  }
  const an = v.anConstructie?.match(/(?:18|19|20)\d{2}/)?.[0];
  if (an && Number(an) <= maxAn(acum)) r.anConstructie = Number(an);
  const clasa = v.clasaEnergetica?.toUpperCase().replace(/CLASA|ENERGETICA|[:\s]/g, "").match(/^(A\+{0,2}|[B-G])$/)?.[1];
  if (clasa) r.clasaEnergetica = clasa;
  if (v.bai) {
    const n = numarText(v.bai);
    if (n !== null && n <= 20) r.bai = n;
  }
  if (v.balcon) {
    const b = daNu(v.balcon);
    if (b !== undefined) r.balcon = b;
    if (b && /inchis/.test(simplu(v.balcon))) r.balconInchis = true;
  }
  if (v.balconMp && r.balcon !== false) {
    const n = numarText(v.balconMp);
    if (n && n <= 500) {
      r.balcon = true;
      r.balconMp = n;
    }
  }
  if (v.incalzire) r.incalzire = incalzireText(v.incalzire);
  if (v.mobilare) r.mobilare = mobilareText(v.mobilare);
  if (v.aerConditionat) {
    const b = daNu(v.aerConditionat);
    const n = numarText(v.aerConditionat);
    if (n !== null && n <= 20) r.aerConditionat = n;
    else if (b !== undefined) r.aerConditionat = b ? 1 : 0;
  }
  if (v.suprafataTotala) {
    const n = numarText(v.suprafataTotala);
    if (n && n > 0) r.suprafataTotala = n;
  }
  if (v.compartimentare) r.compartimentare = dinLista(COMPARTIMENTARE, v.compartimentare);
  if (v.stare) r.stare = dinLista(STARE, v.stare);
  if (v.dotari) {
    const permise = new Set<string>(dotariTip(tip));
    const d = v.dotari.split(/[,;|]/).map((x) => x.trim()).filter((x) => permise.has(x));
    if (d.length) r.dotari = d;
  }
  return doarTipul(curat(r), tip);
}

/** Ce scoatem din descriere, ca valori de formular (etichetele din extrageCaracteristici → codurile câmpurilor). */
export function caracteristiciDinDescriere(descriere: string, tip: string, acum = new Date()): Partial<CampuriCaracteristici> {
  return doarTipul(curat(dinExtrase(extrageCaracteristici(descriere, acum), tip)), tip);
}

function dinExtrase(c: Caracteristici, tip: string): Partial<CampuriCaracteristici> {
  const r: Partial<CampuriCaracteristici> = {};
  if (c.etaj) {
    const e = etajText(c.etaj);
    if (e.etaj !== undefined) r.etaj = e.etaj;
    if (e.total !== undefined) r.etajeTotal = e.total;
  }
  if (c.anConstructie) r.anConstructie = c.anConstructie;
  if (c.clasaEnergetica) r.clasaEnergetica = c.clasaEnergetica;
  if (c.bai) r.bai = c.bai;
  if (c.balcon) {
    r.balcon = true;
    if (/închis/.test(c.balcon)) r.balconInchis = true;
    const mp = c.balcon.match(/(\d+) m²/);
    if (mp) r.balconMp = Number(mp[1]);
  }
  if (c.incalzire) r.incalzire = incalzireText(c.incalzire.split(",")[0]);
  if (c.mobilare && c.mobilare !== "Utilat") r.mobilare = mobilareText(c.mobilare);
  if (c.aerConditionat) r.aerConditionat = Number(c.aerConditionat.match(/(\d+) aparate/)?.[1] ?? 1);
  if (c.suprafataTotala) r.suprafataTotala = c.suprafataTotala;
  if (c.compartimentare) r.compartimentare = dinLista(COMPARTIMENTARE, c.compartimentare);
  if (c.stare) r.stare = dinLista(STARE, c.stare);
  if (c.dotari?.length) r.dotari = c.dotari;
  // La casă „etajul 2 din 4” din descriere nu spune numărul de niveluri.
  if (tip === "casa") {
    delete r.etaj;
    delete r.etajeTotal;
  }
  return r;
}

/** Fără chei goale (undefined / null / listă goală). */
function curat(r: Partial<CampuriCaracteristici>): Partial<CampuriCaracteristici> {
  return Object.fromEntries(
    Object.entries(r).filter(([, x]) => x !== undefined && x !== null && !(Array.isArray(x) && !x.length)),
  ) as Partial<CampuriCaracteristici>;
}

/** Păstrează doar câmpurile care se aplică tipului (etaj nu la casă, băi nu la teren, dotările tipului …). */
function doarTipul(r: Partial<CampuriCaracteristici>, tip: string): Partial<CampuriCaracteristici> {
  const out: Partial<CampuriCaracteristici> = {};
  const pe: Record<keyof CampuriCaracteristici, CampCar> = {
    etaj: "etaj", etajeTotal: "etajeTotal", anConstructie: "anConstructie", clasaEnergetica: "clasaEnergetica", bai: "bai",
    balcon: "balcon", balconInchis: "balcon", balconMp: "balcon", incalzire: "incalzire", mobilare: "mobilare",
    aerConditionat: "aerConditionat", suprafataTotala: "suprafataTotala", compartimentare: "compartimentare", stare: "stare",
    dotari: "dotari",
  };
  for (const [k, x] of Object.entries(r) as [keyof CampuriCaracteristici, never][]) {
    if (!areCamp(tip, pe[k])) continue;
    if (k === "dotari") {
      const permise = new Set<string>(dotariTip(tip));
      const d = (x as string[]).filter((y) => permise.has(y));
      if (d.length) out.dotari = d;
    } else out[k] = x;
  }
  return out;
}

/**
 * La actualizarea automată (feed / pagina agenției): ce vine structurat din sursă înlocuiește; ce e doar ghicit
 * din descriere completează numai câmpurile goale. Ce lipsește din sursă nu șterge ce a completat omul de mână.
 */
export function actualizareCaracteristici(
  vechi: Partial<CampuriCaracteristici>,
  dinSursa: Partial<CampuriCaracteristici>,
  dinDescriere: Partial<CampuriCaracteristici>,
): Partial<CampuriCaracteristici> {
  const r: Partial<CampuriCaracteristici> = {};
  for (const [k, x] of Object.entries(dinDescriere) as [keyof CampuriCaracteristici, never][]) {
    const v = vechi[k];
    if (v === null || v === undefined || (Array.isArray(v) && !v.length)) r[k] = x;
  }
  return { ...r, ...dinSursa };
}

// ---------- Formular ----------

/** Valorile câmpurilor ca text, pentru formular (dotările despărțite prin virgulă). */
export function valoriCaracteristici(c: Partial<CampuriCaracteristici>): Record<string, string> {
  const v: Record<string, string> = {};
  for (const [k, x] of Object.entries(c)) {
    if (x === null || x === undefined) continue;
    if (Array.isArray(x)) {
      if (x.length) v[k] = x.join(",");
    } else if (typeof x === "boolean") v[k] = x ? "da" : "nu";
    else v[k] = String(x);
  }
  if (v.balconInchis === "nu") delete v.balconInchis;
  return v;
}

/** Câmpurile completate ale unui anunț din bază (fără null și fără liste goale). */
export function caracteristiciSalvate(a: Partial<CampuriCaracteristici>): Completate {
  const r: Partial<CampuriCaracteristici> = {};
  for (const k of CHEI_CARACTERISTICI) if (k in a) (r as Record<string, unknown>)[k] = a[k];
  return curat(r) as Completate;
}

/** Doar câmpurile completate (fără null). */
export type Completate = { [K in keyof CampuriCaracteristici]?: NonNullable<CampuriCaracteristici[K]> };

// ---------- Pagina anunțului ----------

const textEtaj = (e: number) => (e === -1 ? "Demisol" : e === 0 ? "Parter" : String(e));

/**
 * Blocul „Caracteristici”: întâi câmpurile salvate; din descriere doar pentru câmpurile goale (anunțuri vechi,
 * feed-uri fără câmpurile respective). Doar câmpurile care se aplică tipului.
 */
export function caracteristiciAfisate(
  a: { tip: string; descriere: string } & Partial<CampuriCaracteristici>,
  acum = new Date(),
): Caracteristici {
  const x = extrageCaracteristici(a.descriere, acum);
  const s = caracteristiciSalvate(a);
  const c: Caracteristici = {};
  const tip = a.tip;
  if (areCamp(tip, "etaj")) {
    if (s.etaj !== undefined) c.etaj = s.etajeTotal !== undefined ? `${textEtaj(s.etaj)}/${s.etajeTotal}` : textEtaj(s.etaj);
    else if (x.etaj) c.etaj = x.etaj;
    else if (s.etajeTotal !== undefined) c.regimInaltime = s.etajeTotal === 0 ? "Parter" : `P+${s.etajeTotal}`;
  }
  if (tip === "casa" && s.etajeTotal) c.niveluri = s.etajeTotal;
  if (areCamp(tip, "anConstructie")) {
    if (s.anConstructie !== undefined) {
      if (s.anConstructie !== AN_NECUNOSCUT) c.anConstructie = s.anConstructie;
    } else if (x.anConstructie) c.anConstructie = x.anConstructie;
  }
  if (areCamp(tip, "clasaEnergetica")) {
    const v = s.clasaEnergetica ? eticheteClasa(s.clasaEnergetica) : x.clasaEnergetica;
    if (v) c.clasaEnergetica = v;
  }
  if (areCamp(tip, "bai")) {
    const v = s.bai ?? x.bai;
    if (v) c.bai = v;
  }
  if (areCamp(tip, "balcon")) {
    if (s.balcon !== undefined) c.balcon = s.balcon ? ["Da", s.balconInchis ? "închis" : "", s.balconMp ? `${s.balconMp} m²` : ""].filter(Boolean).join(", ") : "Nu";
    else if (x.balcon) c.balcon = x.balcon;
  }
  if (areCamp(tip, "incalzire")) {
    const v = s.incalzire ? INCALZIRE[s.incalzire as keyof typeof INCALZIRE] : x.incalzire;
    if (v) c.incalzire = v;
  }
  if (areCamp(tip, "mobilare")) {
    const v = s.mobilare ? MOBILARE[s.mobilare as keyof typeof MOBILARE] : x.mobilare;
    if (v) c.mobilare = v;
  }
  if (areCamp(tip, "aerConditionat")) {
    if (s.aerConditionat !== undefined) c.aerConditionat = s.aerConditionat === 0 ? "Nu" : s.aerConditionat === 1 ? "Da" : `Da, ${s.aerConditionat} aparate`;
    else if (x.aerConditionat) c.aerConditionat = x.aerConditionat;
  }
  if (areCamp(tip, "suprafataTotala")) {
    const v = s.suprafataTotala ?? x.suprafataTotala;
    if (v) c.suprafataTotala = v;
  }
  // Suprafața utilă din descriere doar schimbă eticheta (anunțul are deja suprafața utilă).
  if (x.suprafataUtila) c.suprafataUtila = x.suprafataUtila;
  if (areCamp(tip, "compartimentare")) {
    const v = s.compartimentare ? COMPARTIMENTARE[s.compartimentare as keyof typeof COMPARTIMENTARE] : x.compartimentare;
    if (v) c.compartimentare = v;
  }
  if (areCamp(tip, "stare")) {
    const v = s.stare ? STARE[s.stare as keyof typeof STARE] : x.stare;
    if (v) c.stare = v;
  }
  if (areCamp(tip, "dotari")) {
    const permise = new Set<string>(dotariTip(tip));
    const d = (s.dotari?.length ? s.dotari : x.dotari ?? []).filter((y) => permise.has(y)) as Dotare[];
    if (d.length) c.dotari = d;
  }
  return c;
}
