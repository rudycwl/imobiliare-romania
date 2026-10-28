"use client";

import { startTransition, useActionState } from "react";
import { JUDETE } from "@/lib/geo";
import { LUNI_GRATUITE_PROIECT } from "@/lib/tarife";
import { salveazaProiect } from "./actiuni";

/** Valorile formularului, ca text (la proiect nou, toate goale). */
export type ValoriProiect = {
  id?: number;
  slug: string;
  nume: string;
  dezvoltator: string;
  descriere: string;
  loc: string;
  zona: string;
  adresa: string;
  lat: string;
  lng: string;
  website: string;
  telefon: string;
  email: string;
  unitati: string;
  termenFinalizare: string;
  activ: boolean;
  gratuitPanaLa: string;
};

export function FormularProiect({ v }: { v: ValoriProiect }) {
  const [stare, actiune, inLucru] = useActionState(salveazaProiect, undefined);
  return (
    // Trimis fără resetarea automată a formularului (React 19), ca la o eroare să nu se piardă ce s-a scris.
    <form
      className="formular"
      onSubmit={(e) => {
        e.preventDefault();
        const date = new FormData(e.currentTarget);
        startTransition(() => actiune(date));
      }}
    >
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="rand">
        <label>
          Numele proiectului
          <input name="nume" defaultValue={v.nume} maxLength={120} required placeholder="ex.: Rezidențial Copou Park" />
        </label>
        <label>
          Dezvoltatorul
          <input name="dezvoltator" defaultValue={v.dezvoltator} maxLength={120} required placeholder="ex.: Exemplu Construct SRL" />
        </label>
      </div>
      <label>
        Adresa paginii (slug)
        <input name="slug" defaultValue={v.slug} maxLength={100} placeholder="se completează din nume dacă rămâne gol" />
      </label>
      <label>
        Descriere
        <textarea name="descriere" defaultValue={v.descriere} maxLength={8000} rows={8} required />
      </label>
      <label>
        Localitatea
        <select name="loc" defaultValue={v.loc} required>
          <option value="" disabled>Alege localitatea</option>
          {JUDETE.map((j) => (
            <optgroup key={j.slug} label={j.nume}>
              {j.orase.map((o) => (
                <option key={o.slug} value={`${j.slug}/${o.slug}`}>{o.nume}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="rand">
        <label>
          Zona / cartierul (opțional)
          <input name="zona" defaultValue={v.zona} maxLength={120} />
        </label>
        <label>
          Adresa (opțional)
          <input name="adresa" defaultValue={v.adresa} maxLength={200} />
        </label>
      </div>
      <div className="rand">
        <label>
          Latitudine (opțional)
          <input name="lat" defaultValue={v.lat} inputMode="decimal" placeholder="ex.: 47.1585" />
        </label>
        <label>
          Longitudine (opțional)
          <input name="lng" defaultValue={v.lng} inputMode="decimal" placeholder="ex.: 27.6014" />
        </label>
      </div>
      <p className="muted small">Coordonatele le iei din Google Maps (clic dreapta pe locul proiectului). Cu ele, pagina arată și harta.</p>
      <div className="rand">
        <label>
          Telefonul dezvoltatorului
          <input name="telefon" defaultValue={v.telefon} maxLength={30} required />
        </label>
        <label>
          Emailul dezvoltatorului (primește cererile)
          <input name="email" type="email" defaultValue={v.email} maxLength={120} required />
        </label>
      </div>
      <div className="rand">
        <label>
          Site-ul proiectului (opțional)
          <input name="website" defaultValue={v.website} maxLength={300} placeholder="https://" />
        </label>
        <label>
          Termen de finalizare (opțional)
          <input name="termenFinalizare" defaultValue={v.termenFinalizare} maxLength={80} placeholder="ex.: trimestrul IV 2027" />
        </label>
      </div>
      <label>
        Unitățile (câte una pe rând)
        <textarea name="unitati" defaultValue={v.unitati} rows={10} style={{ fontFamily: "ui-monospace, monospace" }} placeholder={"Apartament; 2; 54; 89000; 3; disponibil\nApartament; 3; 72; 118000; 5; rezervat\nPenthouse; 4; 120; ; 8; disponibil"} />
      </label>
      <p className="muted small">
        Ordinea câmpurilor, separate prin „;”: tip; camere; suprafață utilă (m²); preț (€); etaj; stare. Prețul gol = „la cerere”.
        Starea poate fi disponibil, rezervat sau vândut (implicit: disponibil).
      </p>
      <div className="rand">
        <label>
          Gratuit până la
          <input name="gratuitPanaLa" type="date" defaultValue={v.gratuitPanaLa} />
        </label>
        <label className="check" style={{ alignSelf: "end" }}>
          <input name="activ" type="checkbox" defaultChecked={v.activ} /> Activ (apare pe site)
        </label>
      </div>
      {!v.id && <p className="muted small">Gol = {LUNI_GRATUITE_PROIECT} luni de azi. Pozele le adaugi după salvare.</p>}
      {stare?.eroare && <p className="eroare" role="alert">{stare.eroare}</p>}
      {stare?.ok && <p className="succes" role="status">{stare.ok}</p>}
      <button type="submit" disabled={inLucru}>{inLucru ? "Se salvează…" : v.id ? "Salvează" : "Creează proiectul"}</button>
    </form>
  );
}
