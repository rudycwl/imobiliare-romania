import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { utilizatorCurent } from "@/lib/auth";
import { FormularInregistrare } from "@/app/cont/inregistrare/Formular";
import { formatData, getInvitatieValabila } from "@/lib/fondatori";

export const metadata: Metadata = { title: "Cont de agenție" };

export default async function InregistrareAgentiePage({ searchParams }: { searchParams: Promise<{ cod?: string }> }) {
  if (await utilizatorCurent()) redirect("/cont");
  const { cod } = await searchParams;
  const invitatie = await getInvitatieValabila(cod);
  return (
    <div className="ingust">
      <Breadcrumbs items={[{ label: "Pentru agenții", href: "/pentru-agentii" }, { label: "Cont de agenție" }]} />
      <h1>Creează contul agenției</h1>
      {invitatie ? (
        <p className="succes">🎟️ Invitația ta e valabilă până la {formatData(invitatie.expiraLa)}. Facilitățile agenției le vezi în cont, după înscriere.</p>
      ) : null}
      <FormularInregistrare tipInitial="agentie" tipuri={["agentie"]} cod={invitatie?.cod} />
      <p className="muted">
        Ai deja cont? <Link href="/cont/autentificare">Autentifică-te</Link>
      </p>
    </div>
  );
}
