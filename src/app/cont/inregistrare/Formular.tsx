"use client";

import { useActionState, useState } from "react";
import type { TipUtilizator } from "@/modules/types";
import { Localitate } from "@/components/Localitate";
import { inregistrare } from "../actiuni";

const OPTIUNI: { tip: TipUtilizator; titlu: string; text: string }[] = [
  { tip: "persoana-fizica", titlu: "Persoană fizică", text: "Vând sau închiriez propria locuință." },
  { tip: "firma", titlu: "Firmă", text: "Dezvoltator sau firmă cu imobile proprii." },
  { tip: "agentie", titlu: "Agenție imobiliară", text: "Profil public de agenție, oferte nelimitate." },
];

export function FormularInregistrare({ tipInitial, tipuri }: { tipInitial: TipUtilizator; tipuri: TipUtilizator[] }) {
  const [tip, setTip] = useState<TipUtilizator>(tipInitial);
  const optiuni = OPTIUNI.filter((o) => tipuri.includes(o.tip));
  const [stare, actiune, inLucru] = useActionState(inregistrare, undefined);
  const juridic = tip !== "persoana-fizica";
  const v = stare?.valori;

  return (
    <form className="formular" action={actiune}>
      {optiuni.length > 1 ? (
      <fieldset className="tipuri-cont" style={{ gridTemplateColumns: `repeat(${optiuni.length}, 1fr)` }}>
        <legend>Tip cont</legend>
        {optiuni.map((o) => (
          <label key={o.tip} className={tip === o.tip ? "activ" : ""}>
            <input type="radio" name="tip" value={o.tip} checked={tip === o.tip} onChange={() => setTip(o.tip)} />
            <strong>{o.titlu}</strong>
            <span className="muted small">{o.text}</span>
          </label>
        ))}
      </fieldset>
      ) : (
        <input type="hidden" name="tip" value={tip} />
      )}

      {juridic && (
        <>
          <label>
            Denumire {tip === "agentie" ? "agenție" : "firmă"}
            <input name="denumire" defaultValue={v?.denumire} required autoComplete="organization" />
          </label>
          <label>
            CUI
            <input name="cui" defaultValue={v?.cui} required pattern="(RO|ro)?[0-9]{2,10}" placeholder="RO12345678" />
          </label>
        </>
      )}
      <label>
        {juridic ? "Persoană de contact" : "Nume și prenume"}
        <input name="nume" defaultValue={v?.nume} required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" defaultValue={v?.email} type="email" required autoComplete="email" />
      </label>
      <label>
        Telefon
        <input name="telefon" defaultValue={v?.telefon} type="tel" required autoComplete="tel" pattern="0[0-9]{9}" placeholder="07xxxxxxxx" />
      </label>
      <Localitate orasInitial={v?.oras} />
      <label>
        Parolă (minim 8 caractere)
        <input name="parola" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="check">
        <input type="checkbox" required defaultChecked={!!v} /> Accept termenii și politica de confidențialitate (GDPR)
      </label>
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>
        {inLucru ? "Se creează contul…" : "Creează cont"}
      </button>
    </form>
  );
}
