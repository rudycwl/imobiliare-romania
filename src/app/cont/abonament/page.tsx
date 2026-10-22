import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { abonamentActiv } from "@/lib/abonamente";
import { formatData } from "@/lib/fondatori";
import { ABONAMENTE, LUNI_PLATITE_PE_AN, lei, pretAnual, pretLunar } from "@/lib/tarife";

export const metadata: Metadata = { title: "Abonamentul agenției", robots: { index: false } };

export default async function AbonamentPage() {
  const s = await utilizatorCurent();
  if (!s) redirect("/cont/autentificare");
  if (s.tip !== "agentie") redirect("/pentru-agentii");
  const u = await db.utilizator.findUniqueOrThrow({ where: { id: s.id } });
  const acum = new Date();
  const activ = abonamentActiv(u);
  const gratuit = u.gratuitPanaLa && u.gratuitPanaLa > acum;
  return (
    <>
      <h1>Abonamentul agenției</h1>
      {u.abonamentPanaLa && u.abonamentPanaLa > acum ? (
        <p className="succes">Ai abonamentul <strong>{activ?.nume}</strong> până la {formatData(u.abonamentPanaLa)}. Dacă plătești din nou același abonament, perioada se adaugă.</p>
      ) : gratuit ? (
        <p className="succes">
          Ai acces gratuit, cu toate funcțiile, până la {formatData(u.gratuitPanaLa!)}. Abonamentul plătit acum începe după această dată.
        </p>
      ) : (
        <p className="muted">Nu ai un abonament activ. Fără abonament poți avea 3 anunțuri active.</p>
      )}
      {u.fondator && <p>⭐ Ca Agenție Fondatoare plătești 50% din prețul de listă, permanent.</p>}
      <div className="grid abonamente">
        {ABONAMENTE.map((a) => (
          <div key={a.cod} className={`card card-body abonament${a.recomandat ? " recomandat" : ""}`}>
            <h2>{a.nume}</h2>
            <p>{a.anunturi === null ? "Anunțuri nelimitate" : `${a.anunturi} anunțuri active`}{a.agenti !== 1 && `, ${a.agenti ?? "agenți nelimitați"}${a.agenti ? " agenți" : ""}`}</p>
            <p className="muted small">
              Pe lună: {a.credite.reactualizari} reactualizări{a.credite.top7 > 0 && `, ${a.credite.top7} × Top în oraș 7 zile`}
              {a.extra && `, ${a.extra}`}
            </p>
            <p className="pret">
              {u.fondator && <span className="pret-vechi">{lei(a.pret)}</span>}
              {lei(pretLunar(a, u.fondator))} / lună
            </p>
            <Link href={`/cont/plata?abonament=${a.cod}`} className="buton">Plătește 30 de zile</Link>
            <Link href={`/cont/plata?abonament=${a.cod}&anual=1`} className="buton buton-contur-inchis">
              12 luni: {lei(pretAnual(a, u.fondator))} ({LUNI_PLATITE_PE_AN} luni plătite)
            </Link>
          </div>
        ))}
      </div>
      <p className="muted small">Prețuri cu TVA inclus. Abonamentul nu se reînnoiește automat. Vezi <Link href="/termeni">Termenii și condițiile</Link>.</p>
    </>
  );
}
