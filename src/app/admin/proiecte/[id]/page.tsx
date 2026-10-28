import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cerePanou } from "@/lib/panou";
import { MAX_POZE_PROIECT } from "@/lib/proiecte";
import { unitatiDinJson, unitatiInText } from "@/lib/proiecte-unitati";
import { stocareConfigurata, urlPublic } from "@/lib/stocare";
import { facePrimaActiune, stergePozaActiune } from "../actiuni";
import { FormularProiect } from "../Formular";
import { IncarcarePozeProiect } from "../IncarcarePoze";

export const metadata: Metadata = { title: "Editează proiectul", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Data în formatul câmpului <input type="date">, în ora României. */
const dataInput = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(d);

export default async function EditeazaProiectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nou?: string }> }) {
  await cerePanou();
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await db.proiect.findUnique({ where: { id } }) : null;
  if (!p) notFound();
  const { nou } = await searchParams;
  return (
    <div className="ingust" style={{ maxWidth: 820 }}>
      <p><Link href="/admin/proiecte">← Toate proiectele</Link></p>
      {nou && <p className="succes">Proiectul a fost creat. Adaugă acum pozele.</p>}
      <div className="titlu-cu-actiune">
        <h1>{p.nume}</h1>
        {p.activ && <Link href={`/proiecte/${p.slug}`} className="small">Vezi pagina publică →</Link>}
      </div>

      <h2>Poze</h2>
      {stocareConfigurata() ? (
        <IncarcarePozeProiect proiectId={p.id} ramase={MAX_POZE_PROIECT - p.poze.length} />
      ) : (
        <p className="eroare">Stocarea pozelor nu e configurată pe acest server.</p>
      )}
      {p.poze.length > 0 && (
        <ul className="poze-editare">
          {p.poze.map((cheie, i) => (
            <li key={cheie}>
              {/* eslint-disable-next-line @next/next/no-img-element -- pozele vin direct din stocare */}
              <img src={urlPublic(cheie)} alt={`Poza ${i + 1}`} loading="lazy" />
              {i === 0 && <span className="eticheta-coperta">★ Copertă</span>}
              <form className="butoane-poza">
                <input type="hidden" name="proiect" value={p.id} />
                <input type="hidden" name="cheie" value={cheie} />
                {i > 0 && <button type="submit" formAction={facePrimaActiune} title="Pune această poză prima" aria-label={`Fă coperta din poza ${i + 1}`}>★ Fă copertă</button>}
                <button type="submit" formAction={stergePozaActiune} className="sterge" title="Șterge poza" aria-label={`Șterge poza ${i + 1}`}>🗑</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2>Date proiect</h2>
      <FormularProiect
        v={{
          id: p.id,
          slug: p.slug,
          nume: p.nume,
          dezvoltator: p.dezvoltator,
          descriere: p.descriere,
          loc: `${p.judet}/${p.oras}`,
          zona: p.zona ?? "",
          adresa: p.adresa ?? "",
          lat: p.lat?.toString() ?? "",
          lng: p.lng?.toString() ?? "",
          website: p.website ?? "",
          telefon: p.telefon,
          email: p.email,
          unitati: unitatiInText(unitatiDinJson(p.unitati)),
          termenFinalizare: p.termenFinalizare ?? "",
          activ: p.activ,
          gratuitPanaLa: dataInput(p.gratuitPanaLa),
        }}
      />
    </div>
  );
}
