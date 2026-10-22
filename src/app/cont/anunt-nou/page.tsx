import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { FormularAnunt } from "./Formular";

export const metadata: Metadata = { title: "Adaugă anunț" };

export default async function AnuntNouPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/inregistrare");
  return (
    <div className="ingust">
      <h1>Adaugă anunț</h1>
      <FormularAnunt judet={u.judet} oras={u.oras} poateImporta={u.tip !== "agentie"} />
    </div>
  );
}
