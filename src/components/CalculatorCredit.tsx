"use client";

import { useState } from "react";

const lei = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

/** Rata lunară estimată (anuități egale). Dobânda o alege utilizatorul: valorile sunt doar orientative. */
export function CalculatorCredit() {
  const [pret, setPret] = useState(90000);
  const [avans, setAvans] = useState(15);
  const [ani, setAni] = useState(30);
  const [dobanda, setDobanda] = useState(6);
  const credit = Math.max(0, pret * (1 - avans / 100));
  const n = ani * 12;
  const r = dobanda / 100 / 12;
  const rata = r > 0 ? (credit * r) / (1 - Math.pow(1 + r, -n)) : credit / n;
  return (
    <div className="calculator">
      <div className="calculator-campuri">
        <label>
          Prețul locuinței (€)
          <input type="number" min={0} step={1000} value={pret} onChange={(e) => setPret(Number(e.target.value) || 0)} />
        </label>
        <label>
          <span>Avans: <strong>{avans}%</strong> ({lei.format(pret * avans / 100)} €)</span>
          <input type="range" min={5} max={75} step={5} value={avans} onChange={(e) => setAvans(Number(e.target.value))} />
        </label>
        <label>
          <span>Perioada: <strong>{ani} ani</strong></span>
          <input type="range" min={5} max={35} step={1} value={ani} onChange={(e) => setAni(Number(e.target.value))} />
        </label>
        <label>
          Dobânda anuală (%)
          <input type="number" min={0} max={20} step={0.1} value={dobanda} onChange={(e) => setDobanda(Number(e.target.value) || 0)} />
        </label>
      </div>
      <div className="calculator-rezultat" aria-live="polite">
        <span>Rata lunară estimată</span>
        <strong>{lei.format(rata)} €</strong>
        <span>Credit: {lei.format(credit)} € · {n} rate</span>
        <small>Estimare orientativă. Dobânda și costurile reale le afli de la bancă.</small>
      </div>
    </div>
  );
}
