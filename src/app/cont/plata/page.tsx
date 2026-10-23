import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJudet, getOras } from "@/lib/geo";
import { citesteCerere, detaliiComanda, type CererePlata } from "@/lib/plati/comenzi";
import { modTest, netopiaConfigurat } from "@/lib/plati/netopia";
import { lei } from "@/lib/tarife";
import { FormularPlata } from "./Formular";

export const metadata: Metadata = { title: "Plată", robots: { index: false } };

export default async function PlataPage({ searchParams }: { searchParams: Promise<CererePlata> }) {
  const sesiune = await utilizatorCurent();
  if (!sesiune) redirect("/cont/autentificare");
  const q = await searchParams;
  const u = await db.utilizator.findUniqueOrThrow({ where: { id: sesiune.id } });
  const cerere = citesteCerere(q);
  const anunt =
    cerere?.tip === "promovare" ? await db.anunt.findFirst({ where: { id: cerere.anuntId, proprietarId: u.id, expiraLa: { gt: new Date() } } }) : null;
  const d = cerere && (cerere.tip === "abonament" || anunt) ? detaliiComanda(u, cerere) : null;
  if (!cerere || !d) {
    return (
      <div className="ingust">
        <h1>Plată</h1>
        <p className="eroare">Comanda nu e validă. Alege din nou promovarea sau abonamentul.</p>
        <p><Link href="/cont">Înapoi la cont</Link></p>
      </div>
    );
  }
  const firma = u.tip !== "persoana-fizica";
  return (
    <div className="ingust">
      <h1>Plată</h1>
      <div className="card card-body rezumat-plata">
        <p>{d.descriere}</p>
        {anunt && <p className="muted small">{anunt.titlu}</p>}
        <p className="pret-mare-plata">{lei(d.sumaBani / 100)}</p>
        <p className="muted small">Preț final, fără TVA (Hugetech SRL nu este plătitoare de TVA). Factura vine pe email.</p>
      </div>
      {!netopiaConfigurat() ? (
        <p className="eroare">Plata cu cardul va fi disponibilă în curând.</p>
      ) : (
        <>
          {modTest() && <p className="muted small">Mod de test NETOPIA: nu se încasează bani reali.</p>}
          <FormularPlata
            cerere={JSON.stringify(cerere)}
            firma={firma}
            valori={{
              nume: u.tip === "persoana-fizica" ? u.nume : u.contact ?? u.nume,
              email: u.email ?? "",
              telefon: u.telefon,
              adresa: u.adresa ?? "",
              regCom: u.regCom ?? "",
              cui: u.cui ?? "",
              localitate: `${getOras(u.judet, u.oras)?.nume ?? u.oras}, ${getJudet(u.judet)?.nume ?? u.judet}`,
            }}
          />
        </>
      )}
    </div>
  );
}
