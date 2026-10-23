import type { Filtre as F } from "@/lib/anunturi";
import { TIPURI, TIPURI_UTILIZATOR, TRANZACTII } from "@/lib/etichete";
import { JUDETE } from "@/lib/geo";

/** Formular GET simplu: filtrele ajung în URL, deci rezultatele pot fi partajate. */
export function Filtre({ valori, action, cuJudet = false }: { valori: F; action: string; cuJudet?: boolean }) {
  return (
    <form method="get" action={action} className="filtre">
      <input name="q" placeholder="Caută (ex. centru, vilă)" defaultValue={valori.q} />
      {cuJudet && valori.oras && <input type="hidden" name="oras" value={valori.oras} />}
      {cuJudet && (
        <select name="judet" defaultValue={valori.judet ?? ""}>
          <option value="">Toate județele</option>
          {JUDETE.map((j) => (
            <option key={j.slug} value={j.slug}>
              {j.nume}
            </option>
          ))}
        </select>
      )}
      <select name="tranzactie" defaultValue={valori.tranzactie ?? ""}>
        <option value="">Vânzare și închiriere</option>
        {Object.entries(TRANZACTII).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <select name="tip" defaultValue={valori.tip ?? ""}>
        <option value="">Orice tip</option>
        {Object.entries(TIPURI).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <input name="pretMin" type="number" min={0} placeholder="Preț min €" defaultValue={valori.pretMin} />
      <input name="pretMax" type="number" min={0} placeholder="Preț max €" defaultValue={valori.pretMax} />
      <select name="camere" defaultValue={valori.camere ?? ""}>
        <option value="">Camere</option>
        {[1, 2, 3, 4].map((c) => (
          <option key={c} value={c}>
            {c}+
          </option>
        ))}
      </select>
      <select name="oferit" defaultValue={valori.oferit ?? ""}>
        <option value="">Oferit de oricine</option>
        {Object.entries(TIPURI_UTILIZATOR).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <select name="sort" defaultValue={valori.sort ?? ""}>
        <option value="">Cele mai noi</option>
        <option value="pret-asc">Preț crescător</option>
        <option value="pret-desc">Preț descrescător</option>
      </select>
      <button type="submit">Caută</button>
    </form>
  );
}
