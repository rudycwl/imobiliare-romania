"use client";

import Link from "next/link";
import { useState } from "react";
import type { PunctHarta } from "@/lib/anunturi";
import { formatPret, TIPURI } from "@/lib/etichete";
import type { Tranzactie } from "@/modules/types";
import { HartaAnunturi } from "./HartaAnunturi";

const MAX_LISTA = 60;

/** Harta + lista anunțurilor din zona vizibilă: muți sau mărești harta și lista se schimbă. */
export function CautareHarta({ puncte }: { puncte: PunctHarta[] }) {
  const [vizibile, setVizibile] = useState<PunctHarta[]>(puncte);
  const [activ, setActiv] = useState<number | null>(null);
  return (
    <div className="cautare-harta">
      <HartaAnunturi puncte={puncte} laMutare={setVizibile} activ={activ} />
      <aside className="lista-harta" aria-live="polite">
        <p className="muted small">
          {vizibile.length === 1 ? "1 anunț" : `${vizibile.length} anunțuri`} în zona de pe hartă
          {vizibile.length > MAX_LISTA ? `, primele ${MAX_LISTA} afișate. Mărește harta pe o zonă.` : "."}
        </p>
        {!vizibile.length && <p className="muted">Mută sau micșorează harta ca să vezi anunțurile din jur.</p>}
        <ul>
          {vizibile.slice(0, MAX_LISTA).map((p) => (
            <li key={p.id} onMouseEnter={() => setActiv(p.id)} onMouseLeave={() => setActiv(null)}>
              <Link href={`/anunt/${p.id}`} className="anunt-mic">
                <span className="anunt-mic-img" style={{ background: p.imagine }} />
                <span>
                  <strong className="pret">{formatPret({ pret: p.pret, tranzactie: p.tranzactie as Tranzactie })}</strong>
                  <span className="anunt-mic-titlu">{p.titlu}</span>
                  <span className="muted small">
                    {TIPURI[p.tip as keyof typeof TIPURI]} · {p.suprafata} m²{p.camere ? ` · ${p.camere} cam.` : ""} · {p.zona}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
