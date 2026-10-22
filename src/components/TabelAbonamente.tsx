import { ABONAMENTE, LUNI_PLATITE_PE_AN, lei, pretLunar } from "@/lib/tarife";

export function TabelAbonamente() {
  return (
    <>
      <div className="tabel-wrap">
        <table className="tabel-preturi">
          <thead>
            <tr>
              <th>Abonament</th>
              <th>Anunțuri active</th>
              <th>Credite de promovare pe lună</th>
              <th className="num">Preț / lună</th>
              <th className="num">Agenție Fondatoare</th>
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
                <td className="num"><span className="pret">{lei(a.pret)}</span></td>
                <td className="num">{lei(pretLunar(a, true))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted mic">
        Prețuri cu TVA inclus. La plata anuală plătești {LUNI_PLATITE_PE_AN} luni și primești 12. Agențiile Fondatoare au primele 6 luni gratuite, apoi 50% reducere permanent.
      </p>
    </>
  );
}
