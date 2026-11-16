"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Localitate } from "@/components/Localitate";
import { AlegePunct } from "@/components/harta/AlegePunct";
import { TIPURI, TRANZACTII } from "@/lib/etichete";
import type { AnuntImportat } from "@/lib/import-anunt";
import { editeazaAnunt, publicaAnunt } from "../actiuni";
import { importaAnunt } from "./import";

function ImportAnunt({ laImport, agentie, linkInitial }: { laImport: (v: AnuntImportat) => void; agentie: boolean; linkInitial?: string }) {
  const [link, setLink] = useState(linkInitial ?? "");
  const [eroare, setEroare] = useState<string>();
  const [inLucru, porneste] = useTransition();
  const importa = (l: string) =>
    porneste(async () => {
      const r = await importaAnunt(l);
      setEroare(r.eroare);
      if (r.valori) laImport(r.valori);
    });
  // Venit din pagina de import (feed cu linkul unui anunț): importăm direct, fără alt clic.
  const pornit = useRef(false);
  useEffect(() => {
    if (linkInitial && !pornit.current) {
      pornit.current = true;
      importa(linkInitial);
    }
  }, [linkInitial]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="import-box">
      {agentie ? (
        <>
          <strong>Ai anunțul pe site-ul agenției?</strong>
          <span className="muted small">
            Lipește linkul paginii anunțului de pe site-ul agenției și completăm noi formularul. Tu verifici și publici. Merge deocamdată cu site-urile făcute cu Soft Imobiliar.
          </span>
        </>
      ) : (
        <>
          <strong>Ai deja anunțul pe OLX, Storia, imobiliare.ro, Publi24 sau LaJumate?</strong>
          <span className="muted small">Lipește linkul anunțului tău și completăm noi formularul. Tu verifici și publici. Anunțul trebuie să fie activ pe site-ul respectiv.</span>
        </>
      )}
      <div className="rand">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder={agentie ? "https://www.agentia-ta.ro/apartament-…-12345.html" : "https://www.olx.ro/d/oferta/..."}
          aria-label="Linkul anunțului tău"
          style={{ flex: "1 1 260px" }}
        />
        <button
          type="button"
          className="secundar"
          disabled={inLucru || !link}
          onClick={() => importa(link)}
        >
          {inLucru ? "Se importă…" : "Importă"}
        </button>
      </div>
      {eroare && <p className="eroare" role="alert">{eroare}</p>}
    </div>
  );
}

/** Pozele găsite pe pagina agenției: agenția le vede înainte de publicare, poate scoate sau muta poze; la publicare le descărcăm și le urcăm. */
function PozeImportate({ poze, setPoze }: { poze: string[]; setPoze: (p: string[]) => void }) {
  const muta = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= poze.length) return;
    const p = [...poze];
    [p[i], p[j]] = [p[j], p[i]];
    setPoze(p);
  };
  return (
    <fieldset>
      <legend>Poze din anunț ({poze.length})</legend>
      <p className="muted small">Le preluăm la publicare, în această ordine; prima e coperta. Scoate ce nu vrei sau mută-le.</p>
      <input type="hidden" name="pozeSursa" value={poze.join(" ")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
        {poze.map((url, i) => (
          <div key={url} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Poza ${i + 1}`} loading="lazy" referrerPolicy="no-referrer" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 6 }} />
            <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
              <button type="button" className="secundar" aria-label="Mută înainte" disabled={i === 0} onClick={() => muta(i, -1)}>
                ←
              </button>
              <button type="button" className="secundar" onClick={() => setPoze(poze.filter((x) => x !== url))}>
                Scoate
              </button>
              <button type="button" className="secundar" aria-label="Mută după" disabled={i === poze.length - 1} onClick={() => muta(i, 1)}>
                →
              </button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function FormularAnunt({ judet, oras, poateImporta, agentie = false, linkInitial }: { judet: string; oras: string; poateImporta: boolean; agentie?: boolean; linkInitial?: string }) {
  const [importat, setImportat] = useState<AnuntImportat>();
  const [cheie, setCheie] = useState(0);
  return (
    <>
      {poateImporta && (
        <ImportAnunt
          agentie={agentie}
          linkInitial={linkInitial}
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
  const [pozeSursa, setPozeSursa] = useState<string[]>(importat?.poze ? importat.poze.split(" ") : []);
  const v: Record<string, string | undefined> = { ...editare?.valori, ...importat, ...stare?.valori };
  return (
    <form className="formular" action={actiune}>
      {editare && <input type="hidden" name="id" value={editare.id} />}
      {importat?.sursa && <input type="hidden" name="sursa" value={importat.sursa} />}
      {importat && (
        <p className="succes small">
          {importat.sursa && importat.titlu
            ? `Am importat anunțul „${importat.titlu}” de pe site-ul agenției. Verifică fiecare câmp înainte să publici; pozele le preluăm la publicare.`
            : "Am completat ce am găsit în anunțul tău. Verifică fiecare câmp înainte să publici."}
        </p>
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
      {importat?.sursa && pozeSursa.length > 0 && <PozeImportate poze={pozeSursa} setPoze={setPozeSursa} />}
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
