import { createHash, timingSafeEqual } from "node:crypto";

/** Cheia ERP-ului Hugetech (antetul X-ERP-Key = ERP_KEY din pagina /configurare), comparată în timp constant. */
export function cheieBuna(primita: string | null) {
  const asteptata = process.env.ERP_KEY?.trim();
  if (!asteptata || !primita) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(primita), h(asteptata));
}
