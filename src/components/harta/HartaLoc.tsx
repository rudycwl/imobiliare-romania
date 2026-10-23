"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { hartaNoua, incarcaLeaflet, pinSimplu } from "./leaflet";

/** Harta mică de pe pagina anunțului, cu locul proprietății. */
export function HartaLoc({ lat, lng }: { lat: number; lng: number }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anulat = false;
    let curata = () => {};
    incarcaLeaflet().then((L) => {
      if (anulat || !el.current) return;
      const h = hartaNoua(L, el.current, { scrollWheelZoom: false });
      h.setView([lat, lng], 15);
      L.marker([lat, lng], { icon: pinSimplu(L), keyboard: false }).addTo(h);
      curata = () => h.remove();
    });
    return () => {
      anulat = true;
      curata();
    };
  }, [lat, lng]);
  return <div ref={el} className="harta harta-mica" role="region" aria-label="Locul pe hartă" />;
}
