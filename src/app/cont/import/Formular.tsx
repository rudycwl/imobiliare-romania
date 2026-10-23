"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importa } from "./actiuni";

export function FormularImport() {
  const [stare, actiune, inLucru] = useActionState(importa, undefined);
  return (
    <>
      <form className="formular ingust" action={actiune}>
        <label>
          Fișierul CSV cu anunțurile
          <input name="fisier" type="file" accept=".csv,text/csv" required />
        </label>
        <button type="submit" disabled={inLucru}>
          {inLucru ? "Se importă… (cu poze poate dura câteva minute)" : "Importă anunțurile"}
        </button>
      </form>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      {stare && stare.importate !== undefined && (
        <div role="status">
          {stare.importate > 0 && (
            <p className="succes">
              Am publicat {stare.importate === 1 ? "1 anunț" : `${stare.importate} anunțuri`}
              {stare.cuPoze ? `, ${stare.cuPoze} cu poze` : ""}. Le vezi în <Link href="/cont">Anunțurile mele</Link>.
            </p>
          )}
          {stare.oprit && <p className="eroare">{stare.oprit}</p>}
          {stare.sarite.length > 0 && (
            <>
              <p>Rânduri sărite ({stare.sarite.length}):</p>
              <ul className="small">
                {stare.sarite.slice(0, 100).map((s) => (
                  <li key={s.rand}>rândul {s.rand}: {s.motiv}</li>
                ))}
              </ul>
            </>
          )}
          {!stare.importate && !stare.oprit && !stare.sarite.length && <p className="muted">Fișierul nu conține anunțuri.</p>}
        </div>
      )}
    </>
  );
}
