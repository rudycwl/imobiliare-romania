// Unitățile unui proiect de dezvoltator (apartamente, case, spații), fără acces la baza de date, ca să poată fi testate.

export type StareUnitate = "disponibil" | "rezervat" | "vandut";

export const STARI_UNITATE: Record<StareUnitate, string> = {
  disponibil: "Disponibil",
  rezervat: "Rezervat",
  vandut: "Vândut",
};

export type Unitate = {
  tip: string;
  camere: number | null;
  /** m² utili */
  suprafata: number;
  /** Euro; null = preț la cerere. */
  pret: number | null;
  etaj?: string;
  stare: StareUnitate;
};

export const MAX_UNITATI = 500;

const fara = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Starea scrisă de administrator, cu sau fără diacritice („vândut”, „vandut”, „Rezervat”). */
export function stareUnitate(s: string): StareUnitate | null {
  const v = fara(s);
  if (!v || v === "disponibil" || v === "disponibila" || v === "liber") return "disponibil";
  if (v === "rezervat" || v === "rezervata") return "rezervat";
  if (v === "vandut" || v === "vanduta") return "vandut";
  return null;
}

/** Numerele scrise ca „89.000”, „89 000”, „89000 €” sau „54,5”; gol = null. */
function numar(s: string) {
  let curat = s.replace(/[\s€]/g, "");
  curat = /^\d{1,3}(\.\d{3})+$/.test(curat) ? curat.replace(/\./g, "") : curat.replace(",", ".");
  if (!curat) return null;
  const n = Number(curat);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/**
 * Citește unitățile din textul din panou: câte una pe rând, câmpurile separate prin „;”:
 * tip; camere; suprafață (m²); preț (€); etaj; stare. Ex.: „Apartament; 2; 54; 89000; 3; disponibil”.
 * Etajul și starea pot lipsi (starea implicită: disponibil); prețul gol înseamnă „la cerere”.
 */
export function parseazaUnitati(text: string): { unitati: Unitate[]; eroare?: string } {
  const unitati: Unitate[] = [];
  const randuri = text.split(/\r?\n/);
  for (const [i, rand] of randuri.entries()) {
    if (!rand.trim()) continue;
    const nr = `Rândul ${i + 1} din unități`;
    const [tip = "", camere = "", suprafata = "", pret = "", etaj = "", stare = ""] = rand.split(";").map((c) => c.trim());
    if (!tip) return { unitati, eroare: `${nr}: lipsește tipul (ex. Apartament).` };
    const c = numar(camere);
    const s = numar(suprafata);
    const p = numar(pret.replace(/la\s*cerere/i, ""));
    if (Number.isNaN(c) || (c !== null && !Number.isInteger(c))) return { unitati, eroare: `${nr}: numărul de camere nu e valid.` };
    if (s === null || Number.isNaN(s) || s <= 0) return { unitati, eroare: `${nr}: suprafața trebuie să fie un număr de m².` };
    if (Number.isNaN(p)) return { unitati, eroare: `${nr}: prețul trebuie să fie un număr (în euro) sau gol.` };
    const st = stareUnitate(stare);
    if (!st) return { unitati, eroare: `${nr}: starea poate fi doar disponibil, rezervat sau vândut.` };
    unitati.push({ tip: tip.slice(0, 60), camere: c, suprafata: s, pret: p === null ? null : Math.round(p), ...(etaj ? { etaj: etaj.slice(0, 20) } : {}), stare: st });
    if (unitati.length > MAX_UNITATI) return { unitati, eroare: `Cel mult ${MAX_UNITATI} de unități pe proiect.` };
  }
  return { unitati };
}

/** Textul pentru panou, invers față de parseazaUnitati. */
export function unitatiInText(unitati: Unitate[]) {
  return unitati
    .map((u) => [u.tip, u.camere ?? "", u.suprafata, u.pret ?? "", u.etaj ?? "", u.stare].join("; "))
    .join("\n");
}

/** Unitățile din coloana JSON, cu orice valoare greșită lăsată deoparte (datele vin din baza de date). */
export function unitatiDinJson(v: unknown): Unitate[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x): Unitate[] => {
    if (!x || typeof x !== "object") return [];
    const u = x as Record<string, unknown>;
    const stare = typeof u.stare === "string" ? stareUnitate(u.stare) : "disponibil";
    if (typeof u.tip !== "string" || typeof u.suprafata !== "number" || !stare) return [];
    return [{
      tip: u.tip,
      camere: typeof u.camere === "number" ? u.camere : null,
      suprafata: u.suprafata,
      pret: typeof u.pret === "number" ? u.pret : null,
      ...(typeof u.etaj === "string" && u.etaj ? { etaj: u.etaj } : {}),
      stare,
    }];
  });
}

export const disponibile = (unitati: Unitate[]) => unitati.filter((u) => u.stare === "disponibil").length;

/** Cel mai mic preț dintre unitățile disponibile (null dacă nu e niciunul afișat). */
export function pretMinim(unitati: Unitate[]) {
  const preturi = unitati.filter((u) => u.stare === "disponibil" && u.pret !== null).map((u) => u.pret!);
  return preturi.length ? Math.min(...preturi) : null;
}

/** Sfârșitul perioadei gratuite: data de pornire plus lunile gratuite. */
export function finalGratuit(start: Date, luni: number) {
  const d = new Date(start);
  d.setMonth(d.getMonth() + luni);
  return d;
}

/** „1 unitate disponibilă”, „5 unități disponibile”, „20 de unități disponibile”. */
export function textDisponibile(n: number) {
  const rest = n % 100;
  if (n === 1) return "1 unitate disponibilă";
  return `${new Intl.NumberFormat("ro-RO").format(n)} ${n >= 20 && (rest === 0 || rest >= 20) ? "de " : ""}unități disponibile`;
}
