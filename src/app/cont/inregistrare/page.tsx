import Link from "next/link";
import type { Metadata } from "next";
import type { TipUtilizator } from "@/modules/types";
import { FormularInregistrare } from "./Formular";

export const metadata: Metadata = { title: "Creează cont" };

const VALIDE: TipUtilizator[] = ["persoana-fizica", "firma", "agentie"];

export default async function InregistrarePage({ searchParams }: { searchParams: Promise<{ tip?: string }> }) {
  const { tip } = await searchParams;
  const tipInitial = VALIDE.includes(tip as TipUtilizator) ? (tip as TipUtilizator) : "persoana-fizica";
  return (
    <div className="ingust">
      <h1>Creează cont și publică anunțuri</h1>
      <FormularInregistrare tipInitial={tipInitial} />
      <p className="muted">
        Ai deja cont? <Link href="/cont/autentificare">Autentifică-te</Link>
      </p>
    </div>
  );
}
