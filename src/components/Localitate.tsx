"use client";

import { useState } from "react";
import { JUDETE } from "@/modules/judete";

/** Selectoare legate județ → oraș, pentru formulare. */
export function Localitate({ judetInitial = "", orasInitial = "" }: { judetInitial?: string; orasInitial?: string }) {
  const [judet, setJudet] = useState(judetInitial);
  const orase = JUDETE.find((j) => j.slug === judet)?.orase ?? [];
  return (
    <div className="rand">
      <label>
        Județ
        <select name="judet" required value={judet} onChange={(e) => setJudet(e.target.value)}>
          <option value="">Alege județul</option>
          {JUDETE.map((j) => (
            <option key={j.slug} value={j.slug}>
              {j.nume}
            </option>
          ))}
        </select>
      </label>
      <label>
        Localitate
        <select name="oras" required defaultValue={orasInitial} key={judet} disabled={!judet}>
          <option value="">Alege localitatea</option>
          {orase.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.nume}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
