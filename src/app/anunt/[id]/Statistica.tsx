"use client";

import { useEffect, useState } from "react";

function trimite(id: number, tip: "vizualizare") {
  // O singură numărare pe anunț și eveniment, cât timp e deschis browserul.
  const cheie = `stat-${tip}-${id}`;
  try {
    if (sessionStorage.getItem(cheie)) return;
    sessionStorage.setItem(cheie, "1");
  } catch {}
  fetch(`/api/anunt/${id}/statistica`, { method: "POST", body: JSON.stringify({ tip }), keepalive: true }).catch(() => {});
}

/** Numără vizualizarea paginii de anunț. */
export function Vizualizare({ id }: { id: number }) {
  useEffect(() => trimite(id, "vizualizare"), [id]);
  return null;
}

const formatTelefon = (t: string) => t.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");

/** „Arată telefonul”: numărul vine de la server doar la clic (nu stă în pagină pentru roboți), apoi devine butonul „Sună”. */
export function ButonTelefon({ id }: { id: number }) {
  const [telefon, setTelefon] = useState<string | null>(null);
  const [eroare, setEroare] = useState("");
  const [incarca, setIncarca] = useState(false);
  if (telefon)
    return (
      <a className="buton" href={`tel:${telefon}`}>
        Sună {formatTelefon(telefon)}
      </a>
    );
  async function arata() {
    setIncarca(true);
    setEroare("");
    try {
      const r = await fetch(`/api/anunt/${id}/telefon`, { method: "POST" });
      const d = (await r.json()) as { telefon?: string; eroare?: string };
      if (d.telefon) setTelefon(d.telefon);
      else setEroare(d.eroare ?? "Nu am putut afișa telefonul.");
    } catch {
      setEroare("Nu am putut afișa telefonul. Verifică internetul.");
    }
    setIncarca(false);
  }
  return (
    <>
      <button type="button" className="buton" onClick={arata} disabled={incarca}>
        {incarca ? "Se încarcă…" : "Arată telefonul"}
      </button>
      {eroare && <span className="eroare small">{eroare}</span>}
    </>
  );
}
