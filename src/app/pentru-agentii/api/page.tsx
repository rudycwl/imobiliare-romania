import type { Metadata } from "next";
import Link from "next/link";
import { adresaSite } from "@/lib/email";

export const metadata: Metadata = {
  title: "API pentru agenții",
  alternates: { canonical: "/pentru-agentii/api" },
  description: "Cum își trimite o agenție anunțurile pe CheiaMea direct din programul ei (CRM), prin API.",
};

const EXEMPLU_POST = `POST ${adresaSite()}/api/v1/anunturi
Authorization: Bearer cm_cheia_voastra
Content-Type: application/json

{
  "anunturi": [
    {
      "titlu": "Apartament 2 camere, Tătărași, renovat",
      "descriere": "Decomandat, etaj 2/4, centrală proprie.",
      "tip": "apartament",
      "tranzactie": "vanzare",
      "pret": 89000,
      "suprafata": 54,
      "camere": 2,
      "judet": "Iași",
      "oras": "Iași",
      "zona": "Tătărași",
      "poze": ["https://site-ul-vostru.ro/poza1.jpg", "https://site-ul-vostru.ro/poza2.jpg"]
    }
  ]
}`;

const EXEMPLU_RASPUNS = `{
  "publicate": [{ "pozitie": 1, "id": 1234, "link": "${adresaSite()}/anunt/1234" }],
  "cuPoze": 1,
  "sarite": []
}`;

const EXEMPLU_CURL = `curl -X POST ${adresaSite()}/api/v1/anunturi \\
  -H "Authorization: Bearer cm_cheia_voastra" \\
  -H "Content-Type: application/json" \\
  -d @anunturi.json`;

export default function ApiAgentii() {
  return (
    <article className="legal">
      <h1>API pentru agenții</h1>
      <p>
        Agențiile care au un program de gestiune a anunțurilor (CRM) sau un site propriu își pot trimite anunțurile pe CheiaMea automat, fără fișiere.
        Pagina e pentru programatorul sau firma care vă face programul. Dacă nu aveți program, folosiți importul din Excel din contul agenției.
      </p>

      <h2>1. Cheia API</h2>
      <p>
        Cheia se generează din contul agenției: <Link href="/cont/import">Contul meu → Import anunțuri → Legătură automată prin API</Link>. Se vede o
        singură dată; dacă se pierde, generați alta (cea veche nu mai merge). Cheia se trimite la fiecare cerere în antetul{" "}
        <code>Authorization: Bearer …</code>. Nu o puneți în pagini publice sau în cod vizibil în browser.
      </p>

      <h2>2. Publicare anunțuri</h2>
      <p>
        <code>POST /api/v1/anunturi</code>, cu JSON. Maximum 100 de anunțuri pe cerere și 60 de cereri pe oră. Anunțurile cu același titlu și preț ca unul
        existent nu se dublează, deci puteți retrimite toată lista fără grijă.
      </p>
      <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{EXEMPLU_POST}</pre>
      <table>
        <thead>
          <tr><th>Câmp</th><th>Obligatoriu</th><th>Ce conține</th></tr>
        </thead>
        <tbody>
          <tr><td>titlu</td><td>da</td><td>minimum 10 caractere</td></tr>
          <tr><td>tip</td><td>da</td><td>apartament, casa, teren, spatiu-comercial, birouri sau depozit</td></tr>
          <tr><td>tranzactie</td><td>da</td><td>vanzare sau inchiriere</td></tr>
          <tr><td>pret</td><td>da</td><td>în euro, număr întreg; la închiriere, pe lună</td></tr>
          <tr><td>suprafata</td><td>da</td><td>în m²</td></tr>
          <tr><td>judet, oras</td><td>da</td><td>numele scrise normal (ex. „Iași”, „Iași”)</td></tr>
          <tr><td>zona</td><td>nu</td><td>cartierul; implicit „Centru”</td></tr>
          <tr><td>camere</td><td>nu</td><td>număr</td></tr>
          <tr><td>descriere</td><td>nu</td><td>text</td></tr>
          <tr><td>poze</td><td>nu</td><td>listă de linkuri https către poze JPG sau WebP, maximum 10, fiecare sub 6 MB</td></tr>
        </tbody>
      </table>
      <p>Răspunsul spune ce s-a publicat (cu numărul anunțului pe CheiaMea) și ce a fost sărit, cu motivul:</p>
      <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{EXEMPLU_RASPUNS}</pre>
      <p>
        Coduri: 201 = s-a publicat cel puțin un anunț; 200 = niciunul (vezi <code>sarite</code>); 400 = JSON greșit; 401 = cheie greșită; 429 = prea
        multe cereri. Dacă se atinge limita de anunțuri a abonamentului, răspunsul conține câmpul <code>oprit</code>.
      </p>
      <p>Exemplu cu curl:</p>
      <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{EXEMPLU_CURL}</pre>

      <h2>3. Lista anunțurilor agenției</h2>
      <p>
        <code>GET /api/v1/anunturi</code> întoarce anunțurile agenției (ultimele 1.000), cu <code>id</code>, titlu, preț, dacă e public acum și linkul.
      </p>

      <h2>4. Retragere anunț</h2>
      <p>
        <code>DELETE /api/v1/anunturi/&#123;id&#125;</code> retrage anunțul de pe site, de exemplu când proprietatea s-a vândut sau s-a închiriat.
      </p>

      <h2>Reguli</h2>
      <ul>
        <li>Trimiteți doar anunțuri reale, ale agenției, cu poze care vă aparțin.</li>
        <li>Anunțurile trec prin aceeași verificare automată ca cele puse de mână.</li>
        <li>Anunțurile expiră după 60 de zile, ca toate anunțurile de pe site; le puteți reînnoi din cont.</li>
      </ul>
      <p>
        Întrebări tehnice: <a href="mailto:agentii@cheiamea.ro">agentii@cheiamea.ro</a>.
      </p>
    </article>
  );
}
