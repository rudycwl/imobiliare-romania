"use client";

import { useActionState } from "react";
import { cheieApi } from "./cheie-api";

export function CheieApi({ areCheie }: { areCheie: boolean }) {
  const [stare, actiune, inLucru] = useActionState(cheieApi, undefined);
  const activa = stare?.cheie ? true : stare?.anulata ? false : areCheie;
  return (
    <>
      <form className="formular ingust" action={actiune}>
        <button type="submit" name="actiune" value="genereaza" disabled={inLucru}>
          {activa ? "Generează o cheie nouă (cea veche nu mai merge)" : "Generează cheia API"}
        </button>
        {activa && (
          <button type="submit" name="actiune" value="anuleaza" className="secundar" disabled={inLucru}>
            Anulează cheia
          </button>
        )}
      </form>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      {stare?.cheie && (
        <div role="status">
          <p className="succes">Cheia ta API (o vezi doar acum, copiaz-o și dă-o programatorului sau firmei care îți face programul de anunțuri):</p>
          <p>
            <code style={{ wordBreak: "break-all", userSelect: "all" }}>{stare.cheie}</code>
          </p>
        </div>
      )}
      {stare?.anulata && <p role="status">Cheia a fost anulată. Programul agenției nu mai poate trimite anunțuri până generezi alta.</p>}
    </>
  );
}
