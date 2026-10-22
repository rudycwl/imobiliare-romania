import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { CadruCont } from "../CadruCont";
import { FormularDate, FormularParola, FormularStergere } from "./Formulare";

export const metadata: Metadata = { title: "Setări cont", robots: { index: false } };

export default async function SetariPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  return (
    <CadruCont u={u}>
      <div className="setari-cont">
      <h1>Setări cont</h1>

      <h2>Datele tale</h2>
      <p className="muted small">
        Email: <strong>{u.email}</strong>. Dacă vrei să schimbi emailul, scrie-ne de pe <Link href="/contact">pagina de contact</Link>.
      </p>
      <FormularDate d={{ tip: u.tip, nume: u.nume, contact: u.contact, telefon: u.telefon, judet: u.judet, oras: u.oras }} />

      <h2>Parola</h2>
      <FormularParola />

      <section className="zona-periculoasa">
        <h2>Ștergerea contului</h2>
        <p>
          Toate anunțurile și pozele tale se șterg de pe site și nu mai pot fi recuperate.
          {u.tip === "agentie" && " Abonamentul rămas nu se rambursează."} Plățile și facturile se păstrează, fără datele tale de contact, pentru că legea ne obligă.
        </p>
        <FormularStergere />
      </section>
      </div>
    </CadruCont>
  );
}
