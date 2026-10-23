import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getJudet, getOras } from "@/lib/geo";
import { indiceOrase } from "@/lib/indice";
import { CumCalculam, nr } from "./comun";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Prețuri imobiliare pe orașe și cartiere",
  description: "Cât costă metrul pătrat și chiria în orașele din România: prețuri mediane calculate din anunțurile active de pe CheiaMea, actualizate în fiecare oră.",
};

export default async function IndicePage() {
  const orase = (await indiceOrase()).filter((o) => getOras(o.judet, o.oras));
  return (
    <>
      <Breadcrumbs items={[{ label: "Prețuri pe cartiere" }]} />
      <h1>Prețuri imobiliare pe orașe și cartiere</h1>
      <p className="muted">
        Cât se cere pe metrul pătrat și pe chirie, după anunțurile active de pe CheiaMea. Alege orașul ca să vezi prețurile pe fiecare cartier.
      </p>
      {orase.length ? (
        <div className="tabel-wrap">
          <table className="tabel-preturi">
            <thead>
              <tr>
                <th>Oraș</th>
                <th className="num">Apartamente de vânzare</th>
                <th className="num">Chirie apartament</th>
                <th className="num">Anunțuri</th>
              </tr>
            </thead>
            <tbody>
              {orase.map((o) => (
                <tr key={`${o.judet}/${o.oras}`}>
                  <td>
                    <Link href={`/indice-preturi/${o.judet}/${o.oras}`}>
                      <strong>{getOras(o.judet, o.oras)!.nume}</strong>
                    </Link>
                    <span className="muted small"> · {getJudet(o.judet)!.nume}</span>
                  </td>
                  <td className="num">{o.pretMp ? <strong className="pret">{nr(o.pretMp)} €/m²</strong> : <span className="muted">–</span>}</td>
                  <td className="num">{o.chirie ? `${nr(o.chirie)} € / lună` : <span className="muted">–</span>}</td>
                  <td className="num">{nr(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Încă nu sunt anunțuri active. Prețurile apar aici pe măsură ce se publică anunțuri.</p>
      )}
      <CumCalculam />
    </>
  );
}
