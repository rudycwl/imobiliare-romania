import "server-only";
import { db } from "./db";
import { activ } from "./anunturi";

/** Sub atâtea anunțuri nu afișăm o medie: ar fi prețul unui singur vânzător, nu al zonei. */
export const MIN_ANUNTURI = 3;

type Rand = { zona: string; tip: string; tranzactie: string; pret: number; suprafata: number; camere: number | null };

/** Prețuri cerute plauzibile; restul sunt greșeli de tastare (ex. preț în lei, suprafață 1 m²). */
const pretMpValid = (r: Rand) => r.suprafata >= 10 && r.pret / r.suprafata >= 150 && r.pret / r.suprafata <= 15000;
const chirieValida = (r: Rand) => r.pret >= 50 && r.pret <= 10000;

function mediana(v: number[]) {
  if (v.length < MIN_ANUNTURI) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
}

/** „Cartierul Tătărași”, „tatarasi ”, „Zona Tătărași” → aceeași cheie. */
export function cheieZona(zona: string) {
  return zona
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^\s*(cartier(ul)?|zona|zone|bulevardul|bd\.?|strada|str\.?)\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function statistici(rows: Rand[]) {
  const apV = rows.filter((r) => r.tip === "apartament" && r.tranzactie === "vanzare" && pretMpValid(r));
  const apC = rows.filter((r) => r.tip === "apartament" && r.tranzactie === "inchiriere" && chirieValida(r));
  const caseV = rows.filter((r) => r.tip === "casa" && r.tranzactie === "vanzare" && pretMpValid(r));
  const mp = apV.map((r) => r.pret / r.suprafata);
  return {
    total: rows.length,
    apartamenteVanzare: apV.length,
    /** Mediana €/m² la apartamentele de vânzare. */
    pretMp: mediana(mp),
    pretMpMin: mp.length >= MIN_ANUNTURI ? Math.round(Math.min(...mp)) : null,
    pretMpMax: mp.length >= MIN_ANUNTURI ? Math.round(Math.max(...mp)) : null,
    apartamenteChirie: apC.length,
    chirie: mediana(apC.map((r) => r.pret)),
    caseVanzare: caseV.length,
    pretMpCase: mediana(caseV.map((r) => r.pret / r.suprafata)),
  };
}

export type StatisticiIndice = ReturnType<typeof statistici>;

const CAMERE = [1, 2, 3, 4] as const;

/** Indicele prețurilor dintr-un oraș: pe tot orașul, pe număr de camere și pe fiecare cartier. */
export async function indiceOras(judet: string, oras: string) {
  const rows: Rand[] = await db.anunt.findMany({
    where: { judet, oras, ...activ() },
    select: { zona: true, tip: true, tranzactie: true, pret: true, suprafata: true, camere: true },
  });

  const grupuri = new Map<string, { nume: Map<string, number>; rows: Rand[] }>();
  for (const r of rows) {
    const k = cheieZona(r.zona) || "fara zona";
    const g = grupuri.get(k) ?? { nume: new Map<string, number>(), rows: [] as Rand[] };
    const n = r.zona.trim();
    g.nume.set(n, (g.nume.get(n) ?? 0) + 1);
    g.rows.push(r);
    grupuri.set(k, g);
  }
  const cartiere = [...grupuri.values()]
    .map((g) => ({
      // Numele scris cel mai des (cu diacritice, de obicei).
      nume: [...g.nume.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0][0] || "Fără zonă",
      ...statistici(g.rows),
    }))
    .sort((a, b) => (b.pretMp ?? -1) - (a.pretMp ?? -1) || b.total - a.total);

  const peCamere = CAMERE.map((c) => {
    const ap = rows.filter((r) => r.tip === "apartament" && (c === 4 ? (r.camere ?? 0) >= 4 : r.camere === c));
    const v = ap.filter((r) => r.tranzactie === "vanzare" && pretMpValid(r));
    return {
      camere: c,
      pretVanzare: mediana(v.map((r) => r.pret)),
      vanzare: v.length,
      chirie: mediana(ap.filter((r) => r.tranzactie === "inchiriere" && chirieValida(r)).map((r) => r.pret)),
      inchiriere: ap.filter((r) => r.tranzactie === "inchiriere").length,
    };
  });

  return { oras: statistici(rows), peCamere, cartiere };
}

/** Orașele cu anunțuri, cu prețurile lor mediane, pentru pagina generală a indicelui. */
export async function indiceOrase() {
  const rows = await db.anunt.findMany({
    where: activ(),
    select: { judet: true, oras: true, zona: true, tip: true, tranzactie: true, pret: true, suprafata: true, camere: true },
  });
  const pe = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = `${r.judet}/${r.oras}`;
    const l = pe.get(k);
    if (l) l.push(r);
    else pe.set(k, [r]);
  }
  return [...pe.entries()]
    .map(([k, rs]) => {
      const [judet, oras] = k.split("/");
      return { judet, oras, ...statistici(rs) };
    })
    .sort((a, b) => b.total - a.total);
}
