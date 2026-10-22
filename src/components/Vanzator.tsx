import Link from "next/link";
import type { Utilizator } from "@/modules/types";
import { TIPURI_UTILIZATOR } from "@/lib/etichete";

export function Vanzator({ u }: { u: Utilizator }) {
  return (
    <div className="vanzator">
      <div className="avatar" style={{ background: u.culoare }}>{u.nume[0]}</div>
      <div>
        <span className={`badge badge-${u.tip}`}>{TIPURI_UTILIZATOR[u.tip]}</span>
        {u.fondator && <span className="badge badge-fondator" title="Una din primele 100 de agenții de pe CheiaMea">⭐ Agenție Fondatoare</span>}
        <div>
          {u.tip === "agentie" ? <Link href={`/agentii/${u.slug}`}><strong>{u.nume}</strong></Link> : <strong>{u.nume}</strong>}
        </div>
        {u.cui && <div className="muted small">CUI {u.cui}</div>}
      </div>
    </div>
  );
}
