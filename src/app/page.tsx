import Link from "next/link";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi, numarAnunturi } from "@/lib/anunturi";
import { STIRE_TVA } from "@/lib/continut";
import { citesteStiri, citesteStiriPiata, impoziteOrasDb } from "@/lib/continut-db";
import { TIPURI } from "@/lib/etichete";
import { formatData, LOCURI_FONDATOARE, locuriRamase, LUNI_GRATUITE, TERMEN_FONDATOARE } from "@/lib/fondatori";
import { getOras, JUDETE } from "@/lib/geo";
import { caleImpozite } from "@/lib/impozite-locale";
import { indiceOras } from "@/lib/indice";
import { MAX_POZE } from "@/lib/poze";
import { citesteTexte } from "@/lib/setari";
import { ANUNTURI_GRATUITE, LUNI_GRATUITE_PROIECT, PRET_PROIECT_LUNAR, REDUCERE_FONDATOARE, ZILE_VALABILITATE, lei } from "@/lib/tarife";

// Regenerată cel mult o dată pe minut: pagina rămâne statică și rapidă.
export const revalidate = 60;

const CUVINTE = ["un apartament.", "o casă cu curte.", "un teren.", "un birou."];

/** Orașul cu care pornim: cartierele lui apar pe pagina de start. */
const PORNIRE = { judet: "iasi", oras: "iasi" } as const;
const CARTIERE_AFISATE = 6;

const ADAUGA = "/cont/anunt-nou";

const nr = (n: number) => new Intl.NumberFormat("ro-RO").format(n);

/** Iconiță de contur (24×24), desenată cu culoarea textului. */
function Icon({ d, marime = 24 }: { d: string; marime?: number }) {
  return (
    <svg width={marime} height={marime} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const BIFA = "M5 12l5 5 9-10";

const AVANTAJE = [
  { titlu: "Vezi cine vinde", text: "Proprietar, firmă sau agenție, scris pe fiecare anunț.", icon: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6" },
  { titlu: "Anunțuri moderate", text: "Filtru automat și buton „Raportează” pe fiecare anunț.", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" },
  { titlu: "Alerte pe e-mail", text: "Salvezi căutarea și afli primul de anunțurile noi.", icon: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" },
  { titlu: `${JUDETE.length} de județe`, text: "Pagini pe județe și orașe, din toată țara.", icon: "M3 21h18M5 21V10l7-6 7 6v11M10 21v-6h4v6" },
];

const UNELTE = [
  { titlu: "Calculator de rată", text: "Cât plătești lunar pentru un credit ipotecar.", href: "/calculatoare#credit", icon: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M16 11v4" },
  { titlu: "Impozite locale", text: "Impozitul pe clădiri, pe orașe, din hotărârile oficiale.", href: "/impozite-locale", icon: "M3 21h18M5 21V10l7-6 7 6v11M9 14h6" },
  { titlu: "Prețuri pe cartiere", text: "Prețul median pe metru pătrat, din anunțurile active.", href: "/indice-preturi", icon: "M3 20h18M6 16l4-5 3 3 5-7" },
  { titlu: "Legislație pe scurt", text: "Regulile la cumpărare și vânzare, din surse oficiale, explicate simplu.", href: "/legislatie", icon: "M6 3h9l4 4v14H6zM9 11h7M9 15h7" },
];

export default async function Home() {
  const [{ anunturi }, numar, texte, STIRI, STIRI_PIATA, indice, impozitPornire, locuri] = await Promise.all([
    cautaAnunturi({}, 8),
    numarAnunturi(),
    citesteTexte(),
    citesteStiri(),
    citesteStiriPiata(),
    indiceOras(PORNIRE.judet, PORNIRE.oras),
    impoziteOrasDb(PORNIRE.judet, PORNIRE.oras),
    locuriRamase(),
  ]);
  const BANDA = texte.banda;
  const orasPornire = getOras(PORNIRE.judet, PORNIRE.oras)?.nume ?? "Iași";
  // Întâi județele cu anunțuri (cu numărul lor), apoi orașele mari, fără cifre: un „0” lângă „Populare” arată a site gol.
  const MARI = ["bucuresti", "cluj", "timis", "iasi", "constanta", "brasov", "prahova", "bihor"];
  const cuAnunturi = JUDETE.filter((j) => numar[j.slug]).sort((a, b) => numar[b.slug] - numar[a.slug]);
  const populare = [...cuAnunturi, ...JUDETE.filter((j) => !numar[j.slug] && MARI.includes(j.slug)).sort((a, b) => MARI.indexOf(a.slug) - MARI.indexOf(b.slug))].slice(0, 8);

  // Doar cartierele cu medie calculată (cel puțin MIN_ANUNTURI apartamente de vânzare); cele mai bine acoperite întâi.
  const cartiere = indice.cartiere
    .filter((c) => c.pretMp !== null && c.nume !== "Fără zonă")
    .sort((a, b) => b.apartamenteVanzare - a.apartamenteVanzare)
    .slice(0, CARTIERE_AFISATE);
  const o = indice.oras;
  const statOras = [
    o.pretMp ? { valoare: `${nr(o.pretMp)} €/m²`, ce: `apartamente de vânzare (${o.apartamenteVanzare})` } : null,
    o.chirie ? { valoare: `${nr(o.chirie)} €`, ce: `chirie apartament pe lună (${o.apartamenteChirie})` } : null,
    o.pretMpCase ? { valoare: `${nr(o.pretMpCase)} €/m²`, ce: `case de vânzare (${o.caseVanzare})` } : null,
  ].filter((s) => s !== null);
  const arePreturi = cartiere.length > 0 || statOras.length > 0;
  const linkIndice = `/indice-preturi/${PORNIRE.judet}/${PORNIRE.oras}`;

  return (
    <div className="acasa">
      {BANDA.length > 0 && (
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
      )}

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
              {texte.erouSupratitlu}
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
              {texte.erouDescriere}
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

          <aside className="erou-card apare apare-3" aria-labelledby="publica-titlu">
            <p className="supratitlu">Vinzi sau închiriezi?</p>
            <h2 id="publica-titlu">Publici gratuit, în 2 minute.</h2>
            <ul className="bife">
              <li><Icon d={BIFA} marime={20} />Până la {ANUNTURI_GRATUITE} anunțuri active, {ZILE_VALABILITATE} de zile</li>
              <li><Icon d={BIFA} marime={20} />Până la {MAX_POZE} poze pe anunț</li>
              <li><Icon d={BIFA} marime={20} />Fără comision la vânzare</li>
              <li><Icon d={BIFA} marime={20} />Vezi în cont câte vizualizări are anunțul</li>
            </ul>
            <Link href={ADAUGA} className="buton-plin">Adaugă anunțul tău</Link>
          </aside>
        </div>
      </section>

      <section className="incredere" aria-label="De ce CheiaMea">
        <div className="container incredere-interior">
          {AVANTAJE.map((a) => (
            <div key={a.titlu} className="incredere-item">
              <span className="incredere-icon"><Icon d={a.icon} marime={26} /></span>
              <span>
                <strong>{a.titlu}</strong>
                {a.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="container sectiuni">
        {(arePreturi || impozitPornire) && (
          <section aria-labelledby="pornire">
            <div className="cap-sectiune">
              <div>
                <span className="supratitlu">Pornim din {orasPornire}</span>
                <h2 id="pornire" className="titlu-mare">
                  {arePreturi ? "Cât costă o locuință în cartierul tău" : `Fii printre primii în ${orasPornire}`}
                </h2>
              </div>
              {arePreturi && <Link href={linkIndice} className="link-tot">Toate cartierele din {orasPornire} <span className="sageata">→</span></Link>}
            </div>
            <div className="pornire">
              {arePreturi && (
                <div className="pornire-preturi">
                  {cartiere.length > 0 ? (
                    <table className="tabel-cartier">
                      <thead>
                        <tr><th scope="col">Cartier</th><th scope="col" className="num">Preț median apartamente</th></tr>
                      </thead>
                      <tbody>
                        {cartiere.map((c) => (
                          <tr key={c.nume}>
                            <th scope="row">{c.nume}</th>
                            <td className="num"><strong>{nr(c.pretMp ?? 0)} €/m²</strong> <span className="muted small">({c.apartamenteVanzare} anunțuri)</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="statistici">
                      {statOras.map((s) => (
                        <div key={s.ce}><strong>{s.valoare}</strong><span>{s.ce}</span></div>
                      ))}
                    </div>
                  )}
                  <p className="muted small">
                    {cartiere.length > 0 ? "" : `Încă nu sunt destule anunțuri pentru o medie pe cartiere; acestea sunt prețurile din tot orașul ${orasPornire}. `}
                    Din indicele de prețuri CheiaMea: mediana prețurilor cerute în anunțurile active, nu prețuri de tranzacție.
                  </p>
                </div>
              )}
              <div className="pornire-carduri">
                <Link href={ADAUGA} className="card-mic card-mic-cald ridica">
                  <strong>Primele anunțuri din {orasPornire}</strong>
                  <span>Anunțul tău apare printre primele din oraș. Gratuit pentru proprietari.</span>
                  <span className="card-mic-cta">Publică acum <span className="sageata">→</span></span>
                </Link>
                {impozitPornire && (
                  <Link href={`${caleImpozite(impozitPornire)}#calculator`} className="card-mic ridica">
                    <strong>Impozitul pe locuință în {orasPornire}</strong>
                    <span>Cotele din hotărârea consiliului local, calculate pentru locuința ta.</span>
                    <span className="card-mic-cta">Calculează <span className="sageata">→</span></span>
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="proaspete">
          <div className="cap-sectiune">
            <h2 id="proaspete" className="titlu-mare">Anunțuri proaspete</h2>
            {anunturi.length > 0 && <Link href="/cautare" className="link-tot">Toate anunțurile <span className="sageata">→</span></Link>}
          </div>
          {anunturi.length > 0 ? (
            <ListaAnunturi anunturi={anunturi} />
          ) : (
            <div className="gol-anunturi">
              <div>
                <strong>Fii printre primii: publică gratuit</strong>
                <span className="muted">Anunțurile noi apar aici, primele pe pagina de start.</span>
              </div>
              <Link href={ADAUGA} className="buton">Adaugă anunț gratuit</Link>
            </div>
          )}
        </section>

        <section aria-labelledby="unelte">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Unelte gratuite</span>
              <h2 id="unelte" className="titlu-mare">Tot ce verifici înainte să semnezi</h2>
            </div>
          </div>
          <div className="unelte">
            {UNELTE.map((u) => (
              <Link key={u.href} href={u.href} className="unealta ridica">
                <span className="unealta-icon"><Icon d={u.icon} marime={30} /></span>
                <strong>{u.titlu}</strong>
                <span className="muted">{u.text}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="profesionisti" aria-label="Pentru profesioniști">
          {locuri > 0 && (
            <div className="profesionist profesionist-inchis">
              <span className="pastila pastila-portocalie">{locuri === 1 ? "Mai e 1 loc" : `Mai sunt ${locuri} ${locuri % 100 >= 20 || locuri % 100 === 0 ? "de " : ""}locuri`} din {LOCURI_FONDATOARE}</span>
              <h2>Agenție Fondatoare</h2>
              <p>
                {LUNI_GRATUITE} luni gratuit, apoi {Math.round(REDUCERE_FONDATOARE * 100)}% reducere pe viață la abonament. Insigna „Agenție Fondatoare”
                pe profil și pe anunțuri. Importul din fișier CSV și accesul prin API, incluse.
              </p>
              <p className="mic">Ofertă valabilă până la {formatData(TERMEN_FONDATOARE)}.</p>
              <Link href="/pentru-agentii" className="buton-plin buton-plin-alb">Înscrie agenția</Link>
            </div>
          )}
          <div className="profesionist">
            <span className="pastila">Pentru dezvoltatori</span>
            <h2>Proiecte noi</h2>
            <p>Pagină de proiect cu galerie, hartă și lista unităților, cu preț și disponibilitate. Cererile clienților ajung direct la dezvoltator.</p>
            <p className="mic">{LUNI_GRATUITE_PROIECT} luni gratuit, apoi {lei(PRET_PROIECT_LUNAR)} / lună pe proiect.</p>
            <Link href="/proiecte" className="buton-plin">Vezi proiectele</Link>
          </div>
        </section>

        <section aria-labelledby="pasi" className="pasi-sectiune">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Vinzi sau închiriezi?</span>
              <h2 id="pasi" className="titlu-mare">Anunțul tău, online în 3 pași</h2>
            </div>
            <Link href={ADAUGA} className="buton">Adaugă anunț gratuit</Link>
          </div>
          <ol className="pasi">
            <li><span className="pas-nr">1</span><strong>Îți faci cont</strong>Cu email și parolă, în mai puțin de un minut.</li>
            <li><span className="pas-nr">2</span><strong>Completezi anunțul</strong>Preț, suprafață, până la {MAX_POZE} poze. Sau îl imporți de pe OLX, Storia, imobiliare.ro, Publi24 ori LaJumate.</li>
            <li><span className="pas-nr">3</span><strong>Primești telefoane</strong>Cumpărătorii te sună direct. Vezi în cont câte vizualizări are anunțul.</li>
          </ol>
        </section>

        <section aria-labelledby="judete">
          <h2 id="judete" className="titlu-mare">Caută pe județe</h2>
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

        <section id="stiri" aria-labelledby="stiri-titlu">
          <div className="cap-sectiune">
            <div>
              <span className="supratitlu">Noutăți</span>
              <h2 id="stiri-titlu" className="titlu-mare">Legi noi și piața imobiliară</h2>
            </div>
            <Link href="/legislatie" className="link-tot">Toate regulile <span className="sageata">→</span></Link>
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
          </div>
        </section>
      </div>
    </div>
  );
}
