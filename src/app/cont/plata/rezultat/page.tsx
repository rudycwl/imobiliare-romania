import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { lei } from "@/lib/tarife";

export const metadata: Metadata = { title: "Rezultatul plății", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RezultatPage({ searchParams }: { searchParams: Promise<{ comanda?: string }> }) {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const { comanda } = await searchParams;
  const c = comanda ? await db.comanda.findFirst({ where: { id: comanda, utilizatorId: u.id } }) : null;
  if (!c) redirect("/cont");
  return (
    <div className="ingust">
      <h1>Rezultatul plății</h1>
      <p className="muted">Comanda {c.id} · {c.descriere} · {lei(c.sumaBani / 100)}</p>
      {c.stare === "platita" && <p className="succes">Plata a reușit. Serviciul e activ, iar factura vine pe email.</p>}
      {c.stare === "respinsa" && <p className="eroare">Plata a fost respinsă. Nu s-a încasat nimic. Poți încerca din nou cu alt card.</p>}
      {c.stare === "noua" && (
        <p className="eroare">
          Așteptăm confirmarea de la NETOPIA. De obicei durează câteva secunde. <Link href={`/cont/plata/rezultat?comanda=${c.id}`}>Reîncarcă pagina</Link>.
        </p>
      )}
      <p>
        {c.anuntId && <Link href={`/cont/promoveaza/${c.anuntId}`}>Înapoi la promovarea anunțului</Link>}
        {!c.anuntId && <Link href="/cont">Înapoi la cont</Link>}
      </p>
    </div>
  );
}
