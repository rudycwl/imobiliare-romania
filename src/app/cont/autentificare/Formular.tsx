"use client";

import { useActionState } from "react";
import { autentificare } from "../actiuni";

export function FormularAutentificare() {
  const [stare, actiune, inLucru] = useActionState(autentificare, undefined);
  return (
    <form className="formular" action={actiune}>
      <label>
        Email
        <input name="email" defaultValue={stare?.valori?.email} type="email" required autoComplete="email" />
      </label>
      <label>
        Parolă
        <input name="parola" type="password" required autoComplete="current-password" />
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>
        {inLucru ? "Se verifică…" : "Intră în cont"}
      </button>
    </form>
  );
}
