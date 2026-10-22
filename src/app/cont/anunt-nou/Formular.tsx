"use client";

import { useActionState, useState, useTransition } from "react";
import { Localitate } from "@/components/Localitate";
import { TIPURI, TRANZACTII } from "@/lib/etichete";
import type { AnuntImportat } from "@/lib/import-anunt";
import { publicaAnunt } from "../actiuni";
import { importaAnunt } from "./import";

function ImportAnunt({ laImport }: { laImport: (v: AnuntImportat) => void }) {
  const [link, setLink] = useState("");
  const [eroare, setEroare] = useState<string>();
  const [inLucru, porneste] = useTransition();
  return (
    <div className="import-box">
      <strong>Ai deja anunțul pe OLX, Storia sau imobiliare.ro?</strong>
      <span className="muted small">Lipește linkul anunțului tău și completăm noi formularul. Tu verifici și publici.</span>
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

function FormularCampuri({ judet, oras, importat }: { judet: string; oras: string; importat?: AnuntImportat }) {
  const [stare, actiune, inLucru] = useActionState(publicaAnunt, undefined);
  const [tip, setTip] = useState(importat?.tip ?? "apartament");
  const v: Record<string, string | undefined> = { ...importat, ...stare?.valori };
  return (
    <form className="formular" action={actiune}>
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
        <input name="zona" defaultValue={v?.zona} placeholder="ex. Centru" />
      </label>
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
        {inLucru ? "Se publică…" : "Publică anunțul"}
      </button>
    </form>
  );
}
