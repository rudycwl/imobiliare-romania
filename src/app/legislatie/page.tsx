import type { Metadata } from "next";
import Link from "next/link";
import { ACTUALIZAT, PUBLICURI, STIRE_TVA } from "@/lib/continut";

export const metadata: Metadata = {
  title: "Legislație imobiliară la zi",
  description: "Reguli pe scurt pentru cumpărători, vânzători persoane fizice, firme și dezvoltatori: notar, impozit la vânzare, TVA, acte necesare.",
};

export default function Legislatie() {
  return (
    <div className="legal pagina-legi">
      <p className="supratitlu">Legislație la zi · actualizat {ACTUALIZAT}</p>
      <h1>Ce trebuie să știi când cumperi sau vinzi</h1>
      <p className="muted">
        Informații generale, explicate pe scurt. Nu sunt consultanță juridică sau fiscală: pentru cazul tău, întreabă notarul sau contabilul.
      </p>

      <nav className="cuprins-legi" aria-label="Cuprins">
        {PUBLICURI.map((p) => (
          <a key={p.id} href={`#${p.id}`}>{p.nume}</a>
        ))}
        <a href="#tva">TVA la locuințe noi</a>
      </nav>

      {PUBLICURI.map((p) => (
        <section key={p.id} id={p.id}>
          <h2>{p.nume}</h2>
          <div className="reguli">
            {p.reguli.map((r, i) => (
              <div key={r.titlu} className="regula">
                <span className="nr">{String(i + 1).padStart(2, "0")}</span>
                <h3>{r.titlu}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section id="tva">
        <h2>{STIRE_TVA.titlu}</h2>
        <p>{STIRE_TVA.text}</p>
        <p className="muted small">
          Sursa: <a href={STIRE_TVA.url} target="_blank" rel="noopener noreferrer">{STIRE_TVA.sursa}</a>
        </p>
      </section>

      <p>
        <Link href="/cautare" className="buton">Caută anunțuri</Link>
      </p>
    </div>
  );
}
