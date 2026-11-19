"use client";

import { useEffect, useRef, useState } from "react";
import type { CampFereastra } from "@/lib/caracteristici";
import { CLASA_IN_CURS, CLASE_ENERGETICE, STARE } from "@/lib/caracteristici-liste";

const ETICHETE: Record<CampFereastra, string> = { strada: "Stradă", stare: "Stare", clasaEnergetica: "Clasă energetică" };

/**
 * Fereastra de la „Publică” când lipsesc strada, starea sau clasa energetică: arată ce lipsește, cu câmpurile
 * de completat direct aici. „Completează și publică” trimite valorile scrise; „Publică fără ele” trimite așa.
 * Folosește <dialog> (focus în fereastră, Escape o închide, fundalul nu se poate folosi).
 */
export function FereastraLipsuri({
  lipsa,
  laCompletare,
  laFaraEle,
  laInchidere,
}: {
  lipsa: CampFereastra[];
  laCompletare: (valori: Partial<Record<CampFereastra, string>>) => void;
  laFaraEle: () => void;
  laInchidere: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [valori, setValori] = useState<Partial<Record<CampFereastra, string>>>({});
  const deschisa = lipsa.length > 0;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (deschisa && !d.open) {
      setValori({});
      d.showModal();
    } else if (!deschisa && d.open) d.close();
  }, [deschisa]);

  const set = (c: CampFereastra) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValori((v) => ({ ...v, [c]: e.target.value }));
  const lista = lipsa.map((c) => ETICHETE[c]);
  const text = lista.length > 1 ? `${lista.slice(0, -1).join(", ")} și ${lista[lista.length - 1]}` : lista[0];

  return (
    <dialog ref={ref} className="fereastra-lipsuri" aria-labelledby="fereastra-lipsuri-titlu" aria-describedby="fereastra-lipsuri-text" onClose={laInchidere}>
      <div className="fereastra-cap">
        <h2 id="fereastra-lipsuri-titlu">Mai lipsesc câteva detalii</h2>
        <button type="button" className="inchide" aria-label="Închide" onClick={() => ref.current?.close()}>
          ×
        </button>
      </div>
      <p id="fereastra-lipsuri-text" className="muted small">
        Nu ai completat: {text}. Le poți adăuga aici sau poți publica fără ele.
      </p>
      <div className="fereastra-campuri">
        {lipsa.includes("strada") && (
          <label>
            <span>Stradă</span>
            <input value={valori.strada ?? ""} onChange={set("strada")} maxLength={120} autoComplete="off" placeholder="ex. Strada Palat" autoFocus />
            <span className="muted small">Fără stradă, pe hartă apare doar zona.</span>
          </label>
        )}
        {lipsa.includes("stare") && (
          <label>
            <span>Stare</span>
            <select value={valori.stare ?? ""} onChange={set("stare")} autoFocus={!lipsa.includes("strada")}>
              <option value="">Alege</option>
              {Object.entries(STARE).map(([k, e]) => (
                <option key={k} value={k}>{e}</option>
              ))}
            </select>
          </label>
        )}
        {lipsa.includes("clasaEnergetica") && (
          <label>
            <span>Clasă energetică</span>
            <select value={valori.clasaEnergetica ?? ""} onChange={set("clasaEnergetica")} autoFocus={lipsa.length === 1}>
              <option value="">Alege</option>
              {CLASE_ENERGETICE.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value={CLASA_IN_CURS}>În curs de obținere</option>
            </select>
          </label>
        )}
      </div>
      <div className="fereastra-butoane">
        <button type="button" onClick={() => laCompletare(valori)}>
          Completează și publică
        </button>
        <button type="button" className="secundar" onClick={laFaraEle}>
          Publică fără ele
        </button>
      </div>
    </dialog>
  );
}
