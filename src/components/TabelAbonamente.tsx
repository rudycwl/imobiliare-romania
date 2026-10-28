import { ABONAMENTE, LUNI_PLATITE_PE_AN, lei, pretLunar } from "@/lib/tarife";
import { LUNI_GRATUITE } from "@/lib/fondatori";

/**
 * Abonamentele pentru agenții, publice (decizia lui Rudy, 28.10.2026: prețurile se văd înainte de înscriere).
 * `ofertaFondator` = mai sunt locuri „Agenție Fondatoare”: prețul normal apare tăiat lângă cel de fondator.
 */
export function TabelAbonamente({ ofertaFondator }: { ofertaFondator: boolean }) {
  return (
    <>
      <h2>Abonamente pentru agenții</h2>
      <div className="tabel-wrap">
        <table className="tabel-preturi">
          <thead>
            <tr>
              <th>Abonament</th>
              <th>Anunțuri active</th>
              <th>Credite de promovare pe lună</th>
              <th className="num">Preț / lună</th>
              {ofertaFondator && <th className="num">Agenție Fondatoare</th>}
            </tr>
          </thead>
          <tbody>
            {ABONAMENTE.map((a) => (
              <tr key={a.cod} className={a.recomandat ? "recomandat" : undefined}>
                <td>
                  <strong>{a.nume}</strong>
                  {a.recomandat && <span className="eticheta-recomandat">recomandat</span>}
                </td>
                <td>
                  {a.anunturi ?? "nelimitat"}
                  {a.agenti !== 1 && <>, {a.agenti ?? "nelimitați"} agenți</>}
                  {a.extra && <>, {a.extra}</>}
                </td>
                <td>
                  {a.credite.reactualizari} reactualizări
                  {a.credite.top7 > 0 && <>, {a.credite.top7} × Top în oraș 7 zile</>}
                </td>
                <td className="num">
                  {ofertaFondator ? <s className="pret-taiat">{lei(a.pret)}</s> : <span className="pret">{lei(a.pret)}</span>}
                </td>
                {ofertaFondator && (
                  <td className="num">
                    <span className="pret">0 lei</span> <span className="muted mic">{LUNI_GRATUITE} luni</span>
                    <br />apoi <span className="pret">{lei(pretLunar(a, true))}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted mic">
        Toate abonamentele includ importul ofertelor dintr-un fișier Excel (CSV) și accesul prin API pentru programul agenției.
        {ofertaFondator && <> Pentru Agențiile Fondatoare importul îl facem noi, gratuit: ne trimiți exportul din programul tău.</>}
        {" "}Prețuri finale, fără TVA (Hugetech SRL nu este plătitoare de TVA). La plata anuală plătești {LUNI_PLATITE_PE_AN} luni și primești 12.
        {ofertaFondator && <> Agențiile Fondatoare au primele {LUNI_GRATUITE} luni gratuite, apoi 50% reducere permanent.</>}
      </p>
    </>
  );
}
