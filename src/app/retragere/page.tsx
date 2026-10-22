import Link from "next/link";
import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { FIRMA } from "@/lib/firma";
import { FormularRetragere } from "./Formular";

export const metadata: Metadata = { title: "Retragere din contract", alternates: { canonical: "/retragere" } };

export default function RetragerePage() {
  return (
    <Legal titlu="Retragere din contract">
      <p>
        Dacă ești consumator, te poți retrage din contractul încheiat online cu {FIRMA.nume} completând formularul de mai jos, conform art. 11¹ din OUG nr.
        34/2014. Nu trebuie să ne spui motivul. Poți trimite cererea și pe email, la <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>.
      </p>
      <p className="small muted">
        Atenție: promovările se consideră prestate la activare, iar dreptul de retragere se pierde după prestarea integrală a serviciului, cu acordul tău
        exprimat la plată. Detalii în <Link href="/anulare-rambursare">Politica de anulare și rambursare</Link>.
      </p>
      <FormularRetragere emailFirma={FIRMA.email} />
    </Legal>
  );
}
