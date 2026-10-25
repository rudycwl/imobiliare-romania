import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { FIRMA } from "@/lib/firma";

export const metadata: Metadata = { title: "Politica de confidențialitate", alternates: { canonical: "/confidentialitate" } };

export default function ConfidentialitatePage() {
  return (
    <Legal titlu="Politica de confidențialitate" actualizat="25 octombrie 2026">
      <p>
        Operatorul datelor tale este {FIRMA.nume}, CUI {FIRMA.cui}, cu sediul în {FIRMA.sediu}, e-mail <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>.
        Prelucrăm datele conform Regulamentului (UE) 2016/679 (GDPR).
      </p>

      <h2>Ce date prelucrăm și de ce</h2>
      <div className="tabel-wrap">
        <table className="tabel-preturi">
          <thead>
            <tr><th>Date</th><th>Scop</th><th>Temei legal</th></tr>
          </thead>
          <tbody>
            <tr><td>Nume sau denumire, e-mail, telefon, județ și oraș, parolă (stocată criptat), CUI pentru firme</td><td>Crearea și administrarea contului</td><td>Executarea contractului (art. 6 alin. 1 lit. b)</td></tr>
            <tr><td>Anunțurile tale, inclusiv telefonul și numele afișate în anunț</td><td>Publicarea anunțurilor, ca să te poată contacta cei interesați</td><td>Executarea contractului</td></tr>
            <tr><td>Date de facturare (nume, adresă, CUI, nr. Reg. Com.), istoricul comenzilor</td><td>Plăți și facturare</td><td>Obligație legală (art. 6 alin. 1 lit. c), legislația fiscală</td></tr>
            <tr><td>Sursa vizitei (ex. Google, Facebook, link de recomandare), pagina vizitată</td><td>Statistici despre canalele prin care ne găsesc oamenii, programul de recomandări</td><td>Interes legitim (art. 6 alin. 1 lit. f)</td></tr>
            <tr><td>Mesaje trimise către noi</td><td>Răspuns la întrebări</td><td>Interes legitim (art. 6 alin. 1 lit. f)</td></tr>
            <tr><td>Reclamații, cereri de retragere și raportări de anunțuri</td><td>Soluționarea lor, cum cer legile protecției consumatorului și Regulamentul (UE) 2022/2065 (DSA)</td><td>Obligație legală (art. 6 alin. 1 lit. c)</td></tr>
            <tr><td>Adresa IP, sub formă codificată, când raportezi un anunț</td><td>Ca o singură persoană să nu poată scoate un anunț de pe site cu raportări repetate</td><td>Interes legitim (art. 6 alin. 1 lit. f)</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Datele cardului nu ajung la noi: plata se face direct pe pagina securizată NETOPIA Payments, care ne comunică doar rezultatul plății.
      </p>

      <h2>Cui transmitem datele</h2>
      <p>Lucrăm cu acești furnizori, fiecare doar pentru ce scrie în dreptul lui:</p>
      <div className="tabel-wrap">
        <table className="tabel-preturi">
          <thead>
            <tr><th>Furnizor</th><th>Ce face</th><th>Unde sunt datele</th></tr>
          </thead>
          <tbody>
            <tr><td>Oracle Cloud</td><td>Serverul pe care rulează site-ul și pe care stau pozele anunțurilor</td><td>UE (Frankfurt, Germania)</td></tr>
            <tr><td>Neon</td><td>Baza de date (conturi, anunțuri, comenzi)</td><td>UE</td></tr>
            <tr><td>Cloudflare R2</td><td>Copia de siguranță a pozelor și a bazei de date</td><td>Cloudflare (companie din SUA), cu clauze contractuale standard / EU-US Data Privacy Framework</td></tr>
            <tr><td>NETOPIA Payments</td><td>Plățile cu cardul</td><td>România</td></tr>
            <tr><td>Oblio și ANAF (RO e-Factura)</td><td>Emiterea și transmiterea facturilor</td><td>România</td></tr>
            <tr><td>Brevo</td><td>E-mailurile trimise de site (confirmare cont, parolă uitată, alerte)</td><td>UE</td></tr>
            <tr><td>ImprovMX și Google (Gmail)</td><td>Primirea și trimiterea mesajelor la contact@ și agentii@cheiamea.ro</td><td>SUA, cu clauze contractuale standard / EU-US Data Privacy Framework</td></tr>
            <tr><td>OpenStreetMap</td><td>Hărțile: browserul tău descarcă imaginile hărții direct de la ei; căutăm locul anunțului după cartier</td><td>Regatul Unit și UE (Regatul Unit are decizie de adecvare a Comisiei Europene)</td></tr>
          </tbody>
        </table>
      </div>
      <p>Datele ajung la autorități doar când legea o cere.</p>
      <p>Nu vindem datele tale și nu le folosim pentru reclame țintite.</p>

      <h2>Cât timp le păstrăm</h2>
      <ul>
        <li>datele contului: cât timp contul e activ, apoi le ștergem în 30 de zile de la închiderea lui;</li>
        <li>facturile și datele de facturare: 10 ani, cum cere legislația contabilă;</li>
        <li>statisticile de vizite: 24 de luni, fără nume, e-mail sau adresă IP;</li>
        <li>anunțurile retrase sau expirate: cât timp contul e activ, ca să le poți reactiva; se șterg odată cu contul;</li>
        <li>mesajele, reclamațiile și raportările: 3 ani de la rezolvare (termenul general de prescripție);</li>
        <li>copiile de siguranță ale bazei de date: 14 zile, apoi se suprascriu.</li>
      </ul>

      <h2 id="cookie-uri">Cookie-uri</h2>
      <p>Folosim doar cookie-uri proprii. Nu folosim cookie-uri de publicitate sau de la terți. Fontul site-ului e servit de pe serverul nostru, nu de la Google.</p>
      <ul>
        <li>
          <code>sesiune</code> (necesar, 30 de zile): te ține autentificat în cont.
        </li>
        <li>
          <code>cm_cookie</code> (necesar, 6 luni): ține minte alegerea ta din bannerul de cookie-uri.
        </li>
        <li>
          <code>cm_sursa</code> și <code>cm_ref</code> (doar cu acordul tău, 30 de zile): de unde ai venit pe site și linkul de recomandare, pentru statistici și
          programul de recomandări. Le punem numai după ce apeși „Accept” și le ștergem dacă alegi „Doar necesare”.
        </li>
      </ul>
      <p>Îți poți schimba oricând alegerea din linkul „Setări cookie-uri” din subsolul paginii. Fără acord numărăm doar vizita, fără niciun cookie și fără date personale.</p>

      <h2>Drepturile tale</h2>
      <p>
        Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, precum și dreptul de a nu face obiectul unei decizii
        automate. Scrie-ne la <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>; răspundem în cel mult o lună. Poți depune plângere la Autoritatea Națională
        de Supraveghere a Prelucrării Datelor cu Caracter Personal (<a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">dataprotection.ro</a>).
      </p>
      <p>
        Nu am desemnat un responsabil cu protecția datelor (DPO), pentru că legea nu o cere în cazul nostru. Pentru orice întrebare despre datele tale
        scrie-ne la adresa de mai sus. Datele cerute la înscriere sunt necesare pentru cont; fără ele nu putem publica anunțuri în numele tău.
      </p>
    </Legal>
  );
}
