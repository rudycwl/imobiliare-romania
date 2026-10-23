"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import type { PunctHarta } from "@/lib/anunturi";
import { TIPURI } from "@/lib/etichete";
import { hartaNoua, incarcaLeaflet, pretScurt, ROMANIA, type L } from "./leaflet";

/** Pinii mai apropiați de atât (în pixeli) se adună într-un cerc cu numărul lor. */
const GRUP_PX = 56;

function cardPopup(p: PunctHarta) {
  const a = document.createElement("a");
  a.href = `/anunt/${p.id}`;
  a.className = "popup-anunt";
  const img = document.createElement("div");
  img.className = "popup-img";
  img.style.background = p.imagine;
  const pret = document.createElement("strong");
  pret.textContent = new Intl.NumberFormat("ro-RO").format(p.pret) + (p.tranzactie === "inchiriere" ? " € / lună" : " €");
  const titlu = document.createElement("span");
  titlu.textContent = p.titlu;
  const det = document.createElement("small");
  det.textContent = `${TIPURI[p.tip as keyof typeof TIPURI] ?? ""} · ${p.suprafata} m²${p.camere ? ` · ${p.camere} cam.` : ""} · ${p.zona}`;
  a.append(img, pret, titlu, det);
  return a;
}

/**
 * Harta cu anunțuri: pin cu prețul pentru fiecare anunț, grupate în cercuri când sunt prea aproape.
 * `laMutare` primește anunțurile din zona vizibilă (pentru lista de lângă hartă).
 */
export function HartaAnunturi({
  puncte,
  laMutare,
  activ,
}: {
  puncte: PunctHarta[];
  laMutare?: (vizibile: PunctHarta[]) => void;
  /** Anunțul peste care e mouse-ul în listă: pinul lui se evidențiază. */
  activ?: number | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const stare = useRef<{ L: L; harta: Leaflet.Map; strat: Leaflet.LayerGroup; pini: Map<number, HTMLElement> } | null>(null);
  const laMutareRef = useRef(laMutare);
  laMutareRef.current = laMutare;

  useEffect(() => {
    let anulat = false;
    let curata = () => {};
    incarcaLeaflet().then((L) => {
      if (anulat || !el.current) return;
      const harta = hartaNoua(L, el.current);
      const strat = L.layerGroup().addTo(harta);
      const pini = new Map<number, HTMLElement>();
      stare.current = { L, harta, strat, pini };

      const deseneaza = () => {
        strat.clearLayers();
        pini.clear();
        const zona = harta.getBounds().pad(0.2);
        const vizibile = puncte.filter((p) => harta.getBounds().contains([p.lat, p.lng]));
        laMutareRef.current?.(vizibile);
        // Grupare simplă pe o grilă de pixeli, la zoom-ul curent.
        const grupuri = new Map<string, PunctHarta[]>();
        for (const p of puncte) {
          if (!zona.contains([p.lat, p.lng])) continue;
          const px = harta.latLngToLayerPoint([p.lat, p.lng]);
          const k = `${Math.floor(px.x / GRUP_PX)}:${Math.floor(px.y / GRUP_PX)}`;
          const g = grupuri.get(k);
          if (g) g.push(p);
          else grupuri.set(k, [p]);
        }
        for (const g of grupuri.values()) {
          // La zoom maxim (aceeași clădire) arătăm totuși pinii, nu un cerc care nu se mai poate desface.
          if (g.length > 1 && harta.getZoom() < 18) {
            const lat = g.reduce((s, p) => s + p.lat, 0) / g.length;
            const lng = g.reduce((s, p) => s + p.lng, 0) / g.length;
            const m = L.marker([lat, lng], {
              icon: L.divIcon({ className: "pin-grup", html: `<span>${g.length}</span>`, iconSize: [0, 0] }),
              title: `${g.length} anunțuri`,
              keyboard: true,
            });
            m.on("click", () => harta.fitBounds(L.latLngBounds(g.map((p) => [p.lat, p.lng])), { padding: [60, 60], maxZoom: 18 }));
            strat.addLayer(m);
            continue;
          }
          for (const p of g) {
            const m = L.marker([p.lat, p.lng], {
              icon: L.divIcon({ className: "pin-pret", html: `<span>${pretScurt(p.pret, p.tranzactie)}</span>`, iconSize: [0, 0] }),
              title: p.titlu,
              keyboard: true,
            });
            // Popup-ul ține de hartă, nu de pin: pinii se redesenează la fiecare mutare și l-ar închide.
            m.on("click", () =>
              L.popup({ offset: [0, -30], minWidth: 220, maxWidth: 260 }).setLatLng([p.lat, p.lng]).setContent(cardPopup(p)).openOn(harta),
            );
            strat.addLayer(m);
            const e = m.getElement();
            if (e) pini.set(p.id, e);
          }
        }
      };

      if (puncte.length) harta.fitBounds(L.latLngBounds(puncte.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 15 });
      else harta.setView(ROMANIA, 7);
      harta.on("moveend", deseneaza);
      deseneaza();
      curata = () => harta.remove();
    });
    return () => {
      anulat = true;
      curata();
      stare.current = null;
    };
  }, [puncte]);

  useEffect(() => {
    const pini = stare.current?.pini;
    if (!pini || activ == null) return;
    const e = pini.get(activ);
    e?.classList.add("activ");
    return () => e?.classList.remove("activ");
  }, [activ]);

  return <div ref={el} className="harta" role="region" aria-label="Harta anunțurilor" />;
}
