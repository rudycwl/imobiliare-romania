import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { FormularStergere } from "./Formular";

export const metadata: Metadata = { title: "Ștergere cont", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConturiPage() {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) notFound();
  return (
    <>
      <h1>Ștergere completă a unui cont</h1>
      <p className="muted">
        Pentru conturi de test (de exemplu cel făcut pentru verificarea NETOPIA). Dispar contul, anunțurile, pozele și comenzile lui.
        Nu se poate anula. Conturile cu facturi emise nu se pot șterge de aici. · <Link href="/admin/moderare">Moderare</Link>
      </p>
      <FormularStergere />
    </>
  );
}
