"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { gasesteLoc } from "@/app/cont/anunt-nou/harta";
import { hartaNoua, incarcaLeaflet, pinSimplu, ROMANIA } from "./leaflet";

type Punct = { lat: number; lng: number };

/**
 * Harta din formularul de anunț: proprietarul apasă unde e locuința (poate fi aproximativ).
 * Harta se mută singură pe cartierul ales. Fără punct, anunțul apare în centrul cartierului.
 */
export function AlegePunct({ initial }: { initial?: Punct | null }) {
  const el = useRef<HTMLDivElement>(null);
  const [punct, setPunct] = useState<Punct | null>(initial ?? null);
  const harta = useRef<{ L: typeof Leaflet; h: Leaflet.Map; pin?: Leaflet.Marker } | null>(null);
  const punctRef = useRef(punct);
  punctRef.current = punct;

  useEffect(() => {
    let anulat = false;
    let curata = () => {};
    incarcaLeaflet().then((L) => {
      if (anulat || !el.current) return;
      const h = hartaNoua(L, el.current, { scrollWheelZoom: false });
      harta.current = { L, h };
      if (initial) {
        h.setView([initial.lat, initial.lng], 16);
        setPunct({ ...initial }); // desenează pinul acum, că harta există
      } else h.setView(ROMANIA, 6);
      h.on("click", (e: Leaflet.LeafletMouseEvent) => setPunct({ lat: e.latlng.lat, lng: e.latlng.lng }));

      // Când se schimbă orașul sau cartierul, harta merge acolo (dacă proprietarul n-a pus încă punctul).
      const form = el.current.closest("form");
      const centreaza = async () => {
        if (!form || punctRef.current) return;
        const f = new FormData(form);
        const [judet, oras] = [String(f.get("judet") ?? ""), String(f.get("oras") ?? "")];
        if (!judet || !oras) return;
        const p = await gasesteLoc(String(f.get("zona") ?? ""), judet, oras);
        if (p && !punctRef.current && harta.current) harta.current.h.setView([p.lat, p.lng], String(f.get("zona") ?? "").trim() ? 15 : 13);
      };
      const laSchimbare = (e: Event) => {
        const n = (e.target as HTMLInputElement | null)?.name;
        if (n === "judet" || n === "oras" || n === "zona") centreaza();
      };
      form?.addEventListener("change", laSchimbare);
      if (!initial) centreaza();
      curata = () => {
        form?.removeEventListener("change", laSchimbare);
        h.remove();
      };
    });
    return () => {
      anulat = true;
      curata();
      harta.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- harta se creează o singură dată
  }, []);

  useEffect(() => {
    const s = harta.current;
    if (!s) return;
    if (!punct) {
      s.pin?.remove();
      s.pin = undefined;
      return;
    }
    if (s.pin) s.pin.setLatLng(punct);
    else {
      s.pin = s.L.marker(punct, { icon: pinSimplu(s.L), draggable: true, title: "Locul proprietății" }).addTo(s.h);
      s.pin.on("dragend", () => {
        const p = s.pin!.getLatLng();
        setPunct({ lat: p.lat, lng: p.lng });
      });
    }
  }, [punct]);

  return (
    <div className="alege-punct">
      <span className="eticheta">Locul pe hartă <span className="muted small">(opțional)</span></span>
      <span className="muted small">
        Apasă pe hartă unde e proprietatea. Poate fi aproximativ, de exemplu strada. Dacă nu pui punctul, anunțul apare pe hartă în centrul cartierului.
      </span>
      <div ref={el} className="harta harta-mica" />
      {punct && (
        <button type="button" className="link-mic" onClick={() => setPunct(null)}>
          Șterge punctul
        </button>
      )}
      <input type="hidden" name="lat" value={punct ? punct.lat.toFixed(5) : ""} />
      <input type="hidden" name="lng" value={punct ? punct.lng.toFixed(5) : ""} />
    </div>
  );
}
