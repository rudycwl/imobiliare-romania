import Link from "next/link";
import type { Metadata } from "next";
import { ANUNTURI_GRATUITE, PROMOVARI, ZILE_VALABILITATE, lei } from "@/lib/tarife";

export const metadata: Metadata = {
  title: "Prețuri",
  description: `Publicare gratuită pentru proprietari (până la ${ANUNTURI_GRATUITE} anunțuri), promovări de la 7 lei.`,
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
      <p className="muted mic">Prețuri finale, fără TVA (Hugetech SRL nu este plătitoare de TVA).</p>
    </>
  );
}
