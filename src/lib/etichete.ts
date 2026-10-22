import type { Anunt, TipProprietate, TipUtilizator, Tranzactie } from "@/modules/types";

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

export const TIPURI_UTILIZATOR: Record<TipUtilizator, string> = {
  "persoana-fizica": "Persoană fizică",
  firma: "Firmă",
  agentie: "Agenție imobiliară",
};

export function esteTipUtilizator(v: unknown): v is TipUtilizator {
  return typeof v === "string" && v in TIPURI_UTILIZATOR;
}

export function formatPret(a: Pick<Anunt, "pret" | "tranzactie">) {
  const p = new Intl.NumberFormat("ro-RO").format(a.pret) + " €";
  return a.tranzactie === "inchiriere" ? `${p} / lună` : p;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
