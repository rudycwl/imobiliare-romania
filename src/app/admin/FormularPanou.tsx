"use client";

import { useActionState } from "react";
import { intraInPanou } from "./actiuni";

export function FormularPanou() {
  const [stare, actiune, inLucru] = useActionState(intraInPanou, undefined);
  return (
    <form className="formular" action={actiune}>
      <label>
        Email
        <input name="email" defaultValue={stare?.email} type="email" required autoComplete="username" />
      </label>
      <label>
        Parolă
        <input name="parola" type="password" required autoComplete="current-password" />
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>{inLucru ? "Se verifică…" : "Intră în panou"}</button>
    </form>
  );
}
