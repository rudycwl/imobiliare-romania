"use client";

import "leaflet/dist/leaflet.css";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { gasesteLoc, gasesteLocAdresa, stradaLaPunct } from "@/app/cont/anunt-nou/harta";
import { cerintaLocatie } from "@/lib/caracteristici-liste";
import { hartaNoua, incarcaLeaflet, pinSimplu, ROMANIA } from "./leaflet";

type Punct = { lat: number; lng: number };

/** Geocodarea folosită de hartă; implicit acțiunile de server (pagina de probă o înlocuiește). */
export type Geocodor = {
  loc: (zona: string, judet: string, oras: string) => Promise<Punct | null>;
  adresa: (strada: string, numar: string, judet: string, oras: string) => Promise<(Punct & { exact: boolean }) | null>;
  invers: (lat: number, lng: number) => Promise<{ strada: string; numar: string } | null>;
};
export const GeocodareContext = createContext<Geocodor>({ loc: gasesteLoc, adresa: gasesteLocAdresa, invers: stradaLaPunct });

export const ZOOM_LOCALITATE = 13;
export const ZOOM_ZONA = 15;
export const ZOOM_ADRESA = 17;
const PAUZA_TASTARE = 800;

type Stare = { tip: "cauta" } | { tip: "gasit"; exact: boolean } | { tip: "negasit"; localitate: string } | null;

/**
 * Locul pe hartă, în formularul de anunț. Harta merge singură pe localitatea aleasă (zoom 13), apoi pe zonă (15),
 * apoi pe adresă (17) când se scriu strada și numărul. Pinul se poate trage; un clic pe hartă îl mută
 * (și completează strada, dacă e goală). Pe site, fără bifa „locația exactă”, apare doar zona (cerc de ~300 m).
 */
export function AlegePunct({
  initial,
  tip,
  adresa,
  eroareStrada,
}: {
  initial?: Punct | null;
  tip: string;
  adresa?: { strada?: string; numar?: string; locatieExacta?: boolean };
  eroareStrada?: string;
}) {
  const geo = useContext(GeocodareContext);
  const el = useRef<HTMLDivElement>(null);
  const [punct, setPunct] = useState<Punct | null>(initial ?? null);
  const [strada, setStrada] = useState(adresa?.strada ?? "");
  const [numar, setNumar] = useState(adresa?.numar ?? "");
  const [exacta, setExacta] = useState(!!adresa?.locatieExacta);
  const [stare, setStare] = useState<Stare>(null);
  const harta = useRef<{ L: typeof Leaflet; h: Leaflet.Map; pin?: Leaflet.Marker } | null>(null);
  const punctRef = useRef(punct);
  punctRef.current = punct;
  const geoRef = useRef(geo);
  geoRef.current = geo;
  /** Strada scrisă de noi (din clic pe hartă) nu declanșează o nouă căutare. */
  const dinHarta = useRef(false);
  /** Ultima adresă pentru care am căutat (la început cea salvată: nu mutăm pinul salvat). */
  const ultimaAdresa = useRef(`${strada}|${numar}`);

  const locatie = () => {
    const form = el.current?.closest("form");
    const f = form ? new FormData(form) : null;
    return { judet: String(f?.get("judet") ?? ""), oras: String(f?.get("oras") ?? ""), zona: String(f?.get("zona") ?? "").trim() };
  };
  /** Numele localității alese, cum apare în listă (pentru mesaje). */
  const numeLocalitate = () => {
    const s = el.current?.closest("form")?.querySelector<HTMLSelectElement>('select[name="oras"]');
    return s?.selectedOptions[0]?.textContent?.trim() || "localitatea aleasă";
  };

  useEffect(() => {
    let anulat = false;
    let curata = () => {};
    incarcaLeaflet().then((L) => {
      if (anulat || !el.current) return;
      const h = hartaNoua(L, el.current, { scrollWheelZoom: false });
      harta.current = { L, h };
      if (initial) {
        h.setView([initial.lat, initial.lng], ZOOM_ADRESA);
        setPunct({ ...initial }); // desenează pinul acum, că harta există
      } else h.setView(ROMANIA, 6);
      h.on("click", (e: Leaflet.LeafletMouseEvent) => {
        const p = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPunct(p);
        setStare(null);
        // Strada goală: o completăm din punctul ales (geocodare inversă).
        const input = el.current?.closest("form")?.querySelector<HTMLInputElement>('input[name="strada"]');
        if (input && !input.value.trim())
          geoRef.current.invers(p.lat, p.lng).then((a) => {
            if (!a || input.value.trim()) return;
            dinHarta.current = true;
            setStrada(a.strada);
            setNumar(a.numar);
          });
      });
      // Harta poate porni ascunsă (pasul 1 al formularului): își recalculează mărimea când apare.
      const ro = new ResizeObserver(() => h.invalidateSize());
      ro.observe(el.current);

      // Localitatea sau zona schimbată: harta merge acolo. O altă localitate scoate pinul vechi.
      const form = el.current.closest("form");
      let ultimaLoc = "";
      const centreaza = async (schimbatLocalitatea: boolean) => {
        const { judet, oras, zona } = locatie();
        if (!judet || !oras) return;
        const cheie = `${judet}|${oras}`;
        if (schimbatLocalitatea && ultimaLoc && cheie !== ultimaLoc) setPunct(null);
        ultimaLoc = cheie;
        if (punctRef.current && !schimbatLocalitatea) return;
        const p = await geoRef.current.loc(zona, judet, oras);
        if (p && harta.current && (!punctRef.current || schimbatLocalitatea)) harta.current.h.setView([p.lat, p.lng], zona ? ZOOM_ZONA : ZOOM_LOCALITATE);
      };
      let ceas: ReturnType<typeof setTimeout> | undefined;
      const laSchimbare = (e: Event) => {
        const n = (e.target as HTMLInputElement | null)?.name;
        if (n === "judet" || n === "oras") centreaza(true);
        else if (n === "zona") {
          clearTimeout(ceas);
          centreaza(false);
        }
      };
      const laTastare = (e: Event) => {
        if ((e.target as HTMLInputElement | null)?.name !== "zona") return;
        clearTimeout(ceas);
        ceas = setTimeout(() => centreaza(false), PAUZA_TASTARE);
      };
      form?.addEventListener("change", laSchimbare);
      form?.addEventListener("input", laTastare);
      if (!initial) {
        const { judet, oras } = locatie();
        ultimaLoc = `${judet}|${oras}`;
        centreaza(false);
      }
      curata = () => {
        clearTimeout(ceas);
        ro.disconnect();
        form?.removeEventListener("change", laSchimbare);
        form?.removeEventListener("input", laTastare);
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

  // Strada / numărul: căutăm adresa la 800 ms după ultima tastă și mutăm pinul acolo.
  useEffect(() => {
    const cheie = `${strada}|${numar}`;
    if (cheie === ultimaAdresa.current) return;
    ultimaAdresa.current = cheie;
    if (dinHarta.current) {
      dinHarta.current = false;
      return;
    }
    const st = strada.trim();
    if (st.length < 3) {
      setStare(null);
      return;
    }
    let anulat = false;
    const ceas = setTimeout(async () => {
      const { judet, oras } = locatie();
      if (!judet || !oras) return;
      setStare({ tip: "cauta" });
      const p = await geoRef.current.adresa(st, numar.trim(), judet, oras).catch(() => null);
      if (anulat) return;
      if (!p) {
        // Adresa nu e în localitatea aleasă (sau nu există pe hartă): pinul rămâne în localitate (zona ei, dacă e scrisă),
        // nu pe o stradă cu același nume din altă parte; omul îl mută unde e proprietatea.
        setStare({ tip: "negasit", localitate: numeLocalitate() });
        const { zona } = locatie();
        const c = await geoRef.current.loc(zona, judet, oras).catch(() => null);
        if (anulat || !c) return;
        setPunct({ lat: c.lat, lng: c.lng });
        harta.current?.h.setView([c.lat, c.lng], zona ? ZOOM_ZONA : ZOOM_LOCALITATE);
        return;
      }
      setPunct({ lat: p.lat, lng: p.lng });
      harta.current?.h.setView([p.lat, p.lng], ZOOM_ADRESA);
      setStare({ tip: "gasit", exact: p.exact });
    }, PAUZA_TASTARE);
    return () => {
      anulat = true;
      clearTimeout(ceas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strada, numar]);

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
      s.pin = s.L.marker(punct, { icon: pinSimplu(s.L), draggable: true, title: "Locul proprietății (trage pentru a-l muta)" }).addTo(s.h);
      s.pin.on("dragend", () => {
        const p = s.pin!.getLatLng();
        setPunct({ lat: p.lat, lng: p.lng });
        setStare(null);
      });
    }
  }, [punct]);

  const cerinta = cerintaLocatie(tip);
  return (
    <div className="alege-punct">
      <div className="rand adresa">
        <label className="strada">
          <span>
            {cerinta === "strada-sau-zona" ? "Stradă (sau completează zona)" : "Stradă"}
            {cerinta === "strada" && <span className="obligatoriu" aria-hidden="true"> *</span>}
          </span>
          <input
            name="strada"
            value={strada}
            onChange={(e) => setStrada(e.target.value)}
            maxLength={120}
            autoComplete="address-line1"
            placeholder="ex. Strada Palat"
            aria-invalid={eroareStrada ? true : undefined}
            aria-describedby={eroareStrada ? "eroare-strada" : undefined}
          />
          {eroareStrada && <span className="eroare-camp" id="eroare-strada">{eroareStrada}</span>}
        </label>
        <label className="numar">
          Număr
          <input name="numar" value={numar} onChange={(e) => setNumar(e.target.value)} maxLength={20} inputMode="text" placeholder="ex. 10" />
        </label>
      </div>
      <span className="eticheta">Locul pe hartă</span>
      <span className={stare?.tip === "negasit" ? "avertizare-adresa small" : "muted small"} aria-live="polite">
        {stare?.tip === "cauta"
          ? "Caut adresa pe hartă…"
          : stare?.tip === "gasit"
            ? stare.exact
              ? "Am pus pinul la adresă. Trage-l dacă trebuie mutat."
              : "Am găsit strada (fără număr). Trage pinul în dreptul clădirii."
            : stare?.tip === "negasit"
              ? `Nu am găsit adresa în ${stare.localitate} – mută pinul pe hartă.`
              : "Scrie strada și numărul sau apasă pe hartă unde e proprietatea. Pinul se poate trage."}
      </span>
      <div ref={el} className="harta harta-mica" />
      {punct && (
        <button type="button" className="link-mic" onClick={() => setPunct(null)}>
          Șterge punctul
        </button>
      )}
      <label className="check">
        <input type="checkbox" name="locatieExacta" value="da" checked={exacta} onChange={(e) => setExacta(e.target.checked)} />
        <span>
          Arată pe site locația exactă
          <span className="muted small"> {exacta ? "(pinul și strada apar pe pagina anunțului)" : "(implicit: pe site apare doar zona, un cerc de ~300 m, fără număr)"}</span>
        </span>
      </label>
      <input type="hidden" name="lat" value={punct ? punct.lat.toFixed(5) : ""} />
      <input type="hidden" name="lng" value={punct ? punct.lng.toFixed(5) : ""} />
    </div>
  );
}
