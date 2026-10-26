import "server-only";
import { db } from "./db";
import { BANDA } from "./continut";

// Textele pe care Rudy le schimbă singur din /admin/texte. Ce nu e salvat în baza de date rămâne textul implicit de aici.

export type ElementBanda = { eticheta: string; text: string; href: string };
export type Texte = {
  /** Bara de sus, pe toate paginile. Gol = nu apare. */
  anuntText: string;
  anuntLink: string;
  erouSupratitlu: string;
  erouDescriere: string;
  banda: ElementBanda[];
};

export const NR_BANDA = 6;

export const IMPLICIT: Texte = {
  anuntText: "",
  anuntLink: "",
  erouSupratitlu: "Anunțuri imobiliare din toată țara",
  erouDescriere: "Anunțuri din toată țara, direct de la proprietari, firme și agenții. Vezi clar cine vinde.",
  banda: BANDA,
};

const CHEI = ["anuntText", "anuntLink", "erouSupratitlu", "erouDescriere", "banda"] as const;

/** Textele curente. Dacă baza de date nu răspunde, site-ul merge mai departe cu textele implicite. */
export async function citesteTexte(): Promise<Texte> {
  try {
    const randuri = await db.setare.findMany({ where: { cheie: { in: [...CHEI] } } });
    const t: Texte = { ...IMPLICIT };
    for (const r of randuri) {
      if (r.cheie === "banda") {
        const b = JSON.parse(r.valoare) as ElementBanda[];
        if (Array.isArray(b)) t.banda = b;
      } else t[r.cheie as Exclude<(typeof CHEI)[number], "banda">] = r.valoare;
    }
    return t;
  } catch {
    return IMPLICIT;
  }
}

/** Linkurile din texte: doar pagini din site („/…”) sau adrese https. */
export const linkSigur = (l: string) => (/^\/(?![\/\\])/.test(l) || /^https:\/\/[^\s]+$/.test(l) ? l : "");

export async function salveazaTexte(t: Texte) {
  const valori: Record<string, string> = {
    anuntText: t.anuntText,
    anuntLink: t.anuntLink,
    erouSupratitlu: t.erouSupratitlu,
    erouDescriere: t.erouDescriere,
    banda: JSON.stringify(t.banda),
  };
  await db.$transaction(
    Object.entries(valori).map(([cheie, valoare]) => db.setare.upsert({ where: { cheie }, create: { cheie, valoare }, update: { valoare } })),
  );
}

export async function revinoLaImplicit() {
  await db.setare.deleteMany({ where: { cheie: { in: [...CHEI] } } });
}
