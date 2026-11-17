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

// Satelit: Esri World Imagery prin ArcGIS Location Platform (necesită cheie API; vezi README).
// Fără NEXT_PUBLIC_ARCGIS_KEY, comutatorul nu apare și harta rămâne doar OSM.
const CHEIE_ARCGIS = process.env.NEXT_PUBLIC_ARCGIS_KEY ?? "";
export const STRAT_SATELIT = "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
// Etichetele (străzi, localități) peste imagine: plăci de 512 px, deci zoomOffset -1.
export const STRAT_ETICHETE =
  "https://static-map-tiles-api.arcgis.com/arcgis/rest/services/static-basemap-tiles-service/v1/arcgis/imagery/labels/static/tile/{z}/{y}/{x}";
export const ATRIBUIRE_SATELIT = "Tiles &copy; Esri &mdash; Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community";

export function areSatelit(cheie = CHEIE_ARCGIS) {
  return cheie.trim().length > 0;
}

/** Fundalul hărții: harta obișnuită (OSM, implicit) sau satelit (Esri). */
function fundaluri(L: L, cheie: string) {
  const harta = L.tileLayer(STRAT, { maxZoom: 19, attribution: ATRIBUIRE });
  const token = { token: cheie };
  const satelit = L.layerGroup([
    L.tileLayer(`${STRAT_SATELIT}?token={token}`, { ...token, maxZoom: 19, maxNativeZoom: 18, attribution: ATRIBUIRE_SATELIT }),
    L.tileLayer(`${STRAT_ETICHETE}?token={token}`, { ...token, maxZoom: 19, tileSize: 512, zoomOffset: -1 }),
  ]);
  return { harta, satelit };
}

/** Butonul „Satelit / Hartă” din colțul hărții: arată mereu stratul în care treci. */
function comutatorFundal(L: L, harta: Leaflet.Map, fundal: ReturnType<typeof fundaluri>) {
  let peSatelit = false;
  const Control = L.Control.extend({
    onAdd() {
      const div = L.DomUtil.create("div", "leaflet-bar comutator-fundal");
      const buton = L.DomUtil.create("button", "", div);
      buton.type = "button";
      const arata = () => {
        buton.textContent = peSatelit ? "Hartă" : "Satelit";
        buton.title = peSatelit ? "Arată harta obișnuită" : "Arată imaginea din satelit";
        buton.setAttribute("aria-pressed", String(peSatelit));
        div.classList.toggle("activ", peSatelit);
      };
      arata();
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.on(buton, "click", (e) => {
        L.DomEvent.preventDefault(e);
        peSatelit = !peSatelit;
        harta.removeLayer(peSatelit ? fundal.harta : fundal.satelit);
        (peSatelit ? fundal.satelit : fundal.harta).addTo(harta);
        arata();
      });
      return div;
    },
  });
  new Control({ position: "topright" }).addTo(harta);
}

export function hartaNoua(L: L, el: HTMLElement, optiuni: Leaflet.MapOptions = {}) {
  const harta = L.map(el, { scrollWheelZoom: true, ...optiuni });
  const fundal = fundaluri(L, CHEIE_ARCGIS);
  fundal.harta.addTo(harta);
  if (areSatelit()) comutatorFundal(L, harta, fundal);
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
