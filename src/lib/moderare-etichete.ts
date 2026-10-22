// Separat de moderare.ts, ca să poată fi importat și în componentele din browser.
export const MOTIVE_RAPORTARE = {
  nepotrivit: "Conținut nepotrivit sau jignitor",
  inselatorie: "Anunț fals sau tentativă de înșelătorie",
  indisponibil: "Proprietatea nu mai e disponibilă",
  contact: "Date de contact greșite",
  altceva: "Altceva",
} as const;
export type MotivRaportare = keyof typeof MOTIVE_RAPORTARE;
