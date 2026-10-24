// Lungimile maxime ale textelor scrise de utilizatori. Formularele au aceleași limite (maxLength),
// dar serverul le verifică din nou: cererile pot veni și ocolind formularul.
export const LUNGIME = {
  titlu: 150,
  descriere: 8000,
  zona: 80,
  nume: 120,
  email: 200,
  adresa: 200,
  regCom: 40,
  parola: 200,
} as const;

/** Mesajul de eroare dacă vreun câmp e prea lung, altfel null. */
export function preaLung(campuri: [eticheta: string, valoare: string | null | undefined, max: number][]) {
  const c = campuri.find(([, v, max]) => (v?.length ?? 0) > max);
  return c ? `${c[0]} poate avea cel mult ${c[2]} de caractere.` : null;
}
