"use client";

import { useState } from "react";
import type { TipUtilizator } from "@/modules/types";

const OPTIUNI: { tip: TipUtilizator; titlu: string; text: string }[] = [
  { tip: "persoana-fizica", titlu: "Persoană fizică", text: "Vând sau închiriez propria locuință." },
  { tip: "firma", titlu: "Firmă", text: "Dezvoltator sau firmă cu imobile proprii." },
  { tip: "agentie", titlu: "Agenție imobiliară", text: "Profil public de agenție, oferte nelimitate." },
];

export function FormularInregistrare({ tipInitial }: { tipInitial: TipUtilizator }) {
  const [tip, setTip] = useState<TipUtilizator>(tipInitial);
  const [trimis, setTrimis] = useState(false);
  const juridic = tip !== "persoana-fizica";

  if (trimis)
    return (
      <p className="succes">
        Mulțumim! Contul tău de <strong>{OPTIUNI.find((o) => o.tip === tip)?.titlu.toLowerCase()}</strong> a fost
        înregistrat (demo, fără salvare încă).
      </p>
    );

  return (
    <form
      className="formular"
      onSubmit={(e) => {
        e.preventDefault();
        setTrimis(true);
      }}
    >
      <fieldset className="tipuri-cont">
        <legend>Tip cont</legend>
        {OPTIUNI.map((o) => (
          <label key={o.tip} className={tip === o.tip ? "activ" : ""}>
            <input type="radio" name="tip" value={o.tip} checked={tip === o.tip} onChange={() => setTip(o.tip)} />
            <strong>{o.titlu}</strong>
            <span className="muted small">{o.text}</span>
          </label>
        ))}
      </fieldset>

      {juridic && (
        <>
          <label>
            Denumire {tip === "agentie" ? "agenție" : "firmă"}
            <input name="denumire" required />
          </label>
          <label>
            CUI
            <input name="cui" required pattern="(RO)?[0-9]{2,10}" placeholder="RO12345678" />
          </label>
        </>
      )}
      <label>
        {juridic ? "Persoană de contact" : "Nume și prenume"}
        <input name="nume" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Telefon
        <input name="telefon" type="tel" required autoComplete="tel" pattern="0[0-9]{9}" placeholder="07xxxxxxxx" />
      </label>
      <label>
        Parolă
        <input name="parola" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="check">
        <input type="checkbox" required /> Accept termenii și politica de confidențialitate (GDPR)
      </label>
      <button type="submit">Creează cont</button>
    </form>
  );
}
