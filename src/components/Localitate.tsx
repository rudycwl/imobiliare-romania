"use client";

import { useState } from "react";
import { JUDETE } from "@/modules/judete";

type Props = { judetInitial?: string; orasInitial?: string };

/**
 * Selectoare legate județ → oraș, pentru formulare.
 *
 * După o acțiune de server, React golește formularul (form.reset()): un <select> controlat (value=…) rămânea gol,
 * deși starea spunea altceva, iar odată cu județul se pierdea și orașul (ex. după o eroare la înregistrare).
 * De aceea selectoarele sunt necontrolate (defaultValue), iar când serverul întoarce alte valori inițiale
 * le recreăm (key), ca resetarea să ducă la valorile primite, nu la „Alege județul”.
 */
export function Localitate({ judetInitial = "", orasInitial = "" }: Props) {
  return <Selectoare key={`${judetInitial}|${orasInitial}`} judetInitial={judetInitial} orasInitial={orasInitial} />;
}

function Selectoare({ judetInitial = "", orasInitial = "" }: Props) {
  const [judet, setJudet] = useState(judetInitial);
  const orase = JUDETE.find((j) => j.slug === judet)?.orase ?? [];
  return (
    <div className="rand">
      <label>
        Județ
        <select
          name="judet"
          required
          defaultValue={judetInitial}
          onChange={(e) => setJudet(e.target.value)}
          // La resetarea formularului, lista de orașe urmează județul la care revine selectorul.
          ref={(el) => {
            const form = el?.form;
            if (!el || !form) return;
            const laReset = () => setTimeout(() => setJudet(el.value));
            form.addEventListener("reset", laReset);
            return () => form.removeEventListener("reset", laReset);
          }}
        >
          <option value="">Alege județul</option>
          {JUDETE.map((j) => (
            <option key={j.slug} value={j.slug}>
              {j.nume}
            </option>
          ))}
        </select>
      </label>
      <label>
        Localitate
        <select name="oras" required defaultValue={judet === judetInitial ? orasInitial : ""} key={judet} disabled={!judet}>
          <option value="">Alege localitatea</option>
          {orase.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.nume}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
