import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { FormularStergere, FormularStergereAnunt } from "./Formular";
import { ListaConturi } from "./ListaConturi";

export const metadata: Metadata = { title: "Conturi", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConturiPage({ searchParams }: { searchParams: Promise<{ q?: string; tip?: string }> }) {
  const u = await cerePanou();
  const { q, tip } = await searchParams;
  return (
    <>
      <h1>Conturi înscrise</h1>
      <form method="get" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <input type="search" name="q" defaultValue={q ?? ""} placeholder="Nume, email, localitate sau telefon" aria-label="Caută" style={{ flex: "1 1 240px" }} />
        <select name="tip" defaultValue={tip ?? ""} aria-label="Tip cont">
          <option value="">Toate tipurile</option>
          <option value="persoana-fizica">Persoane fizice</option>
          <option value="firma">Firme</option>
          <option value="agentie">Agenții</option>
        </select>
        <button type="submit">Caută</button>
      </form>
      <p className="muted small">Cele mai noi primele, maximum 500. Conturile șterse nu apar.</p>
      <ListaConturi cauta={q} tip={tip} limita={500} complet />
      <h2 id="stergere">Ștergere completă a unui cont</h2>
      <p className="muted">
        Pentru conturi de test (de exemplu cel făcut pentru verificarea NETOPIA). Dispar contul, anunțurile, pozele și comenzile lui.
        Nu se poate anula. Conturile cu facturi emise nu se pot șterge de aici. · <Link href="/admin/moderare">Moderare</Link>
      </p>
      <FormularStergere />
      <h2 id="anunt">Ștergerea unui anunț</h2>
      <p className="muted">Anunțul dispare definitiv, cu pozele lui. Contul proprietarului rămâne. Nu se poate anula.</p>
      <FormularStergereAnunt />
    </>
  );
}
