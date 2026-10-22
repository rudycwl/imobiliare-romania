import Link from "next/link";
import { Filtre } from "@/components/Filtre";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi, numarAnunturi } from "@/lib/anunturi";
import { JUDETE } from "@/lib/geo";

export default function Home() {
  const recente = cautaAnunturi({}).slice(0, 8);
  return (
    <>
      <section className="hero">
        <h1>Găsește-ți casa oriunde în România</h1>
        <p className="muted">Anunțuri de vânzare și închiriere în toate cele 41 de județe și municipiul București.</p>
        <Filtre valori={{}} action="/cautare" cuJudet />
      </section>

      <h2>Județe</h2>
      <ul className="judete">
        {JUDETE.map((j) => (
          <li key={j.slug}>
            <Link href={`/${j.slug}`}>
              <strong>{j.nume}</strong> <span className="muted">({numarAnunturi(j.slug)})</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2>Anunțuri recente</h2>
      <ListaAnunturi anunturi={recente} />
    </>
  );
}
