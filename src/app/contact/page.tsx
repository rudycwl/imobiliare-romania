import Link from "next/link";
import type { Metadata } from "next";
import { FIRMA } from "@/lib/firma";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <article className="legal">
      <h1>Contact</h1>
      <p>
        Pentru întrebări, anunțuri suspecte, facturi sau rambursări scrie-ne la <a href={`mailto:${FIRMA.email}`}><strong>{FIRMA.email}</strong></a>.
        Răspundem în zilele lucrătoare, de obicei în aceeași zi.
        {FIRMA.telefon && <> Telefon: <a href={`tel:${FIRMA.telefon.replace(/\s/g, "")}`}><strong>{FIRMA.telefon}</strong></a>.</>}
      </p>
      <p>
        Agențiile imobiliare au o zonă separată: <Link href="/pentru-agentii">Pentru agenții</Link>.
      </p>
      <h2>Date de identificare</h2>
      <ul>
        <li>{FIRMA.nume}</li>
        <li>CUI {FIRMA.cui}</li>
        <li>Nr. Reg. Com. {FIRMA.regCom}</li>
        <li>Sediu: {FIRMA.sediu}</li>
        <li>Email: {FIRMA.email}</li>
        {FIRMA.telefon && <li>Telefon: {FIRMA.telefon}</li>}
      </ul>
    </article>
  );
}
