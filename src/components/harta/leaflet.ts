import type * as Leaflet from "leaflet";

export type L = typeof Leaflet;

// Hărțile OpenStreetMap: gratuite, cu atribuirea afișată pe hartă (obligatorie).
export const STRAT = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const ATRIBUIRE = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
export const ROMANIA: [number, number] = [45.94, 24.97];

/** Leaflet folosește `window`, deci se încarcă doar în browser, la nevoie. */
export async function incarcaLeaflet(): Promise<L> {
  const m = await import("leaflet");
  return (m as unknown as { default?: L }).default ?? m;
}

export function hartaNoua(L: L, el: HTMLElement, optiuni: Leaflet.MapOptions = {}) {
  const harta = L.map(el, { scrollWheelZoom: true, ...optiuni });
  L.tileLayer(STRAT, { maxZoom: 19, attribution: ATRIBUIRE }).addTo(harta);
  harta.attributionControl.setPrefix(false);
  return harta;
}

/** Prețul scurt de pe pin: 85k €, 1,2 mil. €, 450 €/lună. */
export function pretScurt(pret: number, tranzactie: string) {
  if (tranzactie === "inchiriere") return `${new Intl.NumberFormat("ro-RO").format(pret)} €/lună`;
  if (pret >= 1e6) return `${(pret / 1e6).toLocaleString("ro-RO", { maximumFractionDigits: 1 })} mil. €`;
  if (pret >= 1e4) return `${Math.round(pret / 1e3)}k €`;
  return `${new Intl.NumberFormat("ro-RO").format(pret)} €`;
}

/** Pin simplu (portocaliu), pentru un singur loc. */
export function pinSimplu(L: L) {
  return L.divIcon({ className: "pin-loc", html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 22] });
}
