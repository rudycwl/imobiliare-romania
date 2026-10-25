import Link from "next/link";
import { ListaAnunturi } from "@/components/AnuntCard";
import { CalculatorCredit } from "@/components/CalculatorCredit";
import { LegislatieFile } from "@/components/LegislatieFile";
import { cautaAnunturi, numarAnunturi, numarPeTip } from "@/lib/anunturi";
import { ACTUALIZAT, BANDA, PUBLICURI, STIRE_TVA, STIRI, STIRI_PIATA } from "@/lib/continut";
import { formatPret, textAnunturi, TIPURI } from "@/lib/etichete";
import { getOras, JUDETE } from "@/lib/geo";

// Regenerată cel mult o dată pe minut: pagina rămâne statică și rapidă.
export const revalidate = 60;

const CUVINTE = ["un apartament.", "o casă cu curte.", "un teren.", "un birou."];

/** Iconițe (contur) pentru categoriile de pe pagina de start, după cheia din TIPURI. */
const ICON_TIP: Record<string, string> = {
  apartament: "M4 21V5h10v16M14 9h6v12M7 9h2M7 13h2M7 17h2M17 13h1M17 17h1M2 21h20",
  casa: "M3 11l9-7 9 7v10H3zM9 21v-6h6v6",
  teren: "M3 20l6-10 4 6 3-4 5 8z",
  "spatiu-comercial": "M3 9l2-5h14l2 5M4 9v11h16V9M3 9h18M9 20v-6h6v6",
  birouri: "M3 7h18v13H3zM8 7V4h8v3M3 13h18",
  depozit: "M2 20V9l10-5 10 5v11M6 20v-8h12v8M6 16h12",
};

const AVANTAJE = [
  { titlu: "Gratuit pentru proprietari", text: "Până la 3 anunțuri active, fără comision.", icon: "M20 12V8H4v4M2 12h20v8H2zM12 8v12" },
  { titlu: "Vezi cine vinde", text: "Proprietar, firmă sau agenție, scris pe fiecare anunț.", icon: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6" },
  { titlu: "Anunțuri moderate", text: "Filtru automat și buton „Raportează” pe fiecare anunț.", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" },
  { titlu: "Alerte pentru căutări", text: "Salvezi căutarea și vezi primul anunțurile noi.", icon: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" },
];

export default async function Home() {
  const [{ anunturi }, numar, peTip] = await Promise.all([cautaAnunturi({}, 8), numarAnunturi(), numarPeTip()]);
  const [p1, p2] = anunturi;
  // Întâi județele cu anunțuri (cu numărul lor), apoi orașele mari, fără cifre: un „0” lângă „Populare” arată a site gol.
  const MARI = ["bucuresti", "cluj", "timis", "iasi", "constanta", "brasov", "prahova", "bihor"];
  const cuAnunturi = JUDETE.filter((j) => numar[j.slug]).sort((a, b) => numar[b.slug] - numar[a.slug]);
  const populare = [...cuAnunturi, ...JUDETE.filter((j) => !numar[j.slug] && MARI.includes(j.slug)).sort((a, b) => MARI.indexOf(a.slug) - MARI.indexOf(b.slug))].slice(0, 8);
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
              Anunțuri din toată țara, direct de la proprietari, firme și agenții. Vezi clar cine vinde.
            </p>
            <form method="get" action="/cautare" className="cautare-mare apare apare-3" role="search">
              <fieldset className="comutator">
                <legend className="ascuns">Tranzacție</legend>
                <label><input type="radio" name="tranzactie" value="vanzare" defaultChecked /><span>Cumpără</span></label>
                <label><input type="radio" name="tranzactie" value="inchiriere" /><span>Închiriază</span></label>
              </fieldset>
              <div className="cautare-campuri">
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
                  Buget maxim (€)
                  <input name="pretMax" type="number" min={0} step={1000} placeholder="oricât" />
                </label>
                <button type="submit">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
                  Caută
                </button>
              </div>
            </form>
            <nav className="orase-rapide apare apare-3" aria-label="Județe populare">
              <span>Populare:</span>
              {populare.map((j) => (
                <Link key={j.slug} href={`/${j.slug}`}>
                  {j.nume} {numar[j.slug] ? <span>{numar[j.slug]}</span> : null}
                </Link>
              ))}
            </nav>
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

      <section className="avantaje-bara container" aria-label="De ce CheiaMea">
        {AVANTAJE.map((a) => (
          <div key={a.titlu} className="avantaj-mic">
            <span className="avantaj-icon-mic" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
            </span>
            <span>
              <strong>{a.titlu}</strong>
              {a.text}
            </span>
          </div>
        ))}
      </section>

      <div className="container sectiuni">
        <section aria-labelledby="categorii">
          <div className="cap-sectiune">
            <h2 id="categorii" className="titlu-mare">Ce cauți?</h2>
          </div>
          <div className="categorii">
            {Object.entries(TIPURI).map(([k, v]) => (
              <Link key={k} href={`/cautare?tip=${k}`} className="categorie ridica">
                <span className="categorie-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICON_TIP[k] ?? ICON_TIP.casa} /></svg>
                </span>
                <strong>{v}</strong>
                <span className="muted">{textAnunturi(peTip[k] ?? 0)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bannere-sectiune" aria-label="Pe scurt">
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
                  <span className="supratitlu">Alerte</span>
                  <h2>Fii primul care vede anunțul potrivit.</h2>
                  <p>Caută, apasă „Salvează căutarea” și găsești în cont anunțurile noi.</p>
                </div>
                <Link href="/cautare" className="buton-banner alb">Începe o căutare <span className="sageata">→</span></Link>
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

        <section>
          <div className="cap-sectiune">
            <h2 className="titlu-mare">Anunțuri proaspete</h2>
            <Link href="/cautare" className="link-tot">Toate anunțurile <span className="sageata">→</span></Link>
          </div>
          <ListaAnunturi anunturi={anunturi} />
        </section>

        <section aria-labelledby="pasi" className="pasi-sectiune">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Vinzi sau închiriezi?</span>
              <h2 id="pasi" className="titlu-mare">Anunțul tău, online în 3 pași</h2>
            </div>
            <Link href="/cont/anunt-nou" className="buton">Adaugă anunț gratuit</Link>
          </div>
          <ol className="pasi">
            <li><span className="pas-nr">1</span><strong>Îți faci cont</strong>Cu email și parolă, în mai puțin de un minut.</li>
            <li><span className="pas-nr">2</span><strong>Completezi anunțul</strong>Preț, suprafață, până la 10 poze. Sau îl imporți de pe OLX.</li>
            <li><span className="pas-nr">3</span><strong>Primești telefoane</strong>Cumpărătorii te sună direct. Vezi în cont câți au văzut anunțul.</li>
          </ol>
        </section>

        <section id="stiri">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Noutăți</span>
              <h2 className="titlu-mare">Legi noi și piața imobiliară</h2>
            </div>
          </div>
          <div className="stiri">
            <Link href="/legislatie#tva" className="stire-mare ridica">
              <span className="eticheta-stire">Legislație</span>
              <h3>{STIRE_TVA.titlu}</h3>
              <p>Cota redusă de 9% s-a aplicat până la 30 septembrie 2026 (Legea 161/2026). Vezi ce se aplică acum la locuințele noi.</p>
              <span className="citeste">Citește explicația <span className="sageata">→</span></span>
            </Link>
            {STIRI.slice(1, 3).map((s) => (
              <a key={s.titlu} href={s.sursa.url} target="_blank" rel="noopener noreferrer" className="stire ridica">
                <span className="stire-cat">{s.data} · {s.categorie}</span>
                <span className="stire-titlu">{s.titlu}</span>
                <span className="muted small">{s.act}</span>
              </a>
            ))}
            {STIRI_PIATA.slice(0, 2).map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="stire ridica">
                <span className="stire-cat">{s.data} · Piață</span>
                <span className="stire-titlu">{s.titlu}</span>
                <span className="muted small">{s.sursa}</span>
              </a>
            ))}
            <Link href="/impozite-locale" className="stire ridica">
              <span className="stire-cat">Impozite locale</span>
              <span className="stire-titlu">Impozitul pe clădiri în 2026, oraș cu oraș</span>
              <span className="muted small">Din hotărârile consiliilor locale</span>
            </Link>
          </div>
        </section>

        <section id="credit" aria-labelledby="calc">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Calculator</span>
              <h2 id="calc" className="titlu-mare">Cât ai plăti pe lună?</h2>
            </div>
          </div>
          <CalculatorCredit />
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
