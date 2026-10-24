"use client";

import Link from "next/link";
import { useActionState } from "react";
import { platesteActiune } from "./actiuni";

type Valori = { nume: string; email: string; telefon: string; adresa: string; regCom: string; cui: string; localitate: string };

export function FormularPlata({ cerere, firma, valori }: { cerere: string; firma: boolean; valori: Valori }) {
  const [stare, actiune, inLucru] = useActionState(platesteActiune, undefined);
  return (
    <form action={actiune} className="formular">
      <input type="hidden" name="cerere" value={cerere} />
      <h2>Date de facturare</h2>
      <label>
        {firma ? "Persoana de contact" : "Nume și prenume"}
        <input name="nume" defaultValue={valori.nume} required minLength={3} maxLength={120} />
      </label>
      {firma && (
        <>
          <label>CUI<input value={valori.cui} readOnly /></label>
          <label>
            Nr. Reg. Com.
            <input name="regCom" defaultValue={valori.regCom} placeholder="ex. J22/1234/2020" required />
          </label>
        </>
      )}
      <label>
        Adresa (stradă, număr, bloc, apartament)
        <input name="adresa" defaultValue={valori.adresa} required minLength={5} maxLength={200} />
      </label>
      <label>Localitatea<input value={valori.localitate} readOnly /></label>
      <label>Cod poștal (opțional)<input name="codPostal" inputMode="numeric" maxLength={6} /></label>
      <label>Email<input value={valori.email} readOnly /></label>
      <label>Telefon<input name="telefon" defaultValue={valori.telefon} required /></label>
      <label className="check">
        <input type="checkbox" name="termeni" required />
        <span>
          Am citit <Link href="/termeni" target="_blank">Termenii și condițiile</Link> și <Link href="/anulare-rambursare" target="_blank">Politica de anulare și rambursare</Link>.
        </span>
      </label>
      <label className="check">
        <input type="checkbox" name="incepere" required />
        <span>Cer începerea serviciului imediat după plată și înțeleg că, odată activat, nu mai pot renunța la el (pierd dreptul de retragere).</span>
      </label>
      {stare?.eroare && <p className="eroare">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>{inLucru ? "Se deschide pagina de plată…" : "Plătește cu cardul"}</button>
      <p className="muted small">Plata se face pe pagina securizată NETOPIA Payments. Datele cardului nu ajung la CheiaMea.</p>
    </form>
  );
}
