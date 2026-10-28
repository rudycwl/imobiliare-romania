import Link from "next/link";
import type { Metadata } from "next";
import { cerePanou } from "@/lib/panou";
import { FormularProiect } from "../Formular";

export const metadata: Metadata = { title: "Proiect nou", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProiectNouPage() {
  await cerePanou();
  return (
    <div className="ingust" style={{ maxWidth: 820 }}>
      <p><Link href="/admin/proiecte">← Toate proiectele</Link></p>
      <h1>Proiect nou</h1>
      <FormularProiect
        v={{ slug: "", nume: "", dezvoltator: "", descriere: "", loc: "", zona: "", adresa: "", lat: "", lng: "", website: "", telefon: "", email: "", unitati: "", termenFinalizare: "", activ: true, gratuitPanaLa: "" }}
      />
    </div>
  );
}
