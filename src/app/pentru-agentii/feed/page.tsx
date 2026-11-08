import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conectează-ți CRM-ul: feed XML de anunțuri",
  alternates: { canonical: "/pentru-agentii/feed" },
  description:
    "Agenția își pune toate anunțurile pe CheiaMea automat, din programul imobiliar (CRM), cu același feed XML pe care îl trimite la alte portaluri. Gratuit pentru Agențiile Fondatoare.",
};

const EXEMPLU = `<?xml version="1.0" encoding="UTF-8"?>
<anunturi>
  <anunt>
    <id>AP-1024</id>
    <titlu>Apartament 2 camere, Tătărași, renovat</titlu>
    <descriere>Decomandat, etaj 2/4, centrală proprie.</descriere>
    <tip>apartament</tip>
    <tranzactie>vanzare</tranzactie>
    <pret moneda="EUR">89000</pret>
    <suprafata>54</suprafata>
    <camere>2</camere>
    <judet>Iași</judet>
    <oras>Iași</oras>
    <zona>Tătărași</zona>
    <poze>
      <poza>https://site-ul-agentiei.ro/poze/ap-1024-1.jpg</poza>
      <poza>https://site-ul-agentiei.ro/poze/ap-1024-2.jpg</poza>
    </poze>
  </anunt>
</anunturi>`;

export default function FeedAgentiiPage() {
  return (
    <div className="ingust">
      <h1>Conectează-ți CRM-ul în 2 minute</h1>
      <p>
        Programul agenției (CRM) trimite deja anunțurile la alte portaluri printr-un link de export XML (feed). Același link îl poți pune pe CheiaMea, iar
        anunțurile se publică singure: nu le mai scrie nimeni de mână.
      </p>
      <ul>
        <li>anunțurile noi din program apar pe CheiaMea în cel mult 3 ore, cu poze;</li>
        <li>prețurile și textele modificate în program se actualizează automat, iar scăderile de preț le trimitem pe email cumpărătorilor interesați;</li>
        <li>proprietățile vândute sau retrase din program dispar și de pe CheiaMea;</li>
        <li>Agențiile Fondatoare au 6 luni gratuit, apoi 50% reducere pe viață.</li>
      </ul>

      <h2>Pașii</h2>
      <ol>
        <li>
          <Link href="/pentru-agentii/inregistrare">Creează contul agenției</Link> (sau intră în cont) și confirmă adresa de email.
        </li>
        <li>
          În programul agenției caută secțiunea de export pentru portaluri (de obicei „Export”, „Portaluri”, „Publicare” sau „Feed XML”) și copiază linkul
          feed-ului. Dacă nu-l găsești, scrie furnizorului programului că vrei „un feed XML pentru portalul CheiaMea” sau scrie-ne la{" "}
          <a href="mailto:agentii@cheiamea.ro">agentii@cheiamea.ro</a> și te ajutăm.
        </li>
        <li>
          În <Link href="/cont/import">Contul meu → Import anunțuri</Link> lipește linkul, bifează acordul de mai jos și apasă „Conectează feed-ul”. Vezi pe loc
          câte anunțuri s-au publicat și care au fost sărite (și de ce).
        </li>
      </ol>

      <h2>Ce format acceptăm</h2>
      <p>
        Citim feed-urile XML exportate de programele imobiliare, cu câmpurile în română sau în engleză (de exemplu <code>pret</code> sau{" "}
        <code>price</code>, <code>oras</code> sau <code>city</code>, <code>zona</code>, <code>cartier</code> sau <code>neighborhood</code>). Prețul poate fi
        în euro sau în lei; cel în lei îl transformăm în euro la cursul BNR al zilei. Fiecare anunț trebuie să aibă un cod unic (<code>id</code>), titlu,
        preț, suprafață, tipul proprietății, tranzacția și localitatea. Dacă programul permite alegerea câmpurilor, formatul cel mai simplu e acesta:
      </p>
      <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{EXEMPLU}</pre>
      <p className="small muted">
        Valori pentru <code>tip</code>: apartament, garsonieră, casă, vilă, teren, spațiu comercial, birouri, depozit. Pentru <code>tranzactie</code>: vânzare
        sau închiriere (merg și sale / rent). Pozele: linkuri https, JPG sau WebP, maximum 10 pe anunț. Feed-ul poate avea până la 3.000 de anunțuri.
      </p>
      <p className="small muted">
        Programul are API în loc de feed? Vezi <Link href="/pentru-agentii/api">API-ul pentru agenții</Link>. Ai doar un tabel Excel? Folosește{" "}
        <Link href="/cont/import">importul din fișier</Link>.
      </p>

      <h2>Siguranța portofoliului</h2>
      <ul>
        <li>Dacă feed-ul vine brusc cu mult mai puține anunțuri decât înainte (un export întrerupt), nu retragem nimic și îți arătăm un avertisment.</li>
        <li>Dacă linkul nu răspunde de 5 ori la rând, oprim feed-ul și îți scriem pe email. Anunțurile publicate rămân pe site.</li>
        <li>Poți opri sau șterge feed-ul oricând din cont; anunțurile deja publicate rămân și le poți gestiona de mână.</li>
      </ul>

      <h2 id="acord">Condițiile feed-ului</h2>
      <p>Bifând acordul la conectarea feed-ului, agenția confirmă și acceptă următoarele, în completarea <Link href="/termeni">Termenilor și condițiilor</Link>:</p>
      <ol className="small">
        <li>
          <b>Drepturi asupra conținutului.</b> Agenția deține drepturile asupra textelor și pozelor din feed sau are acordul autorilor lor, și are mandatul
          proprietarilor pentru a promova proprietățile. Agenția acordă CheiaMea (HUGETECH S.R.L.) un drept neexclusiv, gratuit, de a afișa, stoca și
          redimensiona acest conținut pe cheiamea.ro și în materialele de promovare ale anunțurilor, cât timp anunțul e publicat.
        </li>
        <li>
          <b>Date personale.</b> Datele de contact afișate sunt cele ale agenției și ale agenților ei. Agenția nu include în feed date personale ale
          proprietarilor sau ale altor persoane fără un temei legal (GDPR) și răspunde pentru datele pe care le trimite. Pentru datele primite prin feed,
          CheiaMea acționează conform <Link href="/confidentialitate">Politicii de confidențialitate</Link>.
        </li>
        <li>
          <b>Anunțuri reale și actuale.</b> Feed-ul conține doar proprietăți reale, disponibile, cu prețul corect. Proprietățile vândute sau închiriate se
          scot din feed (sau din program), iar CheiaMea le retrage la următoarea citire.
        </li>
        <li>
          <b>Reguli și moderare.</b> Anunțurile din feed respectă aceleași reguli ca orice anunț de pe CheiaMea. CheiaMea poate opri un anunț sau feed-ul
          întreg dacă încalcă regulile, dacă primește reclamații întemeiate sau dacă linkul nu mai funcționează.
        </li>
        <li>
          <b>Limita abonamentului.</b> Se publică atâtea anunțuri câte permite abonamentul agenției; restul apar în raport ca sărite.
        </li>
        <li>
          <b>Încetare.</b> Agenția poate opri sau șterge feed-ul oricând din cont. La ștergerea contului, anunțurile și pozele venite prin feed se șterg.
        </li>
      </ol>
    </div>
  );
}
