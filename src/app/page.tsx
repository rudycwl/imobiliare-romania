import Link from "next/link";
import { Filtre } from "@/components/Filtre";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi, numarAnunturi } from "@/lib/anunturi";
import { JUDETE } from "@/lib/geo";

// Regenerată cel mult o dată pe minut: pagina rămâne statică și rapidă.
export const revalidate = 60;

export default async function Home() {
  const [{ anunturi }, numar] = await Promise.all([cautaAnunturi({}, 8), numarAnunturi()]);
  return (
    <>
      <section className="hero hero-anim">
        <div className="forme" aria-hidden="true"><span>🏠</span><span>🔑</span><span>🏢</span></div>
        <h1>Găsește-ți casa oriunde în România</h1>
        <p className="muted">Anunțuri de vânzare și închiriere în toate cele 41 de județe și municipiul București.</p>
        <Filtre valori={{}} action="/cautare" cuJudet />
      </section>

      <Link href="/cont/anunt-nou" className="banner-import">
        <span className="banner-icon" aria-hidden="true">🏠</span>
        <span>
          <strong>Proprietarii publică gratuit</strong>
          <span>Importă anunțul tău din OLX în 30 de secunde</span>
        </span>
        <span className="banner-cta">Publică acum →</span>
      </Link>

      <h2>Județe</h2>
      <ul className="judete">
        {JUDETE.map((j) => (
          <li key={j.slug}>
            <Link href={`/${j.slug}`}>
              <strong>{j.nume}</strong> <span className="muted">({numar[j.slug] ?? 0})</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2>Anunțuri recente</h2>
      <ListaAnunturi anunturi={anunturi} />
    </>
  );
}
