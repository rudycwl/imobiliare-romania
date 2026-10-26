// Anunțurile trimise prin API au aceleași câmpuri ca fișierul model de import (public/model-import-cheiamea.csv).
// Aici doar le aducem la forma unui rând din fișier; verificarea câmpurilor e aceeași ca la import.

export const CAMPURI_API = ["titlu", "descriere", "tip", "tranzactie", "pret", "suprafata", "camere", "judet", "oras", "zona", "poze"] as const;

/** Un anunț din JSON → rând de import. Câmpurile necunoscute se ignoră; „poze” poate fi listă sau text. */
export function randDinJson(a: unknown): Record<string, string> {
  if (!a || typeof a !== "object" || Array.isArray(a)) return {};
  const o = a as Record<string, unknown>;
  const rand: Record<string, string> = {};
  for (const c of CAMPURI_API) {
    const v = o[c];
    if (c === "poze" && Array.isArray(v)) rand.poze = v.filter((x) => typeof x === "string").join(" ");
    // Numerele le rotunjim aici: la import, punctul e citit ca separator de mii (85.000), nu de zecimale.
    else if (typeof v === "number" && Number.isFinite(v)) rand[c] = String(Math.round(v));
    else if (typeof v === "string") rand[c] = v;
  }
  return rand;
}
