"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cerereIncarcare, confirmaPoza } from "./actiuni";

const LATURA = 1600;

/** Micșorează poza în browser (max 1600 px, WebP), ca să fie rapidă și să ocupe puțin. */
export async function micsoreaza(f: File): Promise<Blob> {
  const img = await createImageBitmap(f, { imageOrientation: "from-image" });
  const k = Math.min(1, LATURA / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const webp = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.82));
  // Safari mai vechi nu scrie WebP și întoarce PNG; atunci folosim JPEG.
  if (webp && webp.type === "image/webp") return webp;
  return (await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85)))!;
}

export function IncarcarePoze({ anuntId, ramase }: { anuntId: number; ramase: number }) {
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
        const r = await cerereIncarcare(anuntId, blob.type, blob.size);
        if ("eroare" in r && r.eroare) throw new Error(r.eroare);
        const put = await fetch(r.url!, { method: "PUT", body: blob, headers: { "Content-Type": blob.type } });
        if (!put.ok) throw new Error("Încărcarea a eșuat. Încearcă din nou.");
        const c = await confirmaPoza(anuntId, r.cheie!);
        if (c.eroare) throw new Error(c.eroare);
      } catch (e) {
        setEroare(e instanceof Error ? e.message : "Încărcarea a eșuat.");
        break;
      }
    }
    setStare(null);
    router.refresh();
  }

  if (ramase <= 0) return <p className="muted">Ai adăugat numărul maxim de poze.</p>;
  return (
    <div className="incarcare-poze">
      <label className="buton">
        {stare ?? "Adaugă poze"}
        <input type="file" accept="image/*" multiple hidden disabled={!!stare} onChange={(e) => alege(e.target.files)} />
      </label>
      <p className="muted small">Poți adăuga încă {ramase}. Pozele se micșorează automat înainte de încărcare.</p>
      {eroare && <p className="eroare">{eroare}</p>}
    </div>
  );
}
