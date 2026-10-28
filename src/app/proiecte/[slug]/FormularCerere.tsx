"use client";

import Link from "next/link";
import { useActionState } from "react";
import { trimiteCerere } from "./actiuni";

export function FormularCerere({ slug, dezvoltator }: { slug: string; dezvoltator: string }) {
  const [stare, actiune, inLucru] = useActionState(trimiteCerere, undefined);
  if (stare?.ok) return <p className="succes" role="status">Mulțumim! Cererea ta a fost trimisă la {dezvoltator}. Te vor contacta în curând.</p>;
  return (
    <form className="formular" action={actiune}>
      <input type="hidden" name="proiect" value={slug} />
      {/* Capcană pentru roboți: oamenii nu văd câmpul. */}
      <label className="ascuns" aria-hidden="true">
        Site
        <input name="site" tabIndex={-1} autoComplete="off" />
      </label>
      <label>
        Nume
        <input name="nume" required maxLength={100} autoComplete="name" />
      </label>
      <div className="rand">
        <label>
          Telefon
          <input name="telefon" type="tel" required maxLength={30} autoComplete="tel" />
        </label>
        <label>
          Email
          <input name="email" type="email" required maxLength={120} autoComplete="email" />
        </label>
      </div>
      <label>
        Mesaj (opțional)
        <textarea name="mesaj" rows={4} maxLength={2000} placeholder="ex.: Mă interesează un apartament cu 2 camere. Când îl pot vedea?" />
      </label>
      <label className="check">
        <input type="checkbox" name="acord" required />
        <span>
          Sunt de acord ca numele, telefonul, emailul și mesajul meu să fie trimise dezvoltatorului {dezvoltator}, ca să mă contacteze despre acest proiect
          (<Link href="/confidentialitate">confidențialitate</Link>).
        </span>
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>{inLucru ? "Se trimite…" : "Trimite cererea"}</button>
    </form>
  );
}
