import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { poatePublica } from "@/lib/anunturi";
import { ANUNTURI_GRATUITE } from "@/lib/tarife";
import { FormularAnunt } from "./Formular";

export const metadata: Metadata = { title: "Adaugă anunț" };

export default async function AnuntNouPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/inregistrare");
  if (!(await poatePublica(u))) {
    return (
      <div className="ingust">
        <h1>Adaugă anunț</h1>
        <p className="eroare">
          Ai deja {ANUNTURI_GRATUITE} anunțuri active, cât permite publicarea gratuită.
        </p>
        <p>
          Retrage din <Link href="/cont#anunturile-mele">contul tău</Link> un anunț vândut sau închiriat, apoi revino aici.
          Dacă ești agenție imobiliară, vezi <Link href="/pentru-agentii#abonamente">abonamentele pentru agenții</Link>.
        </p>
      </div>
    );
  }
  return (
    <div className="ingust">
      <h1>Adaugă anunț</h1>
      <FormularAnunt judet={u.judet} oras={u.oras} poateImporta={u.tip !== "agentie"} />
    </div>
  );
}
