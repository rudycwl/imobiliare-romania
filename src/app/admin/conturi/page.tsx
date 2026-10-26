import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { FormularStergere, FormularStergereAnunt } from "./Formular";

export const metadata: Metadata = { title: "Ștergere cont", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConturiPage() {
  const u = await cerePanou();
  return (
    <>
      <h1>Ștergere completă a unui cont</h1>
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
