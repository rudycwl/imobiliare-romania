import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { MAX_RANDURI } from "@/lib/import-masa";
import { CadruCont } from "../CadruCont";
import { FormularImport } from "./Formular";

export const metadata: Metadata = { title: "Import anunțuri", robots: { index: false } };

export default async function ImportPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare?inapoi=/cont/import");
  if (u.tip !== "agentie") redirect("/pentru-agentii");
  return (
    <CadruCont u={u}>
      <h1>Importă toate anunțurile agenției</h1>
      <p>
        Mută-ți portofoliul pe CheiaMea dintr-un singur fișier, fără să rescrii anunțurile. Un rând din fișier înseamnă un anunț.
        Poți importa până la {MAX_RANDURI} de anunțuri odată, în limita abonamentului.
      </p>
      <ol>
        <li>
          Descarcă <a href="/model-import-cheiamea.csv" download>modelul de fișier</a> și deschide-l în Excel.
        </li>
        <li>
          Completează câte un rând pentru fiecare anunț. Coloana <em>tip</em>: apartament, casa, teren, spatiu-comercial, birouri sau depozit.
          Coloana <em>tranzactie</em>: vanzare sau inchiriere. Prețul e în euro (pe lună la închiriere).
        </li>
        <li>
          În coloana <em>poze</em> pune linkurile pozelor (încep cu https://), despărțite prin spațiu. Maximum 10 pe anunț, JPG sau WebP.
        </li>
        <li>Salvează ca „CSV UTF-8” și încarcă fișierul aici.</li>
      </ol>
      <p className="muted small">
        Ai deja anunțurile în programul agenției? Majoritatea programelor imobiliare pot exporta în CSV sau Excel; scrie-ne la agentii@cheiamea.ro și te ajutăm cu
        potrivirea coloanelor. Dacă rulezi importul de două ori, anunțurile cu același titlu și preț nu se dublează. Folosește doar poze care îți aparțin.
      </p>
      <FormularImport />
    </CadruCont>
  );
}
