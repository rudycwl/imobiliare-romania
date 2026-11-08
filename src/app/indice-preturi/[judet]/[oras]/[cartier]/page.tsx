import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatPret } from "@/lib/etichete";
import { getJudet, getOras } from "@/lib/geo";
import { caleImpozite, impoziteOras } from "@/lib/impozite-locale";
import { evolutieIndice, indiceCartier, MIN_ANUNTURI } from "@/lib/indice";
import type { Tranzactie } from "@/modules/types";
import { CumCalculam, nr } from "../../../comun";

// Radarul de preț pe cartier: prețul cerut pe m² și chiria, pe camere, evoluția lunară și anunțurile din cartier.

type Props = { params: Promise<{ judet: string; oras: string; cartier: string }> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

async function date(p: Awaited<Props["params"]>) {
  const j = getJudet(p.judet);
  const o = getOras(p.judet, p.oras);
  if (!j || !o || !/^[a-z0-9-]{1,80}$/.test(p.cartier)) return null;
  const c = await indiceCartier(j.slug, o.slug, p.cartier);
  return c ? { j, o, c } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const d = await date(p);
  if (!d) return { title: "Cartier fără anunțuri", robots: { index: false } };
  const { j, o, c } = d;
  const title = `Prețuri apartamente ${c.nume}, ${o.nume}: €/m² și chirii`;
  const pret = c.pretMp ? ` Preț median cerut: ${nr(c.pretMp)} €/m².` : "";
  return {
    title,
    description: `Cât costă metrul pătrat și chiria în ${c.nume}, ${o.nume} (județul ${j.nume}), după anunțurile active de pe CheiaMea.${pret}`,
    alternates: { canonical: `${SITE}/indice-preturi/${j.slug}/${o.slug}/${p.cartier}` },
    // Cu sub MIN_ANUNTURI anunțuri pagina n-are cifre; nu o trimitem în Google.
    robots: c.total >= MIN_ANUNTURI ? undefined : { index: false },
  };
}

const camere = (c: number) => (c === 1 ? "1 cameră" : c === 4 ? "4+ camere" : `${c} camere`);
const lunaText = (l: string) => new Date(`${l}-15T12:00:00Z`).toLocaleDateString("ro-RO", { month: "short", year: "numeric" });

export default async function IndiceCartierPage({ params }: Props) {
  const p = await params;
  const d = await date(p);
  if (!d) notFound();
  const { j, o, c } = d;
  const [evolutie, oras] = await Promise.all([evolutieIndice(j.slug, o.slug, p.cartier), evolutieIndice(j.slug, o.slug)]);
  const pretOras = oras.at(-1)?.pretMp ?? null;
  const cuPret = evolutie.filter((e) => e.pretMp);
  const maxEv = Math.max(1, ...cuPret.map((e) => e.pretMp ?? 0));
  const impozite = impoziteOras(j.slug, o.slug);
  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/indice-preturi", label: "Prețuri pe cartiere" },
          { href: `/indice-preturi/${j.slug}/${o.slug}`, label: o.nume },
          { label: c.nume },
        ]}
      />
      <h1>
        Prețuri imobiliare în {c.nume}, {o.nume}
      </h1>
      <div className="statistici">
        <div>
          <strong>{c.pretMp ? `${nr(c.pretMp)} €/m²` : "–"}</strong>
          <span>apartamente de vânzare ({c.apartamenteVanzare})</span>
        </div>
        <div>
          <strong>{c.chirie ? `${nr(c.chirie)} €` : "–"}</strong>
          <span>chirie apartament pe lună ({c.apartamenteChirie})</span>
        </div>
        <div>
          <strong>{c.pretMpCase ? `${nr(c.pretMpCase)} €/m²` : "–"}</strong>
          <span>case de vânzare ({c.caseVanzare})</span>
        </div>
        <div>
          <strong>{nr(c.total)}</strong>
          <span>anunțuri active în cartier</span>
        </div>
      </div>
      {c.pretMp && pretOras ? (
        <p>
          Metrul pătrat cerut în {c.nume} e cu{" "}
          <b>
            {Math.abs(Math.round(((c.pretMp - pretOras) / pretOras) * 100))}% {c.pretMp >= pretOras ? "peste" : "sub"}
          </b>{" "}
          media orașului ({nr(pretOras)} €/m²).
        </p>
      ) : null}

      {c.peCamere.some((x) => x.pretVanzare) && (
        <>
          <h2>Apartamente după numărul de camere</h2>
          <div className="tabel-wrap">
            <table className="tabel-preturi">
              <thead>
                <tr>
                  <th>Apartament</th>
                  <th className="num">Preț median de vânzare</th>
                  <th className="num">Anunțuri</th>
                </tr>
              </thead>
              <tbody>
                {c.peCamere.map((x) => (
                  <tr key={x.camere}>
                    <td>{camere(x.camere)}</td>
                    <td className="num">{x.pretVanzare ? <strong className="pret">{nr(x.pretVanzare)} €</strong> : <span className="muted">–</span>}</td>
                    <td className="num">{x.vanzare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Evoluția prețului pe m²</h2>
      {cuPret.length >= 2 ? (
        <div className="tabel-wrap">
          <table className="tabel-preturi tabel-cartiere">
            <thead>
              <tr>
                <th>Luna</th>
                <th>Apartamente de vânzare (€/m²)</th>
                <th className="num">Anunțuri</th>
              </tr>
            </thead>
            <tbody>
              {evolutie.map((e) => (
                <tr key={e.luna}>
                  <td>{lunaText(e.luna)}</td>
                  <td>
                    {e.pretMp ? (
                      <span className="bara-pret">
                        <span className="bara" style={{ width: `${Math.round((e.pretMp / maxEv) * 100)}%` }} />
                        <strong className="pret">{nr(e.pretMp)}</strong>
                      </span>
                    ) : (
                      <span className="muted small">date insuficiente</span>
                    )}
                  </td>
                  <td className="num">{e.anunturi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Evoluția apare după a doua lună cu date. O actualizăm de câteva ori pe zi.</p>
      )}

      <h2>Anunțuri din {c.nume}</h2>
      <ul>
        {c.recente.map((a) => (
          <li key={a.id}>
            <Link href={`/anunt/${a.id}`}>{a.titlu}</Link>: {formatPret({ pret: a.pret, tranzactie: a.tranzactie as Tranzactie })}, {a.suprafata} m²
          </li>
        ))}
      </ul>
      <p>
        <Link href={`/${j.slug}/${o.slug}?q=${encodeURIComponent(c.nume)}`}>Toate anunțurile din {c.nume} →</Link>
      </p>
      {impozite && (
        <p>
          Cât plătești impozit pe o locuință din {o.nume}: <Link href={caleImpozite(impozite)}>impozitele locale în {o.nume}</Link>.
        </p>
      )}
      <CumCalculam />
      <p className="small">
        <Link href={`/indice-preturi/${j.slug}/${o.slug}`}>← Toate cartierele din {o.nume}</Link>
      </p>
    </>
  );
}
