import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListaAnunturi } from "@/components/AnuntCard";
import { Vanzator } from "@/components/Vanzator";
import { utilizatorCurent } from "@/lib/auth";
import { cautaAnunturi } from "@/lib/anunturi";
import { getJudet, getOras } from "@/lib/geo";
import { deconectare } from "./actiuni";

export const metadata: Metadata = { title: "Contul meu" };

export default async function ContPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const { anunturi, total } = await cautaAnunturi({ proprietar: u.id });
  return (
    <>
      <h1>Contul meu</h1>
      <Vanzator u={u} />
      <p className="muted">
        {u.email} · {u.telefon} · {getOras(u.judet, u.oras)?.nume}, {getJudet(u.judet)?.nume}
        {u.contact && ` · contact: ${u.contact}`}
      </p>
      <div className="actiuni">
        <Link href="/cont/anunt-nou" className="buton">+ Adaugă anunț</Link>
        {u.tip === "agentie" && <Link href={`/agentii/${u.slug}`}>Vezi profilul public al agenției</Link>}
        <form action={deconectare}>
          <button type="submit" className="secundar">Ieși din cont</button>
        </form>
      </div>
      <h2>Anunțurile mele</h2>
      {total ? <ListaAnunturi anunturi={anunturi} total={total} /> : <p className="muted">Nu ai publicat încă niciun anunț.</p>}
    </>
  );
}
