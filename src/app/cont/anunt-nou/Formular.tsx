"use client";

import { useActionState, useState } from "react";
import { Localitate } from "@/components/Localitate";
import { TIPURI, TRANZACTII } from "@/lib/etichete";
import { publicaAnunt } from "../actiuni";

export function FormularAnunt({ judet, oras }: { judet: string; oras: string }) {
  const [stare, actiune, inLucru] = useActionState(publicaAnunt, undefined);
  const [tip, setTip] = useState("apartament");
  const v = stare?.valori;
  return (
    <form className="formular" action={actiune}>
      <div className="rand">
        <label>
          Tranzacție
          <select name="tranzactie" required defaultValue={v?.tranzactie}>
            {Object.entries(TRANZACTII).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Tip proprietate
          <select name="tip" required value={tip} onChange={(e) => setTip(e.target.value)}>
            {Object.entries(TIPURI).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Titlu
        <input name="titlu" defaultValue={v?.titlu} required minLength={10} maxLength={120} placeholder="ex. Apartament 2 camere, renovat, lângă metrou" />
      </label>
      <div className="rand">
        <label>
          Preț (€)
          <input name="pret" defaultValue={v?.pret} type="number" min={1} required />
        </label>
        <label>
          Suprafață (m²)
          <input name="suprafata" defaultValue={v?.suprafata} type="number" min={1} required />
        </label>
        {(tip === "apartament" || tip === "casa") && (
          <label>
            Camere
            <input name="camere" defaultValue={v?.camere} type="number" min={1} max={20} />
          </label>
        )}
      </div>
      <Localitate judetInitial={judet} orasInitial={v?.oras ?? oras} />
      <label>
        Zonă / cartier
        <input name="zona" defaultValue={v?.zona} placeholder="ex. Centru" />
      </label>
      <label>
        Descriere
        <textarea name="descriere" defaultValue={v?.descriere} rows={6} maxLength={5000} />
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>
        {inLucru ? "Se publică…" : "Publică anunțul"}
      </button>
    </form>
  );
}
