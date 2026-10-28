"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { micsoreaza } from "@/app/cont/anunt/[id]/poze/Incarcare";
import { cerereIncarcareProiect, confirmaPozaProiect } from "./actiuni";

/** Încărcarea pozelor unui proiect, la fel ca la anunțuri: micșorate în browser, apoi trimise direct în stocare. */
export function IncarcarePozeProiect({ proiectId, ramase }: { proiectId: number; ramase: number }) {
  const router = useRouter();
  const [stare, setStare] = useState<string | null>(null);
  const [eroare, setEroare] = useState<string | null>(null);

  async function alege(fisiere: FileList | null) {
    if (!fisiere?.length) return;
    setEroare(null);
    const lista = [...fisiere].slice(0, ramase);
    for (const [i, f] of lista.entries()) {
      setStare(`Se încarcă poza ${i + 1} din ${lista.length}…`);
      try {
        const blob = await micsoreaza(f);
        const r = await cerereIncarcareProiect(proiectId, blob.type, blob.size);
        if ("eroare" in r && r.eroare) throw new Error(r.eroare);
        const put = await fetch(r.url!, { method: "PUT", body: blob, headers: { "Content-Type": blob.type } });
        if (!put.ok) throw new Error("Încărcarea a eșuat. Încearcă din nou.");
        const c = await confirmaPozaProiect(proiectId, r.cheie!);
        if (c.eroare) throw new Error(c.eroare);
      } catch (e) {
        setEroare(e instanceof Error ? e.message : "Încărcarea a eșuat.");
        break;
      }
    }
    setStare(null);
    router.refresh();
  }

  if (ramase <= 0) return <p className="muted">Proiectul are numărul maxim de poze.</p>;
  return (
    <div className="incarcare-poze">
      <label className="buton">
        {stare ?? "Adaugă poze"}
        <input type="file" accept="image/*" multiple hidden disabled={!!stare} onChange={(e) => alege(e.target.files)} />
      </label>
      <p className="muted small">Mai poți adăuga {ramase}. Prima poză e coperta.</p>
      {eroare && <p className="eroare">{eroare}</p>}
    </div>
  );
}
