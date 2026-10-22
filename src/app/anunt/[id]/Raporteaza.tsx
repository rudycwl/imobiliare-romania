"use client";

import { useActionState, useState } from "react";
import { MOTIVE_RAPORTARE } from "@/lib/moderare-etichete";
import { raporteazaAnunt } from "./actiuni";

export function Raporteaza({ id }: { id: number }) {
  const [deschis, setDeschis] = useState(false);
  const [stare, actiune, inLucru] = useActionState(raporteazaAnunt, undefined);
  if (stare?.ok) return <p className="succes small">Mulțumim! Echipa CheiaMea verifică anunțul.</p>;
  if (!deschis)
    return (
      <button type="button" className="link-mic" onClick={() => setDeschis(true)}>
        ⚑ Raportează anunțul
      </button>
    );
  return (
    <form action={actiune} className="formular raporteaza">
      <input type="hidden" name="id" value={id} />
      <label>
        De ce raportezi anunțul?
        <select name="motiv" required defaultValue="">
          <option value="" disabled>Alege motivul</option>
          {Object.entries(MOTIVE_RAPORTARE).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Detalii (opțional)
        <textarea name="detalii" rows={3} maxLength={1000} />
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <div className="rand">
        <button type="submit" disabled={inLucru}>{inLucru ? "Se trimite…" : "Trimite raportarea"}</button>
        <button type="button" className="secundar" onClick={() => setDeschis(false)}>Renunță</button>
      </div>
    </form>
  );
}
