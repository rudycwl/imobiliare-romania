import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { FIRMA } from "@/lib/firma";

export const metadata: Metadata = { title: "Politica de confidențialitate", alternates: { canonical: "/confidentialitate" } };

export default function ConfidentialitatePage() {
  return (
    <Legal titlu="Politica de confidențialitate">
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
            <tr><td>Mesaje trimise către noi</td><td>Răspuns la solicitări și reclamații</td><td>Interes legitim / obligație legală</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Datele cardului nu ajung la noi: plata se face direct pe pagina securizată NETOPIA Payments, care ne comunică doar rezultatul plății.
      </p>

      <h2>Cui transmitem datele</h2>
      <ul>
        <li>NETOPIA Payments (procesarea plăților cu cardul);</li>
        <li>furnizorul de facturare electronică și ANAF (sistemul RO e-Factura), pentru facturi;</li>
        <li>furnizorii tehnici care găzduiesc site-ul și baza de date (Netlify, Neon) și e-mailul (Zoho), cu servere în UE sau cu garanții adecvate pentru transferuri;</li>
        <li>autorităților, doar când legea o cere.</li>
      </ul>
      <p>Nu vindem datele tale și nu le folosim pentru reclame țintite.</p>

      <h2>Cât timp le păstrăm</h2>
      <ul>
        <li>datele contului: cât timp contul e activ, apoi le ștergem în 30 de zile de la închiderea lui;</li>
        <li>facturile și datele de facturare: 10 ani, cum cere legislația contabilă;</li>
        <li>statisticile de vizite: 24 de luni, fără date care te identifică direct.</li>
      </ul>

      <h2>Cookie-uri</h2>
      <p>
        Folosim doar cookie-uri proprii, necesare: <code>sesiune</code> (te ține autentificat), <code>cm_sursa</code> și <code>cm_ref</code> (rețin 30 de zile
        sursa vizitei și linkul de recomandare, pentru programul de recomandări). Nu folosim cookie-uri de publicitate sau de la terți.
      </p>

      <h2>Drepturile tale</h2>
      <p>
        Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, precum și dreptul de a nu face obiectul unei decizii
        automate. Scrie-ne la <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>; răspundem în cel mult o lună. Poți depune plângere la Autoritatea Națională
        de Supraveghere a Prelucrării Datelor cu Caracter Personal (<a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">dataprotection.ro</a>).
      </p>
    </Legal>
  );
}
