import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { FormularCampuri } from "../../../anunt-nou/Formular";
import { SectiunePoze } from "../poze/SectiunePoze";

export const metadata: Metadata = { title: "Editează anunțul", robots: { index: false } };

export default async function EditeazaPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const a = await db.anunt.findFirst({ where: { id, proprietarId: u.id } });
  if (!a) notFound();

  const valori = {
    tip: a.tip,
    tranzactie: a.tranzactie,
    titlu: a.titlu,
    descriere: a.descriere,
    pret: String(a.pret),
    suprafata: String(a.suprafata),
    camere: a.camere ? String(a.camere) : "",
    judet: a.judet,
    oras: a.oras,
    zona: a.zona,
    // Punctul găsit automat după cartier nu se trimite: la schimbarea cartierului se recalculează.
    ...(a.punctProprietar && a.lat != null && a.lng != null ? { lat: String(a.lat), lng: String(a.lng) } : {}),
  };
  return (
    <div className="editare-anunt">
      <p className="small"><Link href="/cont#anunturile-mele">← Anunțurile mele</Link></p>
      <h1>Editează anunțul</h1>
      <p className="muted small">Valabilitatea și promovările anunțului rămân neschimbate.</p>
      <div className="editare-coloane">
      <div>
        <FormularCampuri judet={a.judet} oras={a.oras} editare={{ id: a.id, valori }} />
      </div>
      <section id="poze" className="sectiune-poze">
        <h2>Pozele anunțului</h2>
        <p className="muted small">Pozele se salvează imediat ce le încarci, nu trebuie să apeși „Salvează modificările”.</p>
        <SectiunePoze anuntId={a.id} />
      </section>
      </div>
    </div>
  );
}
