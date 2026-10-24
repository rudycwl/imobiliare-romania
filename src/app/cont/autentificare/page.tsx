import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { FormularAutentificare } from "./Formular";

export const metadata: Metadata = { title: "Autentificare" };

/** Doar adrese din site, ca linkul de întoarcere să nu poată trimite în altă parte. */
const caleSigura = (c?: string) => (c && /^\/(?![\/\\])/.test(c) ? c : "/cont");

export default async function AutentificarePage({ searchParams }: { searchParams: Promise<{ inapoi?: string }> }) {
  const inapoi = caleSigura((await searchParams).inapoi);
  if (await utilizatorCurent()) redirect(inapoi);
  return (
    <div className="ingust">
      <h1>Autentificare</h1>
      <FormularAutentificare inapoi={inapoi} />
      <p className="muted">
        <Link href="/cont/parola-uitata">Ai uitat parola?</Link>
      </p>
      <p className="muted">
        Nu ai cont? <Link href="/cont/inregistrare">Creează unul gratuit</Link> ca persoană fizică, firmă sau agenție.
      </p>
    </div>
  );
}
