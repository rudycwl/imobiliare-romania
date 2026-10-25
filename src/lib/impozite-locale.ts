// Impozitele locale pe clădiri, oraș cu oraș. Doar din hotărârile oficiale ale consiliilor locale
// (site-ul primăriei) și din Codul fiscal. Fiecare oraș are link la hotărâre și data verificării.
// Un oraș nou se adaugă aici; pagina /impozite-locale/<judet>/<oras> apare automat.

import { COD_FISCAL, type Sursa } from "./continut";

export type Cota = { ce: string; valoare: string };
export type ImpoziteOras = {
  judet: string;
  /** Lipsește la București: o singură hotărâre pentru toate sectoarele. */
  oras?: string;
  nume: string;
  an: number;
  hotarare: string;
  cote: Cota[];
  bonificatie: string;
  note: string[];
  surse: Sursa[];
  verificat: string;
};

export const ORASE_IMPOZITE: ImpoziteOras[] = [
  {
    judet: "iasi",
    oras: "iasi",
    nume: "Iași",
    an: 2026,
    hotarare: "HCL nr. 507 din 29.12.2025, modificată prin HCL nr. 2/2026 și HCL nr. 111/2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale și anexe) ale persoanelor fizice", valoare: "0,08%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,5%" },
      { ce: "Clădiri construite fără autorizație (cotă adițională)", valoare: "+50% la impozit" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie",
    note: [
      "Proiectul propunea 0,1% pentru locuințe. Consiliul Local a votat în unanimitate păstrarea cotei minime de 0,08% (procesul-verbal al ședinței din 29.12.2025).",
      "Propunerea de a păstra 0,2% la clădirile nerezidențiale ale persoanelor fizice nu a fost aprobată (12 voturi pentru, 15 abțineri), deci a rămas cota din proiect, 0,5%.",
      "Prin HCL nr. 111/2026 s-au preluat reducerile pentru clădirile vechi (15% la 50–100 de ani, 25% peste 100 de ani) și pentru persoanele cu handicap.",
    ],
    surse: [
      { nume: "Proiectul de hotărâre pentru 2026 (primaria-iasi.ro)", url: "https://www.primaria-iasi.ro/dm_iasi/hotarari.nsf/BE74AE6E7A86BB15C2258D5D0034752A/$FILE/PROIECT%20HCL%20TAXE%202026%20-%20reafisare.pdf?Open=" },
      { nume: "Procesul-verbal al ședinței din 29.12.2025, cu voturile pe amendamente", url: "https://www.primaria-iasi.ro/dm_iasi/Hotarari.nsf/02B1712B6FAEBC3EC2258D920032FE15/$FILE/anunt%20PV%20sed%20cl%20din%2029.12.2025%20%20.pdf?Open" },
      { nume: "HCL nr. 111 din 18.03.2026 (reduceri clădiri vechi)", url: "https://www.primaria-iasi.ro/dm_iasi/hotarari.nsf/C625FC132414DFB0C2258DC000464D07/$FILE/HCL_111_2026.pdf?Open" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "cluj",
    oras: "cluj-napoca",
    nume: "Cluj-Napoca",
    an: 2026,
    hotarare: "HCL nr. 760/2025 privind valorile impozabile, impozitele și taxele locale pentru 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice și firmelor", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1%" },
      { ce: "Clădiri construite cu nerespectarea autorizației (cotă adițională)", valoare: "+20% la impozit" },
      { ce: "Clădiri construite fără autorizație (cotă adițională)", valoare: "+50% la impozit" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (clădiri, teren, mașini)",
    note: ["Zonele fiscale din oraș sunt cele stabilite prin Hotărârea nr. 1064/2018."],
    surse: [
      { nume: "HCL nr. 760/2025 (primariaclujnapoca.ro)", url: "https://primariaclujnapoca.ro/consiliu-local/hotarare-de-consiliu/hotararea-760-din-2025/" },
      { nume: "Documentul oficial semnat (PDF)", url: "https://files.primariaclujnapoca.ro/2025/12/29/760.pdf" },
      { nume: "Termene și modalități de plată 2026", url: "https://primariaclujnapoca.ro/informatii-publice/comunicate/modalitati-de-plata-a-taxelor-si-impozitelor-locale-in-2026/" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "bucuresti",
    nume: "București",
    an: 2026,
    hotarare: "HCGMB nr. 514/2025 privind nivelurile impozitelor și taxelor locale în municipiul București, începând cu 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale și anexe) ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,2%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,5%" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (clădiri, teren, mașini)",
    note: [
      "Hotărârea Consiliului General se aplică în toate cele 6 sectoare. Impozitul se plătește la direcția de impozite și taxe a sectorului.",
      "Consiliile locale ale sectoarelor pot aproba scutiri sau reduceri proprii.",
    ],
    surse: [
      { nume: "HCGMB nr. 514/2025 (doc.pmb.ro)", url: "https://doc.pmb.ro/legis/acteinterne/2025/47690/h514_25.pdf" },
      { nume: "Anexa cu cotele și valorile (doc.pmb.ro)", url: "https://doc.pmb.ro/legis/acteinterne/2025/47690/anexah514_25.pdf" },
    ],
    verificat: "25.10.2026",
  },
];

/** Reguli valabile în toată țara pentru 2026, din Codul fiscal. */
export const REGULI_NATIONALE: { titlu: string; text: string; sursa: Sursa }[] = [
  {
    titlu: "Cum se calculează",
    text: "Impozit = suprafața construită desfășurată × valoarea impozabilă pe m² × coeficientul zonei și rangului localității × cota stabilită de primărie. Dacă nu se cunosc dimensiunile exterioare (de obicei la apartamente), se ia suprafața utilă × 1,4.",
    sursa: { nume: "Codul fiscal, art. 457", url: COD_FISCAL.url },
  },
  {
    titlu: "Valoarea impozabilă în 2026",
    text: "2.677 lei/m² pentru o clădire din beton sau cărămidă cu apă, canalizare, curent și încălzire (1.606 lei/m² fără toate acestea). Cota pentru locuințele persoanelor fizice este între 0,08% și 0,2%, la alegerea consiliului local.",
    sursa: { nume: "Legea 239/2025", url: "https://legislatie.just.ro/Public/DetaliiDocumentAfis/305208" },
  },
  {
    titlu: "Reduceri pentru clădiri vechi",
    text: "Valoarea impozabilă scade cu 15% pentru clădirile de 50–100 de ani și cu 25% pentru cele de peste 100 de ani. Vechimea se socotește la 1 ianuarie.",
    sursa: { nume: "OUG 9/2026 (ANAF)", url: "https://static.anaf.ro/static/10/Anaf/legislatie/OUG_9_2026.pdf" },
  },
  {
    titlu: "Reduceri pentru persoane cu handicap",
    text: "Impozitul pe locuința de domiciliu și pe terenul de sub ea scade cu 50% la handicap grav și cu 25% la handicap accentuat, pe baza actelor depuse la primărie.",
    sursa: { nume: "OUG 9/2026 (ANAF)", url: "https://static.anaf.ro/static/10/Anaf/legislatie/OUG_9_2026.pdf" },
  },
  {
    titlu: "Termene de plată",
    text: "În două rate egale: până la 31 martie și până la 30 septembrie. Dacă plătești tot până la 31 martie, primăria poate da o bonificație de până la 10%.",
    sursa: { nume: "Codul fiscal, art. 462", url: COD_FISCAL.url },
  },
  {
    titlu: "Locuințe foarte scumpe",
    text: "Pentru locuințele cu valoarea impozabilă peste 2.500.000 lei se plătește în plus 0,9% din partea care depășește acest prag.",
    sursa: { nume: "Legea 239/2025 (Codul fiscal, art. 500²)", url: "https://legislatie.just.ro/Public/DetaliiDocumentAfis/305208" },
  },
];

export function caleImpozite(o: Pick<ImpoziteOras, "judet" | "oras">) {
  return o.oras ? `/impozite-locale/${o.judet}/${o.oras}` : `/impozite-locale/${o.judet}`;
}

/** Datele pentru o pagină de oraș; în București aceeași hotărâre acoperă toate sectoarele. */
export function impoziteOras(judet: string, oras: string) {
  return ORASE_IMPOZITE.find((o) => o.judet === judet && (!o.oras || o.oras === oras));
}
