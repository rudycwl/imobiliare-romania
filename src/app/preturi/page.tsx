import Link from "next/link";
import type { Metadata } from "next";
import { TabelAbonamente } from "@/components/TabelAbonamente";
import { ANUNTURI_GRATUITE, PROMOVARI, REDUCERE_PROMOVARI_ABONATI, ZILE_VALABILITATE, lei } from "@/lib/tarife";

export const metadata: Metadata = {
  title: "Prețuri",
  description: `Publicare gratuită pentru proprietari (până la ${ANUNTURI_GRATUITE} anunțuri), promovări de la 7 lei și abonamente pentru agenții imobiliare.`,
  alternates: { canonical: "/preturi" },
};

export default function PreturiPage() {
  return (
    <>
      <section className="hero">
        <h1>Prețuri CheiaMea</h1>
        <p>Proprietarii publică gratuit. Plătești doar dacă vrei mai multă vizibilitate.</p>
      </section>

      <h2>Persoane fizice și firme</h2>
      <div className="card card-body gratuit">
        <p className="pret-mare">0 lei</p>
        <p>
          Până la <strong>{ANUNTURI_GRATUITE} anunțuri active</strong>, fiecare valabil {ZILE_VALABILITATE} de zile.
          Le prelungești gratuit, dintr-un clic, din contul tău.
        </p>
        <Link href="/cont/anunt-nou" className="buton">Publică gratuit</Link>
      </div>

      <h3>Promovări (opționale)</h3>
      <div className="tabel-wrap">
        <table className="tabel-preturi">
          <thead>
            <tr><th>Promovare</th><th>Ce face</th><th className="num">Preț</th></tr>
          </thead>
          <tbody>
            {PROMOVARI.map((p) => (
              <tr key={p.cod} className={p.cod === "vanzare-rapida" ? "recomandat" : undefined}>
                <td><strong>{p.nume}</strong></td>
                <td>{p.descriere}</td>
                <td className="num"><span className="pret">{lei(p.pret)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted mic">Prețuri cu TVA inclus. Agențiile abonate au {Math.round(REDUCERE_PROMOVARI_ABONATI * 100)}% reducere la promovări.</p>

      <h2 id="agentii">Agenții imobiliare</h2>
      <p>Abonament lunar cu pagină de agenție, logo pe anunțuri, statistici și credite lunare de promovare.</p>
      <TabelAbonamente />
      <p><Link href="/pentru-agentii" className="buton">Detalii pentru agenții</Link></p>
    </>
  );
}
