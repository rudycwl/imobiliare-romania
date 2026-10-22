"use client";

import { useEffect, useState } from "react";

// O singură cerere pe pagină, oricâte inimi sunt afișate.
let stare: Promise<{ autentificat: boolean; ids: Set<number> }> | null = null;
function incarca() {
  stare ??= fetch("/api/favorite", { cache: "no-store" })
    .then((r) => r.json())
    .then((j: { autentificat: boolean; ids: number[] }) => ({ autentificat: j.autentificat, ids: new Set(j.ids) }))
    .catch(() => ({ autentificat: false, ids: new Set<number>() }));
  return stare;
}

/** Inima „Salvează la favorite”. Fără cont, duce la autentificare și apoi înapoi. */
export function Favorit({ id, mare }: { id: number; mare?: boolean }) {
  const [pus, setPus] = useState(false);
  useEffect(() => {
    incarca().then((s) => setPus(s.ids.has(id)));
  }, [id]);

  async function comuta(e: React.MouseEvent) {
    // Inima stă în cardul care e link spre anunț: nu deschidem anunțul.
    e.preventDefault();
    e.stopPropagation();
    const s = await incarca();
    if (!s.autentificat) {
      location.href = `/cont/autentificare?inapoi=${encodeURIComponent(location.pathname + location.search)}`;
      return;
    }
    const nou = !pus;
    setPus(nou);
    if (nou) s.ids.add(id);
    else s.ids.delete(id);
    const r = await fetch("/api/favorite", { method: "POST", body: JSON.stringify({ id, pus: nou }) }).catch(() => null);
    if (!r?.ok) setPus(!nou);
  }

  const text = pus ? "Scoate de la favorite" : "Salvează la favorite";
  return (
    <button type="button" className={`favorit${pus ? " pus" : ""}${mare ? " mare" : ""}`} onClick={comuta} aria-pressed={pus} aria-label={text} title={text}>
      <span aria-hidden>{pus ? "♥" : "♡"}</span>
      {mare && <span>{pus ? "Salvat la favorite" : "Salvează la favorite"}</span>}
    </button>
  );
}
