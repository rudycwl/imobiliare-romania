import { slugify } from "./etichete";

// Aceeași proprietate la mai multe agenții: anunțurile din același oraș și cartier, de același tip, pentru aceeași
// tranzacție și cu același număr de camere au aceeași cheie; pe pagina anunțului le comparăm apoi suprafața (±3%).

type Date_ = { judet: string; oras: string; zona: string; tip: string; tranzactie: string; camere: number | null };

export function cheieProprietate(a: Date_) {
  return [a.judet, a.oras, slugify(a.zona) || "-", a.tip, a.tranzactie, a.camere ?? 0].join("|");
}

/** Două suprafețe sunt „aceeași proprietate” dacă diferă cu cel mult 3% (minimum 1 m²). */
export function suprafataApropiata(a: number, b: number) {
  return Math.abs(a - b) <= Math.max(1, Math.max(a, b) * 0.03);
}
