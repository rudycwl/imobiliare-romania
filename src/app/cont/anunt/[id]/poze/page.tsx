import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_POZE, pozeAnunt } from "@/lib/poze";
import { stocareConfigurata, urlPublic } from "@/lib/stocare";
import { facePrimaActiune, stergePozaActiune } from "./actiuni";
import { IncarcarePoze } from "./Incarcare";

export const metadata: Metadata = { title: "Pozele anunțului", robots: { index: false } };

export default async function PozePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nou?: string }> }) {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const id = Number((await params).id);
  const a = Number.isInteger(id) ? await db.anunt.findFirst({ where: { id, proprietarId: u.id } }) : null;
  if (!a) notFound();
  const { nou } = await searchParams;
  const poze = await pozeAnunt(a.id);
  return (
    <div className="ingust">
      {nou && <p className="succes">Anunțul a fost publicat. Adaugă acum pozele.</p>}
      <h1>Pozele anunțului</h1>
      <p>
        <Link href={`/anunt/${a.id}`}><strong>{a.titlu}</strong></Link>
      </p>
      {stocareConfigurata() ? (
        <IncarcarePoze anuntId={a.id} ramase={MAX_POZE - poze.length} />
      ) : (
        <p className="eroare">Încărcarea pozelor va fi disponibilă în curând.</p>
      )}
      {poze.length > 0 && (
        <ul className="poze-editare">
          {poze.map((p, i) => (
            <li key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- pozele vin direct din stocare, nu prin Netlify */}
              <img src={urlPublic(p.cheie)} alt={`Poza ${i + 1}`} loading="lazy" />
              <form className="butoane-anunt">
                <input type="hidden" name="anunt" value={a.id} />
                <input type="hidden" name="poza" value={p.id} />
                {i === 0 ? <span className="eticheta-promo">Copertă</span> : <button type="submit" formAction={facePrimaActiune} className="secundar">Fă copertă</button>}
                <button type="submit" formAction={stergePozaActiune} className="secundar">Șterge</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link href={`/anunt/${a.id}`} className="buton">Vezi anunțul</Link>
      </p>
    </div>
  );
}
