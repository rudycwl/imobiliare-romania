// Locul anunțului pe site, cu confidențialitate: fără bifa „Arată pe site locația exactă”, punctul pus de proprietar
// (sau găsit după stradă) nu iese din server. Pe pagină și pe harta de căutare apare un punct mutat cu 80–200 m,
// același la fiecare afișare (după id), cu un cerc de 300 m care cuprinde sigur locul adevărat. Funcții pure.

export const RAZA_APROXIMATIVA_M = 300;

export type PunctPublic = { lat: number; lng: number; aproximativ: boolean } | null;

/** Număr pseudo-aleator stabil în [0, 1) după id (același anunț → același punct, deci nu se poate media). */
function stabil(id: number, sare: number): number {
  let x = (id * 2654435761 + sare * 40503) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 2246822507) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 2 ** 32;
}

export function punctPublic(a: { id: number; lat: number | null; lng: number | null; punctProprietar: boolean; locatieExacta: boolean }): PunctPublic {
  if (a.lat == null || a.lng == null) return null;
  // Centrul cartierului (găsit de noi) e deja aproximativ; îl arătăm ca zonă, nu ca pin.
  if (!a.punctProprietar) return { lat: a.lat, lng: a.lng, aproximativ: true };
  if (a.locatieExacta) return { lat: a.lat, lng: a.lng, aproximativ: false };
  const distanta = 80 + stabil(a.id, 1) * 120; // m
  const unghi = stabil(a.id, 2) * 2 * Math.PI;
  const dLat = (distanta * Math.cos(unghi)) / 111_320;
  const dLng = (distanta * Math.sin(unghi)) / (111_320 * Math.cos((a.lat * Math.PI) / 180));
  const rot = (v: number) => Math.round(v * 1e4) / 1e4;
  return { lat: rot(a.lat + dLat), lng: rot(a.lng + dLng), aproximativ: true };
}

/** Distanța în metri între două puncte (pentru teste și verificări). */
export function distantaM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
