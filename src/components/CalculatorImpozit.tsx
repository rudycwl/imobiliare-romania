"use client";

import { useState } from "react";
import { RANGURI, VALORI_MP, ZONE, calculeazaImpozit, type Material, type Rang, type Zona } from "@/lib/calcul-impozit";

const ETICHETE_RANG: Record<Rang, string> = {
  "0": "București",
  I: "municipii mari",
  II: "celelalte municipii",
  III: "orașe",
  IV: "sate reședință de comună",
  V: "celelalte sate",
};

const lei = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

type Props = { cota?: number; rang?: Rang; bonificatie?: number; oras?: string };

/** Impozitul anual estimat pe locuință; cota și rangul vin de pe pagina orașului, restul le alege omul. */
export function CalculatorImpozit({ cota: cotaOras, rang: rangOras = "II", bonificatie: bonOras = 0, oras }: Props) {
  const [suprafata, setSuprafata] = useState(55);
  const [utila, setUtila] = useState(true);
  const [material, setMaterial] = useState<Material>("beton");
  const [instalatii, setInstalatii] = useState(true);
  const [zona, setZona] = useState<Zona>("A");
  const [rang, setRang] = useState<Rang>(rangOras);
  const [vechime, setVechime] = useState<0 | 15 | 25>(0);
  const [cota, setCota] = useState(cotaOras ?? 0.1);
  const [bonificatie, setBonificatie] = useState(bonOras);
  const r = calculeazaImpozit({ suprafata, utila, material, instalatii, zona, rang, reducereVechime: vechime, cota, bonificatie });
  return (
    <div className="calculator">
      <div className="calculator-campuri">
        <label>
          Suprafața (m²)
          <input type="number" min={0} step={1} value={suprafata} onChange={(e) => setSuprafata(Number(e.target.value) || 0)} />
        </label>
        <label>
          Ce suprafață ai scris
          <select value={utila ? "utila" : "construita"} onChange={(e) => setUtila(e.target.value === "utila")}>
            <option value="utila">Suprafața utilă (din actele apartamentului)</option>
            <option value="construita">Suprafața construită (din cadastru)</option>
          </select>
        </label>
        <label>
          Din ce e construită
          <select value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
            {(Object.keys(VALORI_MP) as Material[]).map((m) => <option key={m} value={m}>{VALORI_MP[m].nume}</option>)}
          </select>
        </label>
        <label>
          Utilități
          <select value={instalatii ? "da" : "nu"} onChange={(e) => setInstalatii(e.target.value === "da")}>
            <option value="da">Are apă, canalizare, curent și încălzire</option>
            <option value="nu">Îi lipsește cel puțin una</option>
          </select>
        </label>
        <label>
          Zona fiscală (o afli de la primărie)
          <select value={zona} onChange={(e) => setZona(e.target.value as Zona)}>
            {ZONE.map((z) => <option key={z} value={z}>Zona {z}</option>)}
          </select>
        </label>
        <label>
          Rangul localității
          <select value={rang} onChange={(e) => setRang(e.target.value as Rang)}>
            {RANGURI.map((x) => <option key={x} value={x}>Rang {x} ({ETICHETE_RANG[x]})</option>)}
          </select>
        </label>
        <label>
          Vechimea clădirii
          <select value={vechime} onChange={(e) => setVechime(Number(e.target.value) as 0 | 15 | 25)}>
            <option value={0}>Sub 50 de ani</option>
            <option value={15}>Între 50 și 100 de ani (−15%)</option>
            <option value={25}>Peste 100 de ani (−25%)</option>
          </select>
        </label>
        <label>
          Cota primăriei (%){cotaOras !== undefined && oras ? ` · ${oras}` : ""}
          <input type="number" min={0.08} max={0.2} step="any" value={cota} onChange={(e) => setCota(Number(e.target.value) || 0)} />
        </label>
        <label>
          Bonificație la plata până la 31 martie (%)
          <input type="number" min={0} max={10} step={1} value={bonificatie} onChange={(e) => setBonificatie(Number(e.target.value) || 0)} />
        </label>
      </div>
      <div className="calculator-rezultat" aria-live="polite">
        <span>Impozit pe an, estimat</span>
        <strong>{lei.format(r.impozit)} lei</strong>
        {bonificatie > 0 && <span>Dacă plătești tot până la 31 martie: {lei.format(r.cuBonificatie)} lei</span>}
        <span>Suprafață construită: {lei.format(r.construita)} m² · valoare impozabilă: {lei.format(r.valoare)} lei</span>
        {r.lux > 0 && <span>Include {lei.format(r.lux)} lei pentru partea de peste 2.500.000 lei (0,9%).</span>}
        <small>Estimare după Codul fiscal 2026. Suma exactă o afli de la direcția de impozite locale.</small>
      </div>
    </div>
  );
}
