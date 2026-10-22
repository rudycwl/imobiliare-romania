"use client";

import { useActionState } from "react";
import { trimiteRetragere } from "./actiuni";

export function FormularRetragere({ emailFirma }: { emailFirma: string }) {
  const [stare, actiune, inLucru] = useActionState(trimiteRetragere, undefined);
  if (stare?.ok)
    return (
      <div className="succes" role="status">
        <p>
          <strong>Am primit cererea ta de retragere.</strong> Număr de înregistrare: <strong>{stare.ok.id}</strong>, primită pe {stare.ok.data}.
        </p>
        <p className="small">
          Păstrează acest număr (fă o captură de ecran). Îți confirmăm primirea și pe email, de la {emailFirma}, și îți răspundem în cel mult 5 zile lucrătoare.
        </p>
      </div>
    );
  return (
    <form action={actiune} className="formular">
      <label>
        Nume și prenume
        <input name="nume" required maxLength={120} autoComplete="name" />
      </label>
      <label>
        Email (cel din contul CheiaMea)
        <input name="email" type="email" required maxLength={200} autoComplete="email" />
      </label>
      <label>
        Numărul comenzii sau al facturii
        <input name="comanda" required maxLength={60} placeholder="ex. CM…" />
      </label>
      <label>
        Detalii (opțional)
        <textarea name="mesaj" rows={3} maxLength={2000} />
      </label>
      <label className="check">
        <input type="checkbox" name="confirm" value="da" required /> Prin prezenta vă notific că mă retrag din contractul privind serviciul de mai sus.
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>{inLucru ? "Se trimite…" : "Confirmă retragerea"}</button>
    </form>
  );
}
