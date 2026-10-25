import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { poatePublica } from "@/lib/anunturi";
import { ANUNTURI_GRATUITE } from "@/lib/tarife";
import { retrimiteConfirmare } from "../actiuni";
import { FormularAnunt } from "./Formular";

export const metadata: Metadata = { title: "Adaugă anunț" };

export default async function AnuntNouPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/inregistrare");
  if (!u.emailConfirmat) {
    return (
      <div className="ingust">
        <h1>Adaugă anunț</h1>
        <p className="eroare">Mai ai un pas: confirmă adresa de email{u.email ? ` ${u.email}` : ""}.</p>
        <p>
          Ți-am trimis un email cu linkul de confirmare la înscriere (uită-te și în Spam). După ce apeși linkul, revino aici și publici anunțul.
          Așa ne asigurăm că anunțurile de pe CheiaMea sunt puse de oameni reali.
        </p>
        {u.email && (
          <form action={retrimiteConfirmare}>
            <button type="submit">Trimite din nou emailul de confirmare</button>
          </form>
        )}
      </div>
    );
  }
  if (!(await poatePublica(u))) {
    return (
      <div className="ingust">
        <h1>Adaugă anunț</h1>
        <p className="eroare">
          Ai deja {ANUNTURI_GRATUITE} anunțuri active, cât permite publicarea gratuită.
        </p>
        <p>
          Retrage din <Link href="/cont#anunturile-mele">contul tău</Link> un anunț vândut sau închiriat, apoi revino aici.
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
