"use client";

import { useActionState } from "react";
import { Localitate } from "@/components/Localitate";
import { salveazaDate, schimbaParola, stergeCont, type StareSetari } from "./actiuni";

function Mesaj({ s }: { s: StareSetari }) {
  if (s?.eroare) return <p className="eroare" role="alert">{s.eroare}</p>;
  if (s?.ok) return <p className="succes" role="status">{s.ok}</p>;
  return null;
}

type DateCont = { tip: string; nume: string; contact?: string | null; telefon: string; judet: string; oras: string };

export function FormularDate({ d }: { d: DateCont }) {
  const [s, actiune, inLucru] = useActionState(salveazaDate, undefined);
  const juridic = d.tip !== "persoana-fizica";
  return (
    <form className="formular" action={actiune}>
      <label>
        {juridic ? (d.tip === "agentie" ? "Denumire agenție" : "Denumire firmă") : "Nume și prenume"}
        <input name="nume" defaultValue={d.nume} required autoComplete={juridic ? "organization" : "name"} />
      </label>
      {juridic && (
        <label>
          Persoană de contact
          <input name="contact" defaultValue={d.contact ?? ""} autoComplete="name" />
        </label>
      )}
      <label>
        Telefon (apare pe anunțuri)
        <input name="telefon" defaultValue={d.telefon} type="tel" required pattern="0[0-9 ]{9,12}" placeholder="07xxxxxxxx" autoComplete="tel" />
      </label>
      <Localitate judetInitial={d.judet} orasInitial={d.oras} />
      <Mesaj s={s} />
      <button type="submit" disabled={inLucru}>{inLucru ? "Se salvează…" : "Salvează datele"}</button>
    </form>
  );
}

export function FormularParola() {
  const [s, actiune, inLucru] = useActionState(schimbaParola, undefined);
  return (
    <form className="formular" action={actiune}>
      <label>
        Parola actuală
        <input name="actuala" type="password" required autoComplete="current-password" />
      </label>
      <label>
        Parola nouă (minim 8 caractere)
        <input name="noua" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label>
        Scrie din nou parola nouă
        <input name="repetare" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <Mesaj s={s} />
      <button type="submit" disabled={inLucru}>{inLucru ? "Se schimbă…" : "Schimbă parola"}</button>
    </form>
  );
}

export function FormularStergere() {
  const [s, actiune, inLucru] = useActionState(stergeCont, undefined);
  return (
    <form className="formular" action={actiune}>
      <label>
        Ca să confirmi, scrie cuvântul STERGE
        <input name="confirmare" required autoComplete="off" />
      </label>
      <label>
        Parola contului
        <input name="parola" type="password" required autoComplete="current-password" />
      </label>
      <Mesaj s={s} />
      <button type="submit" className="pericol" disabled={inLucru}>{inLucru ? "Se șterge…" : "Șterge definitiv contul"}</button>
    </form>
  );
}
