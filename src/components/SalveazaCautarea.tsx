"use client";

import Link from "next/link";
import { useState } from "react";
import type { FiltreSalvate } from "@/lib/cautari";

/** Butonul „Salvează căutarea” de sub filtre. */
export function SalveazaCautarea({ filtre }: { filtre: FiltreSalvate }) {
  const [stare, setStare] = useState<"" | "lucru" | "gata" | string>("");
  async function salveaza() {
    setStare("lucru");
    const r = await fetch("/api/cautari", { method: "POST", body: JSON.stringify(filtre) }).catch(() => null);
    if (r?.status === 401) {
      location.href = `/cont/autentificare?inapoi=${encodeURIComponent(location.pathname + location.search)}`;
      return;
    }
    const j = (await r?.json().catch(() => ({}))) as { eroare?: string } | undefined;
    setStare(r?.ok ? "gata" : (j?.eroare ?? "Nu s-a putut salva. Încearcă din nou."));
  }
  if (stare === "gata")
    return (
      <p className="salveaza-cautarea succes-mic">
        ✓ Căutare salvată. O găsești în <Link href="/cont/cautari">Contul meu → Căutări salvate</Link>.
      </p>
    );
  return (
    <p className="salveaza-cautarea">
      <button type="button" className="secundar" onClick={salveaza} disabled={stare === "lucru"}>
        🔔 Salvează căutarea
      </button>
      <span className="muted small"> și vezi în cont anunțurile noi care se potrivesc.</span>
      {stare && stare !== "lucru" && <span className="eroare">{stare}</span>}
    </p>
  );
}
