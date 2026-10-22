import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { anunturiFavorite } from "@/lib/anunturi";
import { AnuntCard } from "@/components/AnuntCard";
import { CadruCont } from "../CadruCont";

export const metadata: Metadata = { title: "Favorite", robots: { index: false } };

export default async function FavoritePage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare?inapoi=/cont/favorite");
  const anunturi = await anunturiFavorite(u.id);
  const acum = new Date();
  // Un anunț oprit de moderare sau expirat rămâne în listă, dar separat, ca să știi de ce nu mai e pe site.
  const active = anunturi.filter((a) => a.expiraLa > acum && a.moderare === "ok");
  const inactive = anunturi.filter((a) => !active.includes(a));
  return (
    <CadruCont u={u}>
      <h1>♥ Favorite</h1>
      {anunturi.length ? (
        <>
          <p className="muted">Ai salvat {anunturi.length === 1 ? "un anunț" : `${anunturi.length} anunțuri`}. Apasă pe inimă ca să scoți un anunț din listă.</p>
          <div className="grid">
            {active.map((a) => <AnuntCard key={a.id} a={a} />)}
          </div>
          {inactive.length > 0 && (
            <>
              <h2>Nu mai sunt disponibile</h2>
              <div className="grid inactive">
                {inactive.map((a) => <AnuntCard key={a.id} a={a} />)}
              </div>
            </>
          )}
        </>
      ) : (
        <p className="muted">
          Nu ai încă anunțuri favorite. Când îți place un anunț, apasă pe inima ♡ de pe el și îl găsești aici. <Link href="/cautare">Caută anunțuri</Link>
        </p>
      )}
    </CadruCont>
  );
}
