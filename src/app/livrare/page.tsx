import Link from "next/link";
import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { FIRMA } from "@/lib/firma";

export const metadata: Metadata = { title: "Politica de livrare", alternates: { canonical: "/livrare" } };

export default function LivrarePage() {
  return (
    <Legal titlu="Politica de livrare">
      <h2>Ce livrăm</h2>
      <p>
        CheiaMea vinde doar servicii digitale: promovări pentru anunțuri și abonamente pentru agenții imobiliare. Nu livrăm produse fizice, deci nu există
        costuri de transport, curier sau ridicare personală.
      </p>

      <h2>Când și cum se livrează serviciul</h2>
      <ul>
        <li>Serviciul se activează automat în contul tău, imediat după ce NETOPIA Payments confirmă plata, de obicei în câteva secunde.</li>
        <li>Promovarea apare direct pe anunțul ales, iar abonamentul de agenție apare activ în pagina <Link href="/cont">Contul meu</Link>.</li>
        <li>Factura se emite automat și se trimite pe adresa de email a contului.</li>
        <li>Serviciile sunt disponibile oriunde în România, oriunde ai acces la internet.</li>
      </ul>

      <h2>Dacă serviciul nu apare</h2>
      <p>
        Dacă plata a fost confirmată, dar serviciul nu s-a activat în 30 de minute, scrie-ne la <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a> cu numărul
        comenzii. Îl activăm manual sau, dacă nu putem în 48 de ore, îți returnăm banii, conform <Link href="/anulare-rambursare">Politicii de anulare și rambursare</Link>.
      </p>
    </Legal>
  );
}
