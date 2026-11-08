// Evoluția prețului unui anunț, din istoric (src/lib/anunturi.ts → istoricPret). Fără acces la baza de date, ca să poată fi testată.

type Punct = { pret: number; la: Date };

export function evolutiePret(istoric: Punct[], pretCurent: number, publicatLa: Date, acum = new Date()) {
  // Schimbările consecutive cu același preț se comasează.
  const schimbari: Punct[] = [];
  for (const p of istoric) if (schimbari.at(-1)?.pret !== p.pret) schimbari.push(p);
  if (schimbari.at(-1)?.pret !== pretCurent) schimbari.push({ pret: pretCurent, la: acum });
  const maxim = Math.max(...schimbari.map((p) => p.pret));
  const procent = maxim > pretCurent ? Math.round(((maxim - pretCurent) / maxim) * 100) : 0;
  return {
    schimbari: schimbari.slice(-6),
    // Scăderile sub 1% nu le afișăm (rotunjiri, curs).
    scadere: procent >= 1 ? { procent, dela: maxim } : null,
    zile: Math.max(1, Math.ceil((acum.getTime() - publicatLa.getTime()) / 864e5)),
  };
}
