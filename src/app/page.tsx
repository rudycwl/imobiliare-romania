import Link from "next/link";
import { ListaAnunturi } from "@/components/AnuntCard";
import { LegislatieFile } from "@/components/LegislatieFile";
import { cautaAnunturi, numarAnunturi } from "@/lib/anunturi";
import { ACTUALIZAT, BANDA, PROIECTE, PUBLICURI, STIRE_TVA, STIRI } from "@/lib/continut";
import { formatPret, TIPURI, TRANZACTII } from "@/lib/etichete";
import { getOras, JUDETE } from "@/lib/geo";

// Regenerată cel mult o dată pe minut: pagina rămâne statică și rapidă.
export const revalidate = 60;

const CUVINTE = ["un apartament.", "o casă cu curte.", "un teren.", "un birou."];

export default async function Home() {
  const [{ anunturi }, numar] = await Promise.all([cautaAnunturi({}, 8), numarAnunturi()]);
  const [p1, p2] = anunturi;
  return (
    <div className="acasa">
      <div className="banda" aria-label="Noutăți pe scurt">
        <div className="banda-pista">
          {[...BANDA, ...BANDA].map((b, i) => (
            <Link key={i} href={b.href} aria-hidden={i >= BANDA.length} tabIndex={i >= BANDA.length ? -1 : undefined}>
              <span className="banda-eticheta">{b.eticheta}</span>
              {b.text}
            </Link>
          ))}
        </div>
      </div>

      <section className="erou">
        <svg className="erou-cerc" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="96" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="2 6" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#F97316" strokeWidth="10" />
          <circle cx="100" cy="88" r="16" fill="#fff" />
          <path d="M92 98 h16 l6 34 h-28 z" fill="#fff" />
        </svg>
        <div className="container erou-interior">
          <div className="erou-text">
            <p className="supratitlu apare">
              <span className="punct" aria-hidden="true" />
              Anunțuri imobiliare din toată țara
            </p>
            <h1 className="apare apare-2">
              Cheia ta pentru
              <br />
              <span className="cuvinte" aria-hidden="true">
                <span className="cuvinte-pista">
                  {CUVINTE.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </span>
              </span>
              <span className="ascuns">o casă nouă</span>
            </h1>
            <p className="erou-desc apare apare-3">
              Anunțuri din fiecare județ, proiecte noi din orașul tău și legislația explicată pe înțelesul tuturor.
            </p>
            <form method="get" action="/cautare" className="cautare-mare apare apare-3" role="search">
              <label>
                Ce cauți
                <select name="tip" defaultValue="">
                  <option value="">Orice tip</option>
                  {Object.entries(TIPURI).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Unde
                <select name="judet" defaultValue="">
                  <option value="">Toată țara</option>
                  {JUDETE.map((j) => (
                    <option key={j.slug} value={j.slug}>{j.nume}</option>
                  ))}
                </select>
              </label>
              <label>
                Pentru
                <select name="tranzactie" defaultValue="">
                  <option value="">Vânzare și închiriere</option>
                  {Object.entries(TRANZACTII).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <button type="submit">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
                Caută
              </button>
            </form>
          </div>

          <div className="erou-colaj" aria-hidden="true">
            {p1 && (
              <div className="plutitor f1">
                <div className="plutitor-img" style={{ background: p1.imagine }} />
                <div className="plutitor-text">
                  <strong>{formatPret(p1)}</strong>
                  <span>{getOras(p1.judet, p1.oras)?.nume} · {p1.suprafata} m²</span>
                </div>
              </div>
            )}
            {p2 && (
              <div className="plutitor f2">
                <div className="plutitor-img" style={{ background: p2.imagine }} />
                <div className="plutitor-text">
                  <strong>{formatPret(p2)}</strong>
                  <span>{getOras(p2.judet, p2.oras)?.nume} · {p2.suprafata} m²</span>
                </div>
              </div>
            )}
            <div className="plutitor f3 alerta">
              <span className="alerta-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B2545" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" /></svg>
              </span>
              <span><strong>Salvează căutarea</strong>și vezi primul anunțurile noi</span>
            </div>
            <div className="plutitor f2 eticheta-direct">Direct de la proprietar</div>
          </div>
        </div>
      </section>

      <section className="bannere" aria-label="Oferte CheiaMea">
        <div className="bannere-cadru">
          <div className="bannere-pista">
            <div className="banner banner-portocaliu">
              <div>
                <span className="supratitlu">Pentru proprietari</span>
                <h2>Publici gratuit, în 2 minute.</h2>
                <p>Până la 3 anunțuri active, cu 10 poze fiecare. Fără comision.</p>
              </div>
              <Link href="/cont/anunt-nou" className="buton-banner inchis">Adaugă anunțul <span className="sageata">→</span></Link>
            </div>
            <div className="banner banner-albastru">
              <div>
                <span className="supratitlu">Proiecte noi</span>
                <h2>Vezi ce se construiește lângă tine.</h2>
                <p>Ansambluri în lucru, cu stadiul fiecărui proiect.</p>
              </div>
              <a href="#proiecte" className="buton-banner alb">Vezi proiectele <span className="sageata">→</span></a>
            </div>
            <div className="banner banner-crem">
              <div>
                <span className="supratitlu">Legislație la zi</span>
                <h2>Cumperi sau vinzi? Află regulile pe scurt.</h2>
                <p>Notar, impozit, TVA și actele necesare, explicate pe înțelesul tuturor.</p>
              </div>
              <Link href="/legislatie" className="buton-banner">Vezi regulile <span className="sageata">→</span></Link>
            </div>
          </div>
        </div>
        <div className="bannere-puncte" aria-hidden="true"><span /><span /><span /></div>
      </section>

      <div className="container sectiuni">
        <section>
          <div className="cap-sectiune">
            <h2 className="titlu-mare">Anunțuri proaspete</h2>
            <Link href="/cautare" className="link-tot">Toate anunțurile <span className="sageata">→</span></Link>
          </div>
          <ListaAnunturi anunturi={anunturi} />
        </section>

        <section id="proiecte">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Radar proiecte</span>
              <h2 className="titlu-mare">Ce se construiește acum</h2>
            </div>
          </div>
          <div className="proiecte">
            {PROIECTE.map((p) => (
              <article key={p.titlu} className="proiect ridica">
                <div className="proiect-sus">
                  <span className="stadiu">{p.stadiu}</span>
                  <span className="muted">{p.loc}</span>
                </div>
                <h3>{p.titlu}</h3>
                <p>{p.descriere}</p>
                <div className="progres" role="img" aria-label={`Stadiu aproximativ: ${p.progres}%`}>
                  <span style={{ width: `${p.progres}%` }} />
                </div>
                <div className="progres-etape" aria-hidden="true"><span>Aprobare</span><span>Construcție</span><span>Predare</span></div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="sursa">Sursa: {p.sursa}</a>
              </article>
            ))}
          </div>
        </section>

        <section id="stiri">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Noutăți</span>
              <h2 className="titlu-mare">Ce se întâmplă pe piață</h2>
            </div>
          </div>
          <div className="stiri">
            <Link href="/legislatie#tva" className="stire-mare ridica">
              <span className="eticheta-stire">Legislație</span>
              <h3>{STIRE_TVA.titlu}</h3>
              <p>Cota redusă de 9% s-a aplicat doar până la 31 iulie 2026. Vezi ce se aplică acum la locuințele noi.</p>
              <span className="citeste">Citește explicația <span className="sageata">→</span></span>
            </Link>
            {STIRI.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="stire ridica">
                <span className="stire-cat">{s.categorie}</span>
                <span className="stire-titlu">{s.titlu}</span>
                <span className="muted small">{s.sursa}</span>
              </a>
            ))}
          </div>
        </section>

        <section id="legi" className="legi">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Legislație la zi</span>
              <h2 className="titlu-mare">Ce trebuie să știi, pe scurt</h2>
              <p className="muted">Alege cine ești și îți arătăm regulile care te privesc.</p>
            </div>
            <span className="actualizat"><span className="punct verde" aria-hidden="true" />Actualizat: {ACTUALIZAT}</span>
          </div>
          <LegislatieFile publicuri={PUBLICURI} />
          <p className="muted small">
            Informații generale, nu consultanță juridică sau fiscală. Pentru cazul tău, întreabă notarul sau contabilul.{" "}
            <Link href="/legislatie">Toate regulile →</Link>
          </p>
        </section>

        <section>
          <h2 className="titlu-mare">Caută pe județe</h2>
          <ul className="judete">
            {JUDETE.map((j) => (
              <li key={j.slug}>
                <Link href={`/${j.slug}`}>
                  <strong>{j.nume}</strong> <span className="muted">({numar[j.slug] ?? 0})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="chemari">
          <div className="chemare chemare-portocalie ridica">
            <h2>Vinzi? Publică gratuit.</h2>
            <p>Până la 3 anunțuri active, 60 de zile fiecare, cu până la 10 poze. Poți importa și anunțul tău de pe OLX.</p>
            <Link href="/cont/anunt-nou" className="buton-banner inchis">Adaugă anunț <span className="sageata">→</span></Link>
          </div>
          <div className="chemare chemare-albastra ridica">
            <h2>Ești agenție sau dezvoltator?</h2>
            <p>Zonă separată pentru agenții, cu pagină proprie și abonamente fără comision.</p>
            <Link href="/pentru-agentii" className="buton-banner alb">Vezi oferta <span className="sageata">→</span></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
