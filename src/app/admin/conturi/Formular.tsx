"use client";

import { useActionState } from "react";
import { stergeComplet } from "./actiuni";

export function FormularStergere() {
  const [stare, actiune, inLucru] = useActionState(stergeComplet, undefined);
  return (
    <form className="formular ingust" action={actiune}>
      <label>
        Emailul contului
        <input name="email" type="email" required autoComplete="off" />
      </label>
      <label>
        Scrie emailul încă o dată, ca să confirmi
        <input name="confirmare" type="email" required autoComplete="off" />
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      {stare?.ok && <p className="succes" role="status">{stare.ok}</p>}
      <button type="submit" disabled={inLucru}>
        {inLucru ? "Se șterge…" : "Șterge contul complet"}
      </button>
    </form>
  );
}
