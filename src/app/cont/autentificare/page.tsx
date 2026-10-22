import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { FormularAutentificare } from "./Formular";

export const metadata: Metadata = { title: "Autentificare" };

export default async function AutentificarePage() {
  if (await utilizatorCurent()) redirect("/cont");
  return (
    <div className="ingust">
      <h1>Autentificare</h1>
      <FormularAutentificare />
      <p className="muted">
        Nu ai cont? <Link href="/cont/inregistrare">Creează unul gratuit</Link> ca persoană fizică, firmă sau agenție.
      </p>
    </div>
  );
}
