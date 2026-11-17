import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Vanzator } from "@/components/Vanzator";
import { Distribuie } from "@/components/Distribuie";
import { aceeasiProprietate, getAnunt, istoricPret } from "@/lib/anunturi";
import { evolutiePret } from "@/lib/istoric-pret";
import { pozeAnunt } from "@/lib/poze";
import { urlPublic } from "@/lib/stocare";
import { formatLei, formatPret, TIPURI, TRANZACTII } from "@/lib/etichete";
import { cursEuro } from "@/lib/curs";
import { getJudet, getOras } from "@/lib/geo";
import { Raporteaza } from "./Raporteaza";
import { ActiuniProprietar } from "./ActiuniProprietar";
import { ButonTelefon, Vizualizare } from "./Statistica";
import { Favorit } from "@/components/Favorit";
import { HartaLoc } from "@/components/harta/HartaLoc";
import { Galerie } from "@/components/Galerie";
import { localizare, randuriCaracteristici, textLocalizare } from "@/lib/anunt-format";
import { caracteristiciAfisate } from "@/lib/caracteristici";
import { RAZA_APROXIMATIVA_M } from "@/lib/locatie";
import { centruPentruPagina, completeazaCoordonate } from "@/lib/geocodare";
import { Caracteristici, Descriere, TextLocalizare } from "./Detalii";

type Props = { params: Promise<{ id: string }> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

/** Cercul pe centrul localității, când anunțul nu are încă loc pe hartă (m). */
const RAZA_LOCALITATE_M = 1500;

// Anunțurile se generează la prima vizită și se reîmprospătează la cel mult 5 minute.
export const revalidate = 300;

// Listă goală: paginile se generează static la prima vizită (ISR), nu la build.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getAnunt((await params).id);
  // Anunțurile expirate rămân accesibile prin link, dar nu mai apar în Google.
  if (!a) return { title: "Anunț inexistent" };
  const url = `${SITE}/anunt/${a.id}`;
  const description = a.descriere.replace(/\s+/g, " ").trim().slice(0, 160) || `${a.titlu}, ${formatPret(a)}`;
  return {
    title: a.titlu,
    description,
    alternates: { canonical: url },
    robots: a.expiraLa <= new Date() || a.moderare !== "ok" ? { index: false } : undefined,
  };
}

export default async function AnuntPage({ params }: Props) {
  const a = await getAnunt((await params).id);
  if (!a) notFound();
  const j = getJudet(a.judet)!;
  const o = getOras(a.judet, a.oras)!;
  const u = a.proprietar;
  // Un anunț oprit de moderare nu își mai arată conținutul nimănui; proprietarul îl vede în „Contul meu”.
  if (a.moderare !== "ok")
    return (
      <div className="ingust">
        <h1>{a.moderare === "respins" ? "Anunț retras" : "Anunț în verificare"}</h1>
        <p className="muted">
          {a.moderare === "respins"
            ? "Acest anunț a fost retras pentru că nu respectă regulile CheiaMea."
            : "Echipa CheiaMea verifică acest anunț. Revine pe site imediat ce e aprobat."}{" "}
          Vezi <Link href={`/${j.slug}/${o.slug}`}>alte anunțuri din {o.nume}</Link>.
        </p>
      </div>
    );
  // Fără loc pe hartă încă (anunț vechi, importat, geocodare nereușită): harta localității, cu un cerc mare,
  // iar în fundal anunțul primește locul aproximativ (stradă → zonă → centrul localității) pentru vizitele următoare.
  const faraLoc = a.lat == null || a.lng == null;
  const [poze, curs, istoric, altele, centru] = await Promise.all([
    pozeAnunt(a.id),
    cursEuro(),
    istoricPret(a.id),
    aceeasiProprietate(a),
    faraLoc ? centruPentruPagina(j.slug, o.slug) : Promise.resolve(null),
  ]);
  if (faraLoc) after(() => completeazaCoordonate());
  const hartaPagina =
    a.lat != null && a.lng != null
      ? // Punctul pus automat pe centrul localității (cartierul nu s-a găsit): cercul mare și textul spun asta.
        a.punctProprietar === false && a.sursaLoc === "localitate"
        ? { lat: a.lat, lng: a.lng, raza: RAZA_LOCALITATE_M, localitate: true }
        : { lat: a.lat, lng: a.lng, raza: a.locatieAproximativa ? RAZA_APROXIMATIVA_M : undefined, localitate: false }
      : centru
        ? { ...centru, raza: RAZA_LOCALITATE_M, localitate: true }
        : null;
  const ev = evolutiePret(istoric, a.pret, a.publicatLa);
  const loc = localizare(a.zona, o.nume, j.nume, j.slug);
  // Întâi câmpurile completate în formular; din descriere doar ce lipsește (anunțuri vechi).
  const caracteristici = randuriCaracteristici(a, caracteristiciAfisate(a), {
    tranzactie: TRANZACTII[a.tranzactie],
    tip: TIPURI[a.tip],
  });
  return (
    <>
      <Breadcrumbs
        items={[
          { href: `/${j.slug}`, label: j.nume },
          { href: `/${j.slug}/${o.slug}`, label: o.nume },
          { label: `Anunț #${a.id}` },
        ]}
      />
      {a.expiraLa <= new Date() && (
        <p className="eroare" style={{ marginBottom: 16 }}>
          Acest anunț nu mai este activ. Vezi <Link href={`/${j.slug}/${o.slug}`}>alte anunțuri din {o.nume}</Link>.
        </p>
      )}
      <ActiuniProprietar id={a.id} activ={a.expiraLa > new Date()} />
      <Vizualizare id={a.id} />
      <div className="anunt">
        <div className="anunt-media">
          {poze.length ? (
            <Galerie
              eticheta="Pozele anunțului"
              poze={poze.map((p, i) => ({ src: urlPublic(p.cheie), alt: `${a.titlu}, poza ${i + 1} din ${poze.length}` }))}
            />
          ) : (
            <div className="anunt-img" style={{ background: a.imagine }}>
              <span>{TIPURI[a.tip]}</span>
            </div>
          )}
        </div>
        <div className="anunt-info">
          <h1>{a.titlu}</h1>
          <div className="pret mare">{formatPret(a)}</div>
          {curs && <div className="pret-lei" title={`La cursul de ${curs.toFixed(4)} lei pentru 1 €. Prețul de referință e cel în euro.`}>{formatLei(a, curs)}</div>}
          {ev.scadere && (
            <p className="eticheta-pret scazut">
              Preț scăzut cu {ev.scadere.procent}% (de la {formatPret({ pret: ev.scadere.dela, tranzactie: a.tranzactie })})
            </p>
          )}
          <Caracteristici randuri={caracteristici} />
          <table className="detalii">
            <tbody>
              <tr><th>Localizare</th><td><TextLocalizare l={loc} href={`/${j.slug}/${o.slug}`} bucuresti={j.slug === "bucuresti"} /></td></tr>
              <tr><th>Publicat</th><td>{a.publicatLa.toLocaleDateString("ro-RO")} · pe piață de {ev.zile === 1 ? "o zi" : `${ev.zile} zile`}</td></tr>
              {ev.schimbari.length > 1 && (
                <tr>
                  <th>Istoric preț</th>
                  <td className="small">
                    {ev.schimbari.map((x, i) => (
                      <span key={i}>
                        {i > 0 && " → "}
                        {formatPret({ pret: x.pret, tranzactie: a.tranzactie })} ({x.la.toLocaleDateString("ro-RO")})
                      </span>
                    ))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Vanzator u={u} />
          <div className="actiuni-anunt">
            <ButonTelefon id={a.id} />
            <Favorit id={a.id} mare />
          </div>
          {altele.length > 0 && (
            <div className="aceeasi-proprietate">
              <p>
                <b>Aceeași proprietate</b> pare publicată și de {altele.length === 1 ? "un alt vânzător" : `alți ${altele.length} vânzători`}:
              </p>
              <ul>
                {altele.map((x) => (
                  <li key={x.id}>
                    <Link href={`/anunt/${x.id}`}>{x.proprietar.nume}</Link>: {formatPret({ pret: x.pret, tranzactie: a.tranzactie })}
                    {x.pret < a.pret ? " (mai ieftin)" : x.pret > a.pret ? " (mai scump)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Distribuie url={`${SITE}/anunt/${a.id}`} text={`${a.titlu} – ${formatPret(a)} pe CheiaMea`} />
          <Raporteaza id={a.id} />
        </div>
        {/* Descrierea stă sub galerie, pe toată lățimea coloanei principale; pe mobil vine după preț și contact. */}
        <section className="anunt-descriere" aria-labelledby="titlu-descriere">
          <h2 id="titlu-descriere">Descriere</h2>
          <Descriere text={a.descriere} />
        </section>
      </div>
      {a.expiraLa > new Date() && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateListing",
              name: a.titlu,
              url: `${SITE}/anunt/${a.id}`,
              datePosted: a.publicatLa.toISOString(),
              image: poze.map((p) => new URL(urlPublic(p.cheie), SITE).toString()),
              offers: { "@type": "Offer", price: a.pret, priceCurrency: "EUR", availability: "https://schema.org/InStock" },
              contentLocation: { "@type": "Place", name: textLocalizare(loc, j.slug) },
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      {hartaPagina && (
        <section className="loc-anunt">
          <div className="titlu-cu-actiune">
            <h2>Pe hartă</h2>
            <Link href={`/harta?judet=${j.slug}&oras=${o.slug}&tranzactie=${a.tranzactie}`} className="small">
              Alte anunțuri din zonă pe hartă →
            </Link>
          </div>
          {/* Fără bifa „locația exactă”: punctul e deja mutat pe server (src/lib/locatie.ts); aici doar cercul zonei. */}
          <HartaLoc lat={hartaPagina.lat} lng={hartaPagina.lng} razaAproximativa={hartaPagina.raza} />
          <p className="muted small">
            {hartaPagina.localitate
              ? `Anunțul e în ${a.zona && a.zona !== o.nume ? `zona ${a.zona}, ` : ""}${o.nume}. Pe hartă e centrul localității, nu locul proprietății; adresa exactă o afli de la vânzător.`
              : !a.locatieAproximativa
              ? `Locul marcat de vânzător${a.strada ? `: ${a.strada}${a.numar ? ` ${a.numar}` : ""}` : ""}.`
              : a.punctProprietar
                ? `Zonă aproximativă (cerc de ~${RAZA_APROXIMATIVA_M} m): adresa exactă o afli de la vânzător.`
                : `Locație aproximativă: zona ${a.zona}, ${o.nume}.`}
          </p>
        </section>
      )}
    </>
  );
}
