import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectiunePoze } from "./SectiunePoze";

export const metadata: Metadata = { title: "Pozele anunțului", robots: { index: false } };

export default async function PozePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nou?: string }> }) {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const id = Number((await params).id);
  const a = Number.isInteger(id) ? await db.anunt.findFirst({ where: { id, proprietarId: u.id } }) : null;
  if (!a) notFound();
  const { nou } = await searchParams;
  return (
    <div className="ingust">
      {nou && <p className="succes">Anunțul a fost publicat. Adaugă acum pozele.</p>}
      <h1>Pozele anunțului</h1>
      <p>
        <Link href={`/anunt/${a.id}`}><strong>{a.titlu}</strong></Link>
      </p>
      <SectiunePoze anuntId={a.id} />
      <p>
        <Link href={`/anunt/${a.id}`} className="buton">Vezi anunțul</Link>
      </p>
    </div>
  );
}
