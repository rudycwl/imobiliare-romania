"use client";

import { useActionState, useState, useTransition } from "react";
import { Localitate } from "@/components/Localitate";
import { AlegePunct } from "@/components/harta/AlegePunct";
import { TIPURI, TRANZACTII } from "@/lib/etichete";
import type { AnuntImportat } from "@/lib/import-anunt";
import { editeazaAnunt, publicaAnunt } from "../actiuni";
import { importaAnunt } from "./import";

function ImportAnunt({ laImport }: { laImport: (v: AnuntImportat) => void }) {
  const [link, setLink] = useState("");
  const [eroare, setEroare] = useState<string>();
  const [inLucru, porneste] = useTransition();
  return (
    <div className="import-box">
      <strong>Ai deja anunțul pe OLX, Storia, imobiliare.ro, Publi24 sau LaJumate?</strong>
      <span className="muted small">Lipește linkul anunțului tău și completăm noi formularul. Tu verifici și publici. Anunțul trebuie să fie activ pe site-ul respectiv.</span>
      <div className="rand">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.olx.ro/d/oferta/..."
          aria-label="Linkul anunțului tău"
          style={{ flex: "1 1 260px" }}
        />
        <button
          type="button"
          className="secundar"
          disabled={inLucru || !link}
          onClick={() =>
            porneste(async () => {
              const r = await importaAnunt(link);
              setEroare(r.eroare);
              if (r.valori) laImport(r.valori);
            })
          }
        >
          {inLucru ? "Se importă…" : "Importă"}
        </button>
      </div>
      {eroare && <p className="eroare" role="alert">{eroare}</p>}
    </div>
  );
}

export function FormularAnunt({ judet, oras, poateImporta }: { judet: string; oras: string; poateImporta: boolean }) {
  const [importat, setImportat] = useState<AnuntImportat>();
  const [cheie, setCheie] = useState(0);
  return (
    <>
      {poateImporta && (
        <ImportAnunt
          laImport={(v) => {
            setImportat(v);
            setCheie((k) => k + 1);
          }}
        />
      )}
      <FormularCampuri key={cheie} judet={importat?.judet ?? judet} oras={importat?.oras ?? oras} importat={importat} />
    </>
  );
}

/** Cu `editare`, formularul pornește completat cu anunțul existent și îl salvează în loc să publice unul nou. */
export function FormularCampuri({
  judet,
  oras,
  importat,
  editare,
}: {
  judet: string;
  oras: string;
  importat?: AnuntImportat;
  editare?: { id: number; valori: Record<string, string> };
}) {
  const [stare, actiune, inLucru] = useActionState(editare ? editeazaAnunt : publicaAnunt, undefined);
  const [tip, setTip] = useState(importat?.tip ?? editare?.valori.tip ?? "apartament");
  const v: Record<string, string | undefined> = { ...editare?.valori, ...importat, ...stare?.valori };
  return (
    <form className="formular" action={actiune}>
      {editare && <input type="hidden" name="id" value={editare.id} />}
      {importat && (
        <p className="succes small">Am completat ce am găsit în anunțul tău. Verifică fiecare câmp înainte să publici.</p>
      )}
      <div className="rand">
        <label>
          Tranzacție
          <select name="tranzactie" required defaultValue={v?.tranzactie}>
            {Object.entries(TRANZACTII).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Tip proprietate
          <select name="tip" required value={tip} onChange={(e) => setTip(e.target.value)}>
            {Object.entries(TIPURI).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Titlu
        <input name="titlu" defaultValue={v?.titlu} required minLength={10} maxLength={120} placeholder="ex. Apartament 2 camere, renovat, lângă metrou" />
      </label>
      <div className="rand">
        <label>
          Preț (€)
          <input name="pret" defaultValue={v?.pret} type="number" min={1} required />
        </label>
        <label>
          Suprafață (m²)
          <input name="suprafata" defaultValue={v?.suprafata} type="number" min={1} required />
        </label>
        {(tip === "apartament" || tip === "casa") && (
          <label>
            Camere
            <input name="camere" defaultValue={v?.camere} type="number" min={1} max={20} />
          </label>
        )}
      </div>
      <Localitate judetInitial={v?.judet ?? judet} orasInitial={v?.oras ?? oras} />
      <label>
        Zonă / cartier
        <input name="zona" defaultValue={v?.zona} maxLength={80} placeholder="ex. Centru" />
      </label>
      <AlegePunct initial={v.lat && v.lng ? { lat: Number(v.lat), lng: Number(v.lng) } : null} />
      <label>
        Descriere
        <textarea name="descriere" defaultValue={v?.descriere} rows={6} maxLength={5000} />
      </label>
      {importat && (
        <label className="check">
          <input type="checkbox" required /> Confirm că sunt proprietarul acestui anunț și am dreptul să-l public pe CheiaMea.
        </label>
      )}
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      <button type="submit" disabled={inLucru}>
        {editare ? (inLucru ? "Se salvează…" : "Salvează modificările") : inLucru ? "Se publică…" : "Publică anunțul"}
      </button>
    </form>
  );
}
