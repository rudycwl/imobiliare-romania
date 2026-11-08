"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adaugaFeed } from "./feed-actiuni";
import type { RaportFeed } from "@/lib/feeduri";

export function RaportFeedVizibil({ r }: { r: RaportFeed }) {
  if (r.eroare) return <p className="eroare">{r.eroare}</p>;
  return (
    <div className="small">
      <p>
        Găsite în feed: <b>{r.gasite}</b> · publicate acum: <b>{r.noi}</b> · actualizate: <b>{r.actualizate}</b> · retrase (nu mai sunt în feed):{" "}
        <b>{r.retrase}</b>
        {r.sarite.length ? (
          <>
            {" "}
            · sărite: <b>{r.sarite.length}</b>
          </>
        ) : null}
      </p>
      {r.avertisment && <p className="eroare">{r.avertisment}</p>}
      {r.sarite.length > 0 && (
        <details>
          <summary>De ce au fost sărite</summary>
          <ul>
            {r.sarite.slice(0, 100).map((s, i) => (
              <li key={i}>
                anunțul cu codul {s.id}: {s.motiv}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function FormularFeed() {
  const [stare, actiune, inLucru] = useActionState(adaugaFeed, undefined);
  return (
    <>
      <form className="formular ingust" action={actiune}>
        <label>
          Linkul feed-ului XML din programul agenției
          <input name="url" type="url" inputMode="url" placeholder="https://…/export/cheiamea.xml" required />
        </label>
        <label className="check">
          <input type="checkbox" name="acord" value="da" required />
          <span>
            Sunt de acord cu{" "}
          <Link href="/pentru-agentii/feed#acord" target="_blank">
            condițiile feed-ului
          </Link>
          : anunțurile, pozele și datele de contact sunt ale agenției și au acordul clienților.
          </span>
        </label>
        <button type="submit" disabled={inLucru}>
          {inLucru ? "Citesc feed-ul… (prima dată, cu poze, poate dura câteva minute)" : "Conectează feed-ul"}
        </button>
      </form>
      {stare?.eroare && (
        <p className="eroare" role="alert">
          {stare.eroare}
        </p>
      )}
      {stare?.raport && (
        <div role="status">
          {!stare.raport.eroare && <p className="succes">Feed-ul e conectat. De acum îl citim singuri la fiecare 3 ore.</p>}
          <RaportFeedVizibil r={stare.raport} />
        </div>
      )}
    </>
  );
}
