import Link from "next/link";
import { utilizatorCurent } from "@/lib/auth";
import { ABONAMENTE, LUNI_PLATITE_PE_AN, lei, pretLunar } from "@/lib/tarife";

/** Prețurile abonamentelor le văd doar agențiile autentificate; restul (inclusiv un administrator logat cu cont de client) văd invitația. */
export async function TabelAbonamente() {
  const u = await utilizatorCurent();
  if (u?.tip !== "agentie")
    return (
      <div className="card card-body preturi-ascunse">
        <p>
          <strong>🔒 Prețurile abonamentelor sunt vizibile doar agențiilor imobiliare înregistrate.</strong>
        </p>
        <p className="muted">
          Patru abonamente, de la 25 de anunțuri active la nelimitat, cu credite lunare de promovare. Primele 100 de agenții
          primesc 6 luni gratuit și apoi 50% reducere permanent.
        </p>
        <div className="actiuni">
          <Link href="/pentru-agentii/inregistrare" className="buton">Înscrie agenția gratuit</Link>
          <Link href="/cont/autentificare">Am deja cont de agenție</Link>
        </div>
      </div>
    );
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
