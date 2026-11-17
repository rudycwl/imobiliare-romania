"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { hartaNoua, incarcaLeaflet, pinSimplu } from "./leaflet";

/**
 * Harta mică de pe pagina anunțului, centrată pe locul proprietății. Cu `razaAproximativa` (m) arată doar zona:
 * un cerc, fără pin (punctul primit e deja mutat aleator pe server, deci centrul cercului nu e adresa).
 */
export function HartaLoc({ lat, lng, razaAproximativa }: { lat: number; lng: number; razaAproximativa?: number }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anulat = false;
    let curata = () => {};
    incarcaLeaflet().then((L) => {
      if (anulat || !el.current) return;
      const h = hartaNoua(L, el.current, { scrollWheelZoom: false });
      if (razaAproximativa) {
        // Întâi vederea (cercul își calculează marginile doar pe o hartă cu vedere), apoi cercul.
        h.fitBounds(L.latLng(lat, lng).toBounds(razaAproximativa * 2), { padding: [24, 24], maxZoom: 16 });
        L.circle([lat, lng], { radius: razaAproximativa, color: "#f97316", weight: 2, fillColor: "#f97316", fillOpacity: 0.18 }).addTo(h);
      } else {
        h.setView([lat, lng], 16);
        L.marker([lat, lng], { icon: pinSimplu(L), keyboard: false }).addTo(h);
      }
      curata = () => h.remove();
    });
    return () => {
      anulat = true;
      curata();
    };
  }, [lat, lng, razaAproximativa]);
  return <div ref={el} className="harta harta-mica" role="region" aria-label={razaAproximativa ? "Zona aproximativă pe hartă" : "Locul pe hartă"} />;
}
