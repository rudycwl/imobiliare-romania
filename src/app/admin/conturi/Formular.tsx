"use client";

import { useActionState } from "react";
import { stergeAnunt, stergeComplet } from "./actiuni";

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

export function FormularStergereAnunt() {
  const [stare, actiune, inLucru] = useActionState(stergeAnunt, undefined);
  return (
    <form className="formular ingust" action={actiune}>
      <label>
        Numărul anunțului (din link: cheiamea.ro/anunt/<b>12</b>)
        <input name="id" inputMode="numeric" required autoComplete="off" />
      </label>
      <label>
        Scrie numărul încă o dată, ca să confirmi
        <input name="confirmare" inputMode="numeric" required autoComplete="off" />
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      {stare?.ok && <p className="succes" role="status">{stare.ok}</p>}
      <button type="submit" disabled={inLucru}>
        {inLucru ? "Se șterge…" : "Șterge anunțul"}
      </button>
    </form>
  );
}
