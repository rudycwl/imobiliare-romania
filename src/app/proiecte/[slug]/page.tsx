import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Distribuie } from "@/components/Distribuie";
import { HartaLoc } from "@/components/harta/HartaLoc";
import { getJudet, getOras } from "@/lib/geo";
import { getProiect } from "@/lib/proiecte";
import { disponibile, pretMinim, STARI_UNITATE, textDisponibile } from "@/lib/proiecte-unitati";
import { urlPublic } from "@/lib/stocare";
import { FormularCerere } from "./FormularCerere";

type Props = { params: Promise<{ slug: string }> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";
const euro = (n: number) => `${new Intl.NumberFormat("ro-RO").format(n)} €`;

// Paginile se generează la prima vizită și se reîmprospătează la cel mult 5 minute (și imediat după salvarea din panou).
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProiect((await params).slug);
  if (!p) return { title: "Proiect inexistent" };
  const oras = getOras(p.judet, p.oras)?.nume ?? "";
  const title = `${p.nume}, ${oras}: proiect imobiliar nou`;
  const description = `${p.nume} de la ${p.dezvoltator}, ${oras}: ${textDisponibile(disponibile(p.unitati))}. ${p.descriere.replace(/\s+/g, " ")}`.slice(0, 160);
  const url = `${SITE}/proiecte/${p.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: p.poze[0] ? [new URL(urlPublic(p.poze[0]), SITE).toString()] : undefined } };
}

export default async function ProiectPage({ params }: Props) {
  const p = await getProiect((await params).slug);
  if (!p) notFound();
  const j = getJudet(p.judet);
  const o = getOras(p.judet, p.oras);
  const libere = disponibile(p.unitati);
  const min = pretMinim(p.unitati);
  const loc = [p.zona, o?.nume, j?.nume].filter(Boolean).join(", ");
  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/proiecte", label: "Proiecte noi" },
          ...(j ? [{ href: `/proiecte?judet=${j.slug}`, label: j.nume }] : []),
          { label: p.nume },
        ]}
      />
      <p className="eticheta-dezvoltator">Proiect imobiliar nou · prezentat de dezvoltator</p>
      <div className="anunt">
        {p.poze.length ? (
          <div className="galerie" aria-label="Pozele proiectului">
            {p.poze.map((cheie, i) => (
              <a key={cheie} href={urlPublic(cheie)} target="_blank" rel="noopener" title="Deschide poza mărită">
                {/* eslint-disable-next-line @next/next/no-img-element -- pozele vin direct din stocare */}
                <img src={urlPublic(cheie)} alt={`${p.nume}, poza ${i + 1} din ${p.poze.length}`} loading={i ? "lazy" : "eager"} />
              </a>
            ))}
          </div>
        ) : (
          <div className="anunt-img" style={{ background: "#0b2545" }}>
            <span>Proiect nou</span>
          </div>
        )}
        <div>
          <h1>{p.nume}</h1>
          {min !== null && <div className="pret mare">de la {euro(min)}</div>}
          <table className="detalii">
            <tbody>
              <tr><th>Dezvoltator</th><td>{p.dezvoltator}</td></tr>
              <tr><th>Localizare</th><td>{loc}{p.adresa ? ` · ${p.adresa}` : ""}</td></tr>
              <tr><th>Unități</th><td>{textDisponibile(libere)} din {p.unitati.length}</td></tr>
              {p.termenFinalizare && <tr><th>Finalizare</th><td>{p.termenFinalizare}</td></tr>}
            </tbody>
          </table>
          <div className="contact-dezvoltator">
            <strong>Contact dezvoltator</strong>
            <a href={`tel:${p.telefon.replace(/[^+0-9]/g, "")}`} className="buton">📞 {p.telefon}</a>
            {p.website && <a href={p.website} target="_blank" rel="noopener nofollow">Site-ul proiectului ↗</a>}
          </div>
          <Distribuie url={`${SITE}/proiecte/${p.slug}`} text={`${p.nume} – proiect nou pe CheiaMea`} />
        </div>
      </div>

      <section>
        <h2>Despre proiect</h2>
        {p.descriere.split(/\n{2,}/).map((par, i) => (
          <p key={i} style={{ whiteSpace: "pre-line" }}>{par}</p>
        ))}
      </section>

      <section>
        <h2>Unități ({textDisponibile(libere)})</h2>
        {p.unitati.length ? (
          <div className="tabel-wrap">
            <table className="tabel-preturi">
              <thead>
                <tr><th>Tip</th><th className="num">Camere</th><th className="num">Suprafață</th><th>Etaj</th><th className="num">Preț</th><th>Stare</th></tr>
              </thead>
              <tbody>
                {p.unitati.map((u, i) => (
                  <tr key={i} className={u.stare === "disponibil" ? undefined : "unitate-indisponibila"}>
                    <td>{u.tip}</td>
                    <td className="num">{u.camere ?? "—"}</td>
                    <td className="num">{new Intl.NumberFormat("ro-RO").format(u.suprafata)} m²</td>
                    <td>{u.etaj ?? "—"}</td>
                    <td className="num">{u.pret !== null ? <span className="pret">{euro(u.pret)}</span> : "La cerere"}</td>
                    <td><span className={`stare-unitate stare-${u.stare}`}>{STARI_UNITATE[u.stare]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Dezvoltatorul nu a publicat încă lista de unități. Cere detalii prin formularul de mai jos.</p>
        )}
      </section>

      {p.lat != null && p.lng != null && (
        <section className="loc-anunt">
          <h2>Pe hartă</h2>
          <HartaLoc lat={p.lat} lng={p.lng} />
        </section>
      )}

      <section className="ingust" id="cerere">
        <h2>Cere detalii de la dezvoltator</h2>
        <p className="muted small">Mesajul ajunge direct la {p.dezvoltator}, care îți răspunde pe email sau telefon.</p>
        <FormularCerere slug={p.slug} dezvoltator={p.dezvoltator} />
      </section>

      {j && (
        <p className="muted small" style={{ marginTop: 24 }}>
          <Link href={`/${j.slug}`}>Anunțuri imobiliare din {j.nume}</Link> · <Link href="/proiecte">Toate proiectele noi</Link>
        </p>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Residence",
            name: p.nume,
            url: `${SITE}/proiecte/${p.slug}`,
            description: p.descriere.slice(0, 500),
            image: p.poze.map((c) => new URL(urlPublic(c), SITE).toString()),
            address: { "@type": "PostalAddress", addressLocality: o?.nume, addressRegion: j?.nume, streetAddress: p.adresa ?? undefined, addressCountry: "RO" },
            ...(p.lat != null && p.lng != null ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } } : {}),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
