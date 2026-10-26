"use client";

import { useActionState } from "react";
import type { Texte } from "@/lib/setari";
import { implicit, salveaza } from "./actiuni";

export function FormularTexte({ texte, nrBanda }: { texte: Texte; nrBanda: number }) {
  const [stare, actiune, inLucru] = useActionState(salveaza, undefined);
  const [stareImplicit, actiuneImplicit, inLucruImplicit] = useActionState(implicit, undefined);
  const mesaj = stare ?? stareImplicit;
  // După „Textele inițiale” formularul se reîncarcă cu valorile noi (cheia îl recreează).
  const cheie = JSON.stringify(texte);
  return (
    <>
      <form key={cheie} className="formular" action={actiune}>
        <h2>Bara de anunț (sus, pe toate paginile)</h2>
        <p className="muted small">Lasă textul gol ca bara să nu apară.</p>
        <label>
          Text
          <input name="anuntText" defaultValue={texte.anuntText} maxLength={200} placeholder="ex.: Agențiile înscrise până la 31 decembrie primesc 6 luni gratuit" />
        </label>
        <label>
          Link (opțional)
          <input name="anuntLink" defaultValue={texte.anuntLink} maxLength={300} placeholder="ex.: /pentru-agentii" />
        </label>

        <h2>Pagina de start</h2>
        <label>
          Rândul mic de deasupra titlului
          <input name="erouSupratitlu" defaultValue={texte.erouSupratitlu} maxLength={80} required />
        </label>
        <label>
          Textul de sub titlu
          <textarea name="erouDescriere" defaultValue={texte.erouDescriere} maxLength={250} rows={2} required />
        </label>

        <h2>Banda cu noutăți (pagina de start)</h2>
        <p className="muted small">Eticheta e cuvântul scurt evidențiat. Un rând gol nu apare pe site.</p>
        {Array.from({ length: nrBanda }, (_, i) => {
          const b = texte.banda[i];
          return (
            <div key={i} className="panou-banda">
              <label>
                Eticheta {i + 1}
                <input name={`eticheta${i}`} defaultValue={b?.eticheta} maxLength={30} />
              </label>
              <label>
                Text
                <input name={`text${i}`} defaultValue={b?.text} maxLength={200} />
              </label>
              <label>
                Link
                <input name={`href${i}`} defaultValue={b?.href} maxLength={300} placeholder="/legislatie" />
              </label>
            </div>
          );
        })}

        {mesaj?.eroare && <p className="eroare" role="alert">{mesaj.eroare}</p>}
        {mesaj?.ok && <p className="succes" role="status">{mesaj.ok}</p>}
        <button type="submit" disabled={inLucru}>{inLucru ? "Se salvează…" : "Salvează"}</button>
      </form>
      <form action={actiuneImplicit} style={{ marginTop: 24 }}>
        <button type="submit" disabled={inLucruImplicit}>Pune înapoi textele inițiale</button>
      </form>
    </>
  );
}
