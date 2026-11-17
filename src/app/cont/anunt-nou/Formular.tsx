"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Localitate } from "@/components/Localitate";
import { AlegePunct } from "@/components/harta/AlegePunct";
import { TIPURI, TRANZACTII } from "@/lib/etichete";
import type { AnuntImportat } from "@/lib/import-anunt";
import { citesteCaracteristici } from "@/lib/caracteristici";
import {
  AN_NECUNOSCUT,
  areCamp,
  CLASA_IN_CURS,
  CLASE_ENERGETICE,
  COMPARTIMENTARE,
  DOTARI,
  dotariTip,
  etichetaCamp,
  INCALZIRE,
  MOBILARE,
  obligatoriu,
  STARE,
  type CampCar,
} from "@/lib/caracteristici-liste";
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

/** Câmpurile cu eroare (camp → mesaj), din verificarea din browser sau de pe server. */
type Erori = Record<string, string>;

const optiuni = (o: Record<string, string>) =>
  Object.entries(o).map(([k, e]) => (
    <option key={k} value={k}>
      {e}
    </option>
  ));

/** Pasul 1: tranzacția și tipul proprietății, cu butoane mari. */
function AlegeTip({
  tranzactie,
  tip,
  setTranzactie,
  setTip,
  continua,
}: {
  tranzactie: string;
  tip: string;
  setTranzactie: (v: string) => void;
  setTip: (v: string) => void;
  continua: () => void;
}) {
  return (
    <section className="pas-tip" aria-labelledby="titlu-pas1">
      <p className="pas-numar">Pasul 1 din 2</p>
      <h2 id="titlu-pas1">Ce vrei să publici?</h2>
      <div className="alegeri-mari" role="group" aria-label="Tranzacție">
        {Object.entries(TRANZACTII).map(([k, e]) => (
          <button key={k} type="button" className="alegere-mare" aria-pressed={tranzactie === k} onClick={() => setTranzactie(k)}>
            {e}
          </button>
        ))}
      </div>
      <div className="alegeri-mari tipuri" role="group" aria-label="Tip proprietate">
        {Object.entries(TIPURI).map(([k, e]) => (
          <button key={k} type="button" className="alegere-mare" aria-pressed={tip === k} onClick={() => setTip(k)}>
            {e}
          </button>
        ))}
      </div>
      <button type="button" className="continua" disabled={!tranzactie || !tip} onClick={continua}>
        Continuă
      </button>
    </section>
  );
}

/** Eticheta câmpului, cu * la cele obligatorii pentru tip. */
function Eticheta({ camp, tip }: { camp: CampCar; tip: string }) {
  return (
    <span>
      {etichetaCamp(camp, tip)}
      {obligatoriu(tip, camp) && <span className="obligatoriu" aria-hidden="true"> *</span>}
    </span>
  );
}

function MesajCamp({ camp, erori }: { camp: string; erori: Erori }) {
  return erori[camp] ? (
    <span className="eroare-camp" id={`eroare-${camp}`}>
      {erori[camp]}
    </span>
  ) : null;
}

const aria = (camp: string, erori: Erori, tip?: string, c?: CampCar) => ({
  "aria-invalid": erori[camp] ? true : undefined,
  "aria-describedby": erori[camp] ? `eroare-${camp}` : undefined,
  "aria-required": tip && c && obligatoriu(tip, c) ? true : undefined,
});

/** Butoane de alegere (radio) pentru listele scurte: compartimentare, stare, balcon. */
function Butoane({ camp, tip, lista, valoare, erori, onChange }: { camp: CampCar; tip: string; lista: Record<string, string>; valoare?: string; erori: Erori; onChange?: (v: string) => void }) {
  return (
    <fieldset className={`camp-car butoane${erori[camp] ? " cu-eroare" : ""}`} aria-describedby={erori[camp] ? `eroare-${camp}` : undefined}>
      <legend>
        <Eticheta camp={camp} tip={tip} />
      </legend>
      <div className="optiuni">
        {Object.entries(lista).map(([k, e]) => (
          <label key={k} className="optiune">
            <input type="radio" name={camp} value={k} defaultChecked={valoare === k} onChange={() => onChange?.(k)} />
            <span>{e}</span>
          </label>
        ))}
      </div>
      <MesajCamp camp={camp} erori={erori} />
    </fieldset>
  );
}

/** Secțiunea „Caracteristici”, adaptată tipului (lista câmpurilor: src/lib/caracteristici-liste.ts). */
function SectiuneCaracteristici({ tip, v, erori }: { tip: string; v: Record<string, string | undefined>; erori: Erori }) {
  const [balcon, setBalcon] = useState(v.balcon ?? "");
  const [anNecunoscut, setAnNecunoscut] = useState(v.anConstructie === String(AN_NECUNOSCUT));
  const are = (c: CampCar) => areCamp(tip, c);
  const casa = tip === "casa";
  const dotari = dotariTip(tip);
  const bifate = new Set((v.dotari ?? "").split(",").filter(Boolean));
  return (
    <fieldset className="sectiune-caracteristici">
      <legend>Caracteristici</legend>
      <p className="muted small">Câmpurile cu * sunt obligatorii pentru {TIPURI[tip as keyof typeof TIPURI]?.toLowerCase() ?? "acest tip"}. Apar pe pagina anunțului, nu trebuie scrise și în descriere.</p>
      <div className="grila-car">
        <label className="camp-car">
          <Eticheta camp="suprafata" tip={tip} />
          <input name="suprafata" defaultValue={v.suprafata} type="number" inputMode="numeric" min={1} placeholder="m²" {...aria("suprafata", erori, tip, "suprafata")} />
          <MesajCamp camp="suprafata" erori={erori} />
        </label>
        {are("suprafataTotala") && (
          <label className="camp-car">
            <Eticheta camp="suprafataTotala" tip={tip} />
            <input name="suprafataTotala" defaultValue={v.suprafataTotala} type="number" inputMode="numeric" min={1} placeholder="m²" {...aria("suprafataTotala", erori, tip, "suprafataTotala")} />
            <MesajCamp camp="suprafataTotala" erori={erori} />
          </label>
        )}
        {are("camere") && (
          <label className="camp-car">
            <Eticheta camp="camere" tip={tip} />
            <select name="camere" defaultValue={v.camere ?? ""} {...aria("camere", erori, tip, "camere")}>
              <option value="">Alege</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n === 1 && tip === "apartament" ? "1 (garsonieră)" : n}</option>
              ))}
            </select>
            <MesajCamp camp="camere" erori={erori} />
          </label>
        )}
        {are("etaj") && (
          <label className="camp-car">
            <Eticheta camp="etaj" tip={tip} />
            <select name="etaj" defaultValue={v.etaj ?? ""} {...aria("etaj", erori, tip, "etaj")}>
              <option value="">Alege</option>
              <option value="-1">Demisol</option>
              <option value="0">Parter</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <MesajCamp camp="etaj" erori={erori} />
          </label>
        )}
        {are("etajeTotal") && (
          <label className="camp-car">
            <Eticheta camp="etajeTotal" tip={tip} />
            <select name="etajeTotal" defaultValue={v.etajeTotal ?? ""} {...aria("etajeTotal", erori, tip, "etajeTotal")}>
              <option value="">Alege</option>
              {casa
                ? [1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{["", "1 (doar parter)", "2 (P+1 / P+M)", "3 (P+2 / P+1+M)", "4", "5", "6"][n]}</option>
                  ))
                : Array.from({ length: 31 }, (_, i) => i).map((n) => (
                    <option key={n} value={n}>{n === 0 ? "Doar parter (P)" : `P+${n}`}</option>
                  ))}
            </select>
            <MesajCamp camp="etajeTotal" erori={erori} />
          </label>
        )}
        {are("anConstructie") && (
          <div className="camp-car">
            <label htmlFor="camp-an">
              <Eticheta camp="anConstructie" tip={tip} />
            </label>
            {anNecunoscut ? (
              <input type="hidden" name="anConstructie" value={AN_NECUNOSCUT} />
            ) : (
              <input id="camp-an" name="anConstructie" defaultValue={v.anConstructie === String(AN_NECUNOSCUT) ? "" : v.anConstructie} type="number" inputMode="numeric" min={1800} max={new Date().getFullYear() + 3} placeholder="ex. 1985" {...aria("anConstructie", erori, tip, "anConstructie")} />
            )}
            <label className="check mic">
              <input type="checkbox" checked={anNecunoscut} onChange={(e) => setAnNecunoscut(e.target.checked)} /> Nu știu
            </label>
            <MesajCamp camp="anConstructie" erori={erori} />
          </div>
        )}
        {are("bai") && (
          <label className="camp-car">
            <Eticheta camp="bai" tip={tip} />
            <select name="bai" defaultValue={v.bai ?? ""} {...aria("bai", erori, tip, "bai")}>
              <option value="">Alege</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <MesajCamp camp="bai" erori={erori} />
          </label>
        )}
        {are("incalzire") && (
          <label className="camp-car">
            <Eticheta camp="incalzire" tip={tip} />
            <select name="incalzire" defaultValue={v.incalzire ?? ""} {...aria("incalzire", erori, tip, "incalzire")}>
              <option value="">Alege</option>
              {optiuni(INCALZIRE)}
            </select>
            <MesajCamp camp="incalzire" erori={erori} />
          </label>
        )}
        {are("mobilare") && (
          <label className="camp-car">
            <Eticheta camp="mobilare" tip={tip} />
            <select name="mobilare" defaultValue={v.mobilare ?? ""} {...aria("mobilare", erori, tip, "mobilare")}>
              <option value="">Alege</option>
              {optiuni(MOBILARE)}
            </select>
            <MesajCamp camp="mobilare" erori={erori} />
          </label>
        )}
        {are("aerConditionat") && (
          <label className="camp-car">
            <Eticheta camp="aerConditionat" tip={tip} />
            <select name="aerConditionat" defaultValue={v.aerConditionat ?? ""} {...aria("aerConditionat", erori, tip, "aerConditionat")}>
              <option value="">Alege</option>
              <option value="0">Nu</option>
              <option value="1">Da, 1 aparat</option>
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>Da, {n} aparate</option>
              ))}
            </select>
            <MesajCamp camp="aerConditionat" erori={erori} />
          </label>
        )}
        {are("clasaEnergetica") && (
          <label className="camp-car">
            <Eticheta camp="clasaEnergetica" tip={tip} />
            <select name="clasaEnergetica" defaultValue={v.clasaEnergetica ?? ""} {...aria("clasaEnergetica", erori, tip, "clasaEnergetica")}>
              <option value="">Alege</option>
              {CLASE_ENERGETICE.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value={CLASA_IN_CURS}>În curs de obținere</option>
            </select>
            <MesajCamp camp="clasaEnergetica" erori={erori} />
          </label>
        )}
        {are("compartimentare") && <Butoane camp="compartimentare" tip={tip} lista={COMPARTIMENTARE} valoare={v.compartimentare} erori={erori} />}
        {are("stare") && <Butoane camp="stare" tip={tip} lista={STARE} valoare={v.stare} erori={erori} />}
        {are("balcon") && (
          <div className="camp-car lat balcon">
            <Butoane camp="balcon" tip={tip} lista={{ da: "Da", nu: "Nu" }} valoare={v.balcon} erori={erori} onChange={setBalcon} />
            {balcon === "da" && (
              <div className="balcon-detalii">
                <label className="check">
                  <input type="checkbox" name="balconInchis" value="da" defaultChecked={v.balconInchis === "da"} /> Închis
                </label>
                <label className="camp-car">
                  <span>Suprafață balcon <span className="muted small">(opțional)</span></span>
                  <input name="balconMp" defaultValue={v.balconMp} type="number" inputMode="numeric" min={1} max={500} placeholder="m²" {...aria("balconMp", erori)} />
                  <MesajCamp camp="balconMp" erori={erori} />
                </label>
              </div>
            )}
          </div>
        )}
        {are("dotari") && (
          <fieldset className="camp-car lat butoane">
            <legend>
              <Eticheta camp="dotari" tip={tip} /> <span className="muted small">(opțional, bifează ce are)</span>
            </legend>
            <div className="optiuni">
              {dotari.map((d) => (
                <label key={d} className="optiune">
                  <input type="checkbox" name="dotari" value={d} defaultChecked={bifate.has(d)} />
                  <span>{DOTARI[d]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </fieldset>
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
  /** `dinDescriere`: câmpurile precompletate din descriere (anunțuri vechi), ca omul să le verifice. */
  editare?: { id: number; valori: Record<string, string>; dinDescriere?: string[] };
}) {
  const [stare, actiune, inLucru] = useActionState(editare ? editeazaAnunt : publicaAnunt, undefined);
  const [tip, setTip] = useState(importat?.tip ?? editare?.valori.tip ?? "");
  const [tranzactie, setTranzactie] = useState(importat?.tranzactie ?? editare?.valori.tranzactie ?? "");
  // La editare și la un import care aduce tranzacția și tipul se intră direct în pasul 2.
  const [pas, setPas] = useState(editare || (importat?.tip && importat?.tranzactie) ? 2 : 1);
  const [pozeSursa, setPozeSursa] = useState<string[]>(importat?.poze ? importat.poze.split(" ") : []);
  const [erori, setErori] = useState<Erori>({});
  const form = useRef<HTMLFormElement>(null);
  const v: Record<string, string | undefined> = { ...editare?.valori, ...importat, ...stare?.valori };

  // Eroarea venită de pe server: marcăm câmpul și îl aducem în față.
  useEffect(() => {
    if (!stare?.camp) return;
    setErori({ [stare.camp]: stare.eroare ?? "Verifică acest câmp." });
    setPas(2);
    focusCamp(stare.camp);
  }, [stare]);

  const focusCamp = (camp: string) =>
    requestAnimationFrame(() => {
      const el = form.current?.querySelector<HTMLElement>(`[name="${camp}"]:not([type="hidden"])`) ?? form.current?.querySelector<HTMLElement>(`#eroare-${camp}`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
    });

  /**
   * Verificarea din browser (aceeași ca pe server pentru caracteristici și adresă, plus titlu, preț, localitate):
   * oprește trimiterea, marchează câmpurile și duce focusul pe primul, în ordinea din pagină.
   */
  const verifica = (e: React.FormEvent<HTMLFormElement>) => {
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const map: Erori = {};
    if (get("titlu").trim().length < 10) map.titlu = "Titlul trebuie să aibă cel puțin 10 caractere.";
    if (!(Number(get("pret")) > 0)) map.pret = "Completează prețul.";
    if (!get("judet")) map.judet = "Alege județul.";
    else if (!get("oras")) map.oras = "Alege localitatea.";
    if (importat && get("confirmProprietar") !== "da") map.confirmProprietar = "Bifează confirmarea ca să publici.";
    for (const x of citesteCaracteristici(get, (k) => f.getAll(k).map(String), tip).erori) if (!map[x.camp]) map[x.camp] = x.mesaj;
    setErori(map);
    if (Object.keys(map).length) {
      e.preventDefault();
      const ordine = [...e.currentTarget.elements].map((x) => (x as HTMLInputElement).name).filter(Boolean);
      focusCamp(Object.keys(map).sort((a, b) => (ordine.indexOf(a) + 1 || 1e6) - (ordine.indexOf(b) + 1 || 1e6))[0]);
    }
  };

  // O eroare dispare când omul schimbă câmpul.
  const sterge = (e: React.FormEvent<HTMLFormElement>) => {
    const n = (e.target as HTMLInputElement).name;
    if (n && erori[n]) setErori(({ [n]: _, ...rest }) => rest);
  };

  return (
    <form ref={form} className="formular formular-anunt" action={actiune} onSubmit={verifica} onChange={sterge} noValidate>
      {pas === 1 && (
        <AlegeTip tranzactie={tranzactie} tip={tip} setTranzactie={setTranzactie} setTip={setTip} continua={() => setPas(2)} />
      )}
      {/* Pasul 2 rămâne în pagină și când se revine la pasul 1, ca valorile scrise să nu se piardă. */}
      <div className="pas-detalii" hidden={pas !== 2}>
        {editare && <input type="hidden" name="id" value={editare.id} />}
        {importat?.sursa && <input type="hidden" name="sursa" value={importat.sursa} />}
        <input type="hidden" name="tranzactie" value={tranzactie} />
        <input type="hidden" name="tip" value={tip} />
        {!editare && <p className="pas-numar">Pasul 2 din 2</p>}
        <div className="ales">
          <strong>{TRANZACTII[tranzactie as keyof typeof TRANZACTII]} · {TIPURI[tip as keyof typeof TIPURI]}</strong>
          <button type="button" className="secundar" onClick={() => setPas(1)}>
            Schimbă
          </button>
        </div>
        {importat && (
          <p className="succes small">
            {importat.sursa && importat.titlu
              ? `Am importat anunțul „${importat.titlu}” de pe site-ul agenției. Verifică fiecare câmp și completează ce lipsește înainte să publici; pozele le preluăm la publicare.`
              : "Am completat ce am găsit în anunțul tău. Verifică fiecare câmp și completează ce lipsește înainte să publici."}
          </p>
        )}
        {editare?.dinDescriere?.length ? (
          <p className="succes small">Am precompletat din descriere: {editare.dinDescriere.join(", ")}. Verifică și salvează.</p>
        ) : null}
        <label>
          Titlu
          <input name="titlu" defaultValue={v?.titlu} required minLength={10} maxLength={120} placeholder="ex. Apartament 2 camere, renovat, lângă metrou" {...aria("titlu", erori)} />
          <MesajCamp camp="titlu" erori={erori} />
        </label>
        <label className="pret">
          Preț (€){tranzactie === "inchiriere" ? " pe lună" : ""}
          <input name="pret" defaultValue={v?.pret} type="number" inputMode="numeric" min={1} required {...aria("pret", erori)} />
          <MesajCamp camp="pret" erori={erori} />
        </label>
        {tip && <SectiuneCaracteristici key={tip} tip={tip} v={v} erori={erori} />}
        <fieldset className="sectiune-locatie">
          <legend>Localizare</legend>
          <Localitate judetInitial={v?.judet ?? judet} orasInitial={v?.oras ?? oras} />
          <MesajCamp camp="judet" erori={erori} />
          <MesajCamp camp="oras" erori={erori} />
          <label>
            Zonă / cartier
            <input name="zona" defaultValue={v?.zona} maxLength={80} placeholder="ex. Centru" />
          </label>
          <AlegePunct
            tip={tip}
            initial={v.lat && v.lng ? { lat: Number(v.lat), lng: Number(v.lng) } : null}
            adresa={{ strada: v.strada, numar: v.numar, locatieExacta: v.locatieExacta === "da" }}
            eroareStrada={erori.strada}
          />
        </fieldset>
        <label>
          Descriere
          <textarea name="descriere" defaultValue={v?.descriere} rows={6} maxLength={5000} />
        </label>
        {importat?.sursa && pozeSursa.length > 0 && <PozeImportate poze={pozeSursa} setPoze={setPozeSursa} />}
        {importat && (
          <>
            <label className="check">
              <input type="checkbox" name="confirmProprietar" value="da" required {...aria("confirmProprietar", erori)} /> Confirm că sunt proprietarul acestui anunț și am dreptul să-l public pe CheiaMea.
            </label>
            <MesajCamp camp="confirmProprietar" erori={erori} />
          </>
        )}
        {Object.keys(erori).length > 0 && (
          <p className="eroare" role="alert">
            {stare?.camp && erori[stare.camp] ? stare.eroare : `Completează câmpurile marcate (${Object.keys(erori).length}).`}
          </p>
        )}
        {stare?.eroare && !stare.camp && <p className="eroare" role="alert">{stare.eroare}</p>}
        <button type="submit" disabled={inLucru}>
          {editare ? (inLucru ? "Se salvează…" : "Salvează modificările") : inLucru ? "Se publică…" : "Publică anunțul"}
        </button>
      </div>
    </form>
  );
}
