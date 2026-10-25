import Link from "next/link";
import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { FIRMA } from "@/lib/firma";
import { ANUNTURI_GRATUITE, ZILE_VALABILITATE } from "@/lib/tarife";

export const metadata: Metadata = { title: "Termeni și condiții", alternates: { canonical: "/termeni" } };

export default function TermeniPage() {
  return (
    <Legal titlu="Termeni și condiții">
      <h2>1. Cine suntem</h2>
      <p>
        Site-ul {FIRMA.site} („CheiaMea”) este operat de {FIRMA.nume}, CUI {FIRMA.cui}, nr. Reg. Com. {FIRMA.regCom}, cu sediul în {FIRMA.sediu}.
        Ne poți scrie la <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>
        {FIRMA.telefon && <> sau ne poți suna la {FIRMA.telefon}</>}. {FIRMA.nume} este vânzătorul serviciilor plătite de pe site și emite factura
        pentru ele.
      </p>

      <h2>2. Ce oferim</h2>
      <p>
        CheiaMea este o platformă de anunțuri imobiliare. Publicăm anunțurile utilizatorilor și oferim servicii plătite de promovare a anunțurilor și
        abonamente pentru agenții imobiliare. Rolul nostru este de prestator de servicii de publicitate online (platformă de anunțuri). Nu suntem agenție imobiliară, nu intermediem tranzacții și nu primim comision din vânzări sau închirieri.
        Contractul de vânzare sau închiriere se încheie direct între utilizatori.
      </p>

      <h2>3. Contul</h2>
      <p>
        Pentru a publica anunțuri îți creezi un cont cu date reale. Ești responsabil pentru păstrarea parolei și pentru tot ce se publică din contul tău.
        Conturile de tip „agenție” sunt doar pentru firmele care desfășoară activități de intermediere imobiliară.
      </p>

      <h2>4. Anunțurile</h2>
      <ul>
        <li>Persoanele fizice și firmele care nu sunt agenții publică gratuit până la {ANUNTURI_GRATUITE} anunțuri active. Fiecare anunț e valabil {ZILE_VALABILITATE} de zile și poate fi prelungit gratuit.</li>
        <li>Agențiile publică în limita abonamentului ales. Prețurile abonamentelor se afișează agențiilor înregistrate, în contul lor.</li>
        <li>Anunțul trebuie să descrie un imobil real, disponibil, pe care ai dreptul să-l oferi (ca proprietar sau cu acordul proprietarului), cu preț și date corecte.</li>
        <li>Nu sunt permise anunțurile false, duplicate, înșelătoare, ilegale sau care încalcă drepturile altora (de exemplu fotografii sau texte copiate fără drept).</li>
        <li>Putem modifica, suspenda sau șterge orice anunț care nu respectă acești termeni și putem închide contul în caz de abateri repetate.</li>
      </ul>

      <h2>5. Servicii plătite</h2>
      <p>
        Promovările (reactualizare, Evidențiat, Top în oraș, prima pagină a județului, pachetul „Vânzare rapidă”) și abonamentele pentru agenții se plătesc
        online, cu cardul, prin procesatorul de plăți NETOPIA Payments. Prețurile sunt în lei și sunt finale: Hugetech SRL nu este plătitoare de TVA, deci nu se adaugă TVA. Serviciul se activează
        automat imediat după confirmarea plății, iar factura se trimite pe email.
      </p>
      <p>
        Abonamentele de agenție se plătesc pentru 30 de zile sau pentru 12 luni, înainte. Nu se reînnoiesc automat. Creditele de promovare incluse se
        reîncarcă la fiecare 30 de zile cât abonamentul e activ și nu se reportează.
      </p>
      <p>
        Ofertele de lansare pentru agenții și condițiile lor se afișează agențiilor înregistrate, în contul lor.
      </p>
      <p>Anularea și rambursarea sunt descrise în <Link href="/anulare-rambursare">Politica de anulare și rambursare</Link>.</p>

      <h2>6. Răspundere</h2>
      <p>
        Conținutul anunțurilor aparține celor care le publică. Nu garantăm exactitatea anunțurilor și nici rezultatul unei tranzacții. Îți recomandăm să
        verifici imobilul și actele înainte de orice plată și să nu trimiți avansuri unor persoane pe care nu le-ai cunoscut. Ne poți semnala un anunț
        suspect la {FIRMA.email}.
      </p>

      <h2>7. Date personale</h2>
      <p>Prelucrăm datele personale conform <Link href="/confidentialitate">Politicii de confidențialitate</Link>.</p>

      <h2>8. Modificări și litigii</h2>
      <p>
        Putem actualiza acești termeni; versiunea în vigoare e cea publicată pe această pagină. Legea aplicabilă este legea română. Încercăm să rezolvăm
        orice nemulțumire pe cale amiabilă; consumatorii se pot adresa și Autorității Naționale pentru Protecția Consumatorilor (ANPC), inclusiv prin
        procedura de soluționare alternativă a litigiilor (<a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">SAL</a>), sau instanțelor competente.
      </p>
    </Legal>
  );
}
