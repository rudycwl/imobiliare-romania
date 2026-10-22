"use client";

import { useEffect } from "react";

function trimite(id: number, tip: "vizualizare" | "telefon") {
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

/** Butonul „Sună”, care numără și de câte ori a fost folosit telefonul. */
export function ButonTelefon({ id, telefon }: { id: number; telefon: string }) {
  return (
    <a className="buton" href={`tel:${telefon}`} onClick={() => trimite(id, "telefon")}>
      Sună {telefon.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
    </a>
  );
}
