import type { Metadata } from "next";
import Link from "next/link";
import { PUBLICURI, STIRE_TVA } from "@/lib/continut";
import { citesteActualizat, citesteStiri, citesteStiriPiata } from "@/lib/continut-db";

export const metadata: Metadata = {
  title: "Legislație imobiliară la zi",
  description: "Noutăți legislative din surse oficiale și reguli pe scurt pentru cumpărători, vânzători, firme și dezvoltatori: notar, impozit la vânzare, TVA, impozite locale.",
};

export default async function Legislatie() {
  const [STIRI, STIRI_PIATA, ACTUALIZAT] = await Promise.all([citesteStiri(), citesteStiriPiata(), citesteActualizat()]);
  return (
    <div className="legal pagina-legi">
      <p className="supratitlu">Legislație la zi · actualizat {ACTUALIZAT}</p>
      <h1>Ce trebuie să știi când cumperi sau vinzi</h1>
      <p className="muted">
        Informații generale, explicate pe scurt, doar din surse oficiale (Monitorul Oficial, Portal Legislativ, ANAF, primării). Nu sunt consultanță
        juridică sau fiscală: pentru cazul tău, întreabă notarul sau contabilul.
      </p>

      <nav className="cuprins-legi" aria-label="Cuprins">
        <a href="#noutati">Noutăți legislative</a>
        <a href="#piata">Piața imobiliară</a>
        <Link href="/impozite-locale">Impozite locale pe orașe</Link>
        {PUBLICURI.map((p) => (
          <a key={p.id} href={`#${p.id}`}>{p.nume}</a>
        ))}
        <a href="#tva">TVA la locuințe noi</a>
      </nav>

      <section id="noutati">
        <h2>Noutăți legislative</h2>
        <div className="reguli">
          {STIRI.map((s) => (
            <div key={s.titlu} className="regula">
              <span className="stire-cat">{s.data} · {s.categorie}</span>
              <h3>{s.titlu}</h3>
              <p>{s.text}</p>
              <p className="muted small">
                {s.act}. <a href={s.sursa.url} target="_blank" rel="noopener noreferrer">{s.sursa.nume}</a>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="piata">
        <h2>Piața imobiliară</h2>
        <p className="muted small">Din presa economică, cu sursa datelor. Cifrele sunt ale publicațiilor și ale firmelor citate, nu ale CheiaMea.</p>
        <div className="reguli">
          {STIRI_PIATA.map((s) => (
            <div key={s.url} className="regula">
              <span className="stire-cat">{s.data} · Piață</span>
              <h3>{s.titlu}</h3>
              <p>{s.text}</p>
              <p className="muted small">
                Sursa: <a href={s.url} target="_blank" rel="noopener noreferrer">{s.sursa}</a>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="impozite-locale">
        <h2>Impozitul pe clădiri în orașul tău</h2>
        <p>
          Cota se stabilește de fiecare consiliu local. Am adunat cotele aprobate pentru 2026, cu link la hotărârea oficială.{" "}
          <Link href="/impozite-locale">Vezi impozitele pe orașe →</Link>
        </p>
      </section>

      {PUBLICURI.map((p) => (
        <section key={p.id} id={p.id}>
          <h2>{p.nume}</h2>
          <div className="reguli">
            {p.reguli.map((r, i) => (
              <div key={r.titlu} className="regula">
                <span className="nr">{String(i + 1).padStart(2, "0")}</span>
                <h3>{r.titlu}</h3>
                <p>{r.text}</p>
                {r.sursa && (
                  <p className="muted small">
                    Sursa: <a href={r.sursa.url} target="_blank" rel="noopener noreferrer">{r.sursa.nume}</a>
                  </p>
                )}
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
