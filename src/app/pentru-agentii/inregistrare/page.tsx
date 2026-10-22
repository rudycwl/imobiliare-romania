import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { utilizatorCurent } from "@/lib/auth";
import { FormularInregistrare } from "@/app/cont/inregistrare/Formular";

export const metadata: Metadata = { title: "Cont de agenție" };

export default async function InregistrareAgentiePage() {
  if (await utilizatorCurent()) redirect("/cont");
  return (
    <div className="ingust">
      <Breadcrumbs items={[{ label: "Pentru agenții", href: "/pentru-agentii" }, { label: "Cont de agenție" }]} />
      <h1>Creează contul agenției</h1>
      <FormularInregistrare tipInitial="agentie" tipuri={["agentie"]} />
      <p className="muted">
        Ai deja cont? <Link href="/cont/autentificare">Autentifică-te</Link>
      </p>
    </div>
  );
}
