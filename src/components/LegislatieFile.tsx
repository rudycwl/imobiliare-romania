"use client";

import { useState } from "react";
import type { Public } from "@/lib/continut";

/** File „Pentru cine”: cumpărători, vânzători, firme, dezvoltatori. Fără JS se vede prima filă. */
export function LegislatieFile({ publicuri }: { publicuri: Public[] }) {
  const [activ, setActiv] = useState(publicuri[0].id);
  const p = publicuri.find((x) => x.id === activ) ?? publicuri[0];
  return (
    <>
      <div role="tablist" aria-label="Pentru cine" className="file-legi">
        {publicuri.map((u) => (
          <button
            key={u.id}
            type="button"
            role="tab"
            id={`fila-${u.id}`}
            aria-selected={u.id === activ}
            aria-controls="panou-legi"
            className={u.id === activ ? "activ" : ""}
            onClick={() => setActiv(u.id)}
          >
            {u.nume}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panou-legi" aria-labelledby={`fila-${p.id}`} className="reguli" key={p.id}>
        {p.reguli.map((r, i) => (
          <div key={r.titlu} className="regula">
            <span className="nr">{String(i + 1).padStart(2, "0")}</span>
            <h3>{r.titlu}</h3>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
