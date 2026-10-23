"use client";

import { useActionState } from "react";
import { cereResetare, seteazaParola } from "./actiuni";

export function FormularParolaUitata() {
  const [stare, actiune, inLucru] = useActionState(cereResetare, undefined);
  if (stare?.trimis)
    return (
      <p className="succes" role="status">
        Dacă există un cont cu acest email, ți-am trimis linkul. Verifică și dosarul Spam. Linkul e valabil o oră.
      </p>
    );
  return (
    <form className="formular" action={actiune}>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>
        {inLucru ? "Se trimite…" : "Trimite linkul"}
      </button>
    </form>
  );
}

export function FormularParolaNoua({ token }: { token: string }) {
  const [stare, actiune, inLucru] = useActionState(seteazaParola, undefined);
  return (
    <form className="formular" action={actiune}>
      <input type="hidden" name="t" value={token} />
      <label>
        Parola nouă
        <input name="parola" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label>
        Scrie parola din nou
        <input name="parola2" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>
        {inLucru ? "Se salvează…" : "Salvează parola și intră în cont"}
      </button>
    </form>
  );
}
