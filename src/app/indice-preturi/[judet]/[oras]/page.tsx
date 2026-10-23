import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getJudet, getOras } from "@/lib/geo";
import { indiceOras } from "@/lib/indice";
import { CumCalculam, nr } from "../../comun";

type Props = { params: Promise<{ judet: string; oras: string }> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export const revalidate = 3600;

// Paginile se generează la prima vizită și se reîmprospătează din oră în oră.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const j = getJudet(p.judet);
  const o = getOras(p.judet, p.oras);
  if (!j || !o) return { title: "Oraș inexistent" };
  const { oras } = await indiceOras(j.slug, o.slug);
  const title = `Prețuri apartamente pe cartiere în ${o.nume}`;
  const pret = oras.pretMp ? ` Preț median: ${nr(oras.pretMp)} €/m².` : "";
  const description = `Cât costă metrul pătrat și chiria în fiecare cartier din ${o.nume}, județul ${j.nume}, după anunțurile active de pe CheiaMea.${pret}`;
  const url = `${SITE}/indice-preturi/${j.slug}/${o.slug}`;
  // Fără anunțuri, pagina n-are conținut util pentru Google.
  return { title, description, alternates: { canonical: url }, robots: oras.total ? undefined : { index: false } };
}

const camere = (c: number) => (c === 1 ? "1 cameră" : c === 4 ? "4+ camere" : `${c} camere`);

export default async function IndiceOrasPage({ params }: Props) {
  const p = await params;
  const j = getJudet(p.judet);
  const o = getOras(p.judet, p.oras);
  if (!j || !o) notFound();
  const { oras, peCamere, cartiere } = await indiceOras(j.slug, o.slug);
  const maxMp = Math.max(0, ...cartiere.map((c) => c.pretMp ?? 0));
  const oriceCamere = peCamere.some((c) => c.pretVanzare || c.chirie);
  return (
    <>
      <Breadcrumbs items={[{ href: "/indice-preturi", label: "Prețuri pe cartiere" }, { label: o.nume }]} />
      <div className="titlu-cu-actiune">
        <h1>Prețuri imobiliare pe cartiere în {o.nume}</h1>
        <Link href={`/harta?judet=${j.slug}&oras=${o.slug}`} className="buton secundar">Vezi anunțurile pe hartă</Link>
      </div>
      <div className="statistici">
        <div><strong>{oras.pretMp ? `${nr(oras.pretMp)} €/m²` : "–"}</strong><span>apartamente de vânzare ({oras.apartamenteVanzare})</span></div>
        <div><strong>{oras.chirie ? `${nr(oras.chirie)} €` : "–"}</strong><span>chirie apartament pe lună ({oras.apartamenteChirie})</span></div>
        <div><strong>{oras.pretMpCase ? `${nr(oras.pretMpCase)} €/m²` : "–"}</strong><span>case de vânzare ({oras.caseVanzare})</span></div>
        <div><strong>{nr(oras.total)}</strong><span>anunțuri active</span></div>
      </div>

      {oriceCamere && (
        <>
          <h2>Apartamente după numărul de camere</h2>
          <div className="tabel-wrap">
            <table className="tabel-preturi">
              <thead>
                <tr><th>Apartament</th><th className="num">Preț de vânzare</th><th className="num">Chirie pe lună</th></tr>
              </thead>
              <tbody>
                {peCamere.map((c) => (
                  <tr key={c.camere}>
                    <td>{camere(c.camere)}</td>
                    <td className="num">{c.pretVanzare ? <strong className="pret">{nr(c.pretVanzare)} €</strong> : <span className="muted">–</span>}</td>
                    <td className="num">{c.chirie ? `${nr(c.chirie)} €` : <span className="muted">–</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Pe cartiere</h2>
      {cartiere.length ? (
        <div className="tabel-wrap">
          <table className="tabel-preturi tabel-cartiere">
            <thead>
              <tr>
                <th>Cartier</th>
                <th>Apartamente de vânzare (€/m²)</th>
                <th className="num">Chirie apartament</th>
                <th className="num">Case (€/m²)</th>
                <th className="num">Anunțuri</th>
              </tr>
            </thead>
            <tbody>
              {cartiere.map((c) => (
                <tr key={c.nume}>
                  <td>
                    <Link href={`/${j.slug}/${o.slug}?q=${encodeURIComponent(c.nume)}`}>{c.nume}</Link>
                  </td>
                  <td>
                    {c.pretMp ? (
                      <span className="bara-pret">
                        <span className="bara" style={{ width: `${Math.round((c.pretMp / maxMp) * 100)}%` }} />
                        <strong className="pret">{nr(c.pretMp)}</strong>
                        <span className="muted small">{nr(c.pretMpMin!)}–{nr(c.pretMpMax!)}</span>
                      </span>
                    ) : (
                      <span className="muted small">{c.apartamenteVanzare ? `doar ${c.apartamenteVanzare} anunț${c.apartamenteVanzare > 1 ? "uri" : ""}` : "–"}</span>
                    )}
                  </td>
                  <td className="num">{c.chirie ? `${nr(c.chirie)} €` : <span className="muted">–</span>}</td>
                  <td className="num">{c.pretMpCase ? nr(c.pretMpCase) : <span className="muted">–</span>}</td>
                  <td className="num">{nr(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">
          Încă nu sunt anunțuri active în {o.nume}. <Link href="/cont/anunt-nou">Publică primul anunț gratuit</Link>.
        </p>
      )}
      <CumCalculam />
      <p className="small"><Link href={`/${j.slug}/${o.slug}`}>← Toate anunțurile din {o.nume}</Link></p>
    </>
  );
}
