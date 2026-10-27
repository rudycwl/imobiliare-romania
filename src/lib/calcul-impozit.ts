// Calculul impozitului pe o clădire rezidențială a unei persoane fizice, după Codul fiscal în 2026
// (art. 457 modificat prin Legea 239/2025 și OUG 9/2026). Aceleași reguli ca în REGULI_NATIONALE.

/** Valoarea impozabilă pe m², în lei: cu toate instalațiile (apă, canalizare, curent, încălzire) / fără. */
export const VALORI_MP = {
  beton: { nume: "Beton sau cărămidă arsă (bloc, casă de cărămidă)", cu: 2677, fara: 1606 },
  lemn: { nume: "Lemn, piatră, cărămidă nearsă, chirpici", cu: 803, fara: 535 },
} as const;
export type Material = keyof typeof VALORI_MP;

export const RANGURI = ["0", "I", "II", "III", "IV", "V"] as const;
export type Rang = (typeof RANGURI)[number];
export const ZONE = ["A", "B", "C", "D"] as const;
export type Zona = (typeof ZONE)[number];

/** Coeficientul de corecție, art. 457 alin. (6): rândul = zona, coloana = rangul localității. */
const COEFICIENTI: Record<Zona, number[]> = {
  A: [2.6, 2.5, 2.4, 2.3, 1.1, 1.05],
  B: [2.5, 2.4, 2.3, 2.2, 1.05, 1.0],
  C: [2.4, 2.3, 2.2, 2.1, 1.0, 0.95],
  D: [2.3, 2.2, 2.1, 2.0, 0.95, 0.9],
};
export const coeficient = (zona: Zona, rang: Rang) => COEFICIENTI[zona][RANGURI.indexOf(rang)];

/** Municipiile de rang I (Legea 351/2001); Bucureștiul are rang 0, celelalte reședințe de județ rang II. */
const RANG_I = new Set(["bacau", "brasov", "braila", "cluj-napoca", "constanta", "craiova", "galati", "iasi", "oradea", "ploiesti", "timisoara"]);
export function rangImplicit(judet: string, oras?: string): Rang {
  if (!oras) return judet === "bucuresti" ? "0" : "II";
  return RANG_I.has(oras) ? "I" : "II";
}

export type DateCladire = {
  suprafata: number;
  /** true = suprafața utilă (din actele apartamentului), care se înmulțește cu 1,4. */
  utila: boolean;
  material: Material;
  instalatii: boolean;
  zona: Zona;
  rang: Rang;
  /** 0 = sub 50 de ani, 15 = 50–100 de ani, 25 = peste 100 de ani. */
  reducereVechime: 0 | 15 | 25;
  /** Cota primăriei, în procente (ex. 0,08). */
  cota: number;
  /** Bonificația pentru plata până la 31 martie, în procente. */
  bonificatie: number;
};

const PRAG_LUX = 2_500_000;

export function calculeazaImpozit(d: DateCladire) {
  const construita = Math.max(0, d.suprafata) * (d.utila ? 1.4 : 1);
  const peMp = VALORI_MP[d.material][d.instalatii ? "cu" : "fara"];
  const valoare = construita * peMp * coeficient(d.zona, d.rang) * (1 - d.reducereVechime / 100);
  const lux = valoare > PRAG_LUX ? (valoare - PRAG_LUX) * 0.009 : 0;
  const impozit = valoare * (d.cota / 100) + lux;
  return { construita, valoare, lux, impozit, cuBonificatie: impozit * (1 - d.bonificatie / 100) };
}

/** Prima cotă procentuală dintr-un text de pe pagina orașului, ex. „0,107%” → 0.107. */
export function cotaDinText(text: string): number | undefined {
  const m = text.match(/(\d+(?:,\d+)?)\s*%/);
  return m ? Number(m[1].replace(",", ".")) : undefined;
}
