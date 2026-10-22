import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { TipUtilizator } from "@/modules/types";
import { utilizatorCurent } from "@/lib/auth";
import { FormularInregistrare } from "./Formular";

export const metadata: Metadata = { title: "Creează cont" };

// Agențiile au pagina lor de înscriere, separată: /pentru-agentii/inregistrare.
const VALIDE: TipUtilizator[] = ["persoana-fizica", "firma"];

export default async function InregistrarePage({ searchParams }: { searchParams: Promise<{ tip?: string }> }) {
  if (await utilizatorCurent()) redirect("/cont");
  const { tip } = await searchParams;
  if (tip === "agentie") redirect("/pentru-agentii/inregistrare");
  const tipInitial = VALIDE.includes(tip as TipUtilizator) ? (tip as TipUtilizator) : "persoana-fizica";
  return (
    <div className="ingust">
      <h1>Creează cont și publică anunțuri</h1>
      <FormularInregistrare tipInitial={tipInitial} tipuri={VALIDE} />
      <p className="muted">
        Ești agenție imobiliară? <Link href="/pentru-agentii">Vezi zona pentru agenții</Link>
      </p>
      <p className="muted">
        Ai deja cont? <Link href="/cont/autentificare">Autentifică-te</Link>
      </p>
    </div>
  );
}
