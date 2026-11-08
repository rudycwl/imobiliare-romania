import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { MAX_RANDURI } from "@/lib/import-masa";
import { CadruCont } from "../CadruCont";
import { FormularImport } from "./Formular";
import { CheieApi } from "./CheieApi";
import { areCheieApi } from "@/lib/api-agentii";
import { db } from "@/lib/db";
import type { RaportFeed } from "@/lib/feeduri";
import { FormularFeed, RaportFeedVizibil } from "./Feed";
import { actiuneFeed } from "./feed-actiuni";

export const metadata: Metadata = { title: "Import anunțuri", robots: { index: false } };

export default async function ImportPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare?inapoi=/cont/import");
  if (u.tip !== "agentie") redirect("/pentru-agentii");
  const feeduri = await db.feedAgentie.findMany({ where: { utilizatorId: u.id }, orderBy: { creatLa: "asc" } });
  const data = (d: Date | null) => (d ? d.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "short", timeStyle: "short" }) : "încă nu");
  return (
    <CadruCont u={u}>
      <h1>Importă toate anunțurile agenției</h1>

      <h2>Feed automat din programul agenției</h2>
      <p>
        Cea mai simplă variantă: dacă programul agenției (CRM) trimite deja anunțurile la alte portaluri, are și un link de export XML.
        Pune linkul aici și ne ocupăm noi de rest: la fiecare 3 ore anunțurile noi apar pe CheiaMea, prețurile și textele se actualizează,
        iar proprietățile vândute sau retrase din program dispar și de pe site. <Link href="/pentru-agentii/feed">Cum găsești linkul feed-ului</Link>.
      </p>
      {feeduri.map((f) => (
        <div key={f.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14, margin: "12px 0", background: "var(--card)" }}>
          <p style={{ margin: 0, wordBreak: "break-all" }}>
            <b>{f.url}</b>
          </p>
          <p className="small muted" style={{ margin: "4px 0" }}>
            {f.activ ? "Activ" : "Oprit"} · ultima citire: {data(f.ultimaRulare)}
            {f.ultimaStare === "eroare" ? ` · eroare (${f.eroriLaRand} la rând)` : ""}
          </p>
          {f.raport ? <RaportFeedVizibil r={f.raport as unknown as RaportFeed} /> : null}
          <form action={actiuneFeed} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="hidden" name="id" value={f.id} />
            <button type="submit" name="actiune" value={f.activ ? "acum" : "porneste"}>
              {f.activ ? "Citește acum" : "Pornește din nou"}
            </button>
            {f.activ && (
              <button type="submit" name="actiune" value="opreste" className="secundar">
                Oprește
              </button>
            )}
            <button type="submit" name="actiune" value="sterge" className="secundar">
              Șterge feed-ul
            </button>
          </form>
        </div>
      ))}
      <FormularFeed />

      <h2>Import dintr-un fișier</h2>
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

      <h2>Legătură automată prin API</h2>
      <p>
        Dacă agenția are un program (CRM) sau un site propriu, acesta poate trimite singur anunțurile pe CheiaMea, fără fișier: anunțurile noi apar
        imediat, iar cele vândute se retrag automat. Generează cheia de mai jos și dă-o programatorului agenției, împreună cu{" "}
        <a href="/pentru-agentii/api">instrucțiunile tehnice</a>.
      </p>
      <CheieApi areCheie={await areCheieApi(u.id)} />
    </CadruCont>
  );
}
