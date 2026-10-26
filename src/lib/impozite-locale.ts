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
    judet: "brasov",
    oras: "brasov",
    nume: "Brașov",
    an: 2026,
    hotarare: "HCL nr. 1142 din 22.12.2025 privind impozitele și taxele locale pentru anul 2026, republicată după HCL nr. 120 din 06.03.2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale și anexe) ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,5%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2% (+0,1% cotă adițională)" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3% (+0,5% cotă adițională)" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (clădiri, teren, mașini)",
    note: ["La clădirile nerezidențiale ale persoanelor fizice fără raport de evaluare depus la timp, cota este 2%."],
    surse: [
      { nume: "HCL nr. 1142/2025 republicată (Direcția Fiscală Brașov, dfbv.ro)", url: "https://dfbv.ro/wp-content/uploads/2026/03/hcl-1142-republicat_pt-site.pdf" },
      { nume: "Lista hotărârilor privind impozitele (dfbv.ro)", url: "https://dfbv.ro/hcl-privind-impozitele-si-taxele/" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "timis",
    oras: "timisoara",
    nume: "Timișoara",
    an: 2026,
    hotarare: "HCLMT nr. 719/2025 (cotele de impozitare pentru 2026)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale)", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale", valoare: "1,3% (+16% cotă adițională)" },
    ],
    bonificatie: "Neconfirmată încă din documentele oficiale; întreabă la Direcția Fiscală Timișoara",
    note: [
      "Exemplul oficial al primăriei: un apartament cu 55 m² utili în zona C plătește circa 474 lei pe an (55 × 1,4 × 2.677 lei × 2,3 × 0,1%).",
      "Hotărârea completă nu se poate deschide direct de pe site-ul primăriei; cotele sunt luate din fișa de calcul publicată de Primăria Timișoara.",
    ],
    surse: [
      { nume: "Calcul impozite 2026, Primăria Timișoara (PDF)", url: "https://assets.primariatm.ro/bcef49ee-bfc6-4213-9605-7364716de03d/calcul%20impozite%202026-%20pt_site%281%29.pdf" },
      { nume: "HCL nr. 719/2025 (primariatm.ro)", url: "https://www.primariatm.ro/hcl/2025/719" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "dolj",
    oras: "craiova",
    nume: "Craiova",
    an: 2026,
    hotarare: "HCL nr. 496 din 18.12.2025 privind stabilirea și aprobarea impozitelor și taxelor locale pentru anul 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale și anexe) ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "1,3%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2% (+50% cotă adițională)" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3%" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (clădiri, teren, mașini)",
    note: ["Cotele pentru locuințe au rămas la fel ca în 2025."],
    surse: [
      { nume: "HCL nr. 496/2025 (primariacraiova.ro)", url: "https://www.primariacraiova.ro/ro/info/695f66f69d9cc811193031.pdf" },
      { nume: "Hotărâri de stabilire a taxelor și impozitelor (primariacraiova.ro)", url: "https://www.primariacraiova.ro/ro/a/382/hot%C4%83r%C3%A2ri-stabilire-taxe-%C5%9Fi-impozite" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "constanta",
    oras: "constanta",
    nume: "Constanța",
    an: 2026,
    hotarare: "HCL nr. 462 din 23.12.2025 privind stabilirea impozitelor și taxelor la nivelul municipiului Constanța în anul 2026 (anexa nr. 1)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale și anexe) ale persoanelor fizice", valoare: "0,11%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "1,3% (+30,8% cotă adițională)" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3% (+30,8% cotă adițională)" },
    ],
    bonificatie: "10% pentru persoanele fizice (5% pentru firme), la plata întregului an până la 31 martie",
    note: [
      "Bonificația se dă doar dacă plătești până la 31 martie toate obligațiile către bugetul local pe întregul an.",
      "Prin HCL nr. 65/2026 s-au aplicat reducerile pentru clădirile vechi (15% la 50–100 de ani, 25% peste 100 de ani) și pentru persoanele cu handicap. Modificările ulterioare (HCL nr. 135/2026 și 264/2026) nu schimbă impozitul pe clădiri.",
      "Impozitul se plătește la Serviciul Public de Impozite și Taxe Constanța (SPIT).",
    ],
    surse: [
      { nume: "HCL nr. 462/2025 și anexele (spit-ct.ro)", url: "https://www.spit-ct.ro/hotarare/hcl-nr-462_23-12-2025-privind-stabilirea-impozitelor-si-taxelor-la-nivelul-municipiului-constanta-in-anul-2026/" },
      { nume: "Anexa nr. 1: impozitul pe clădiri (PDF)", url: "https://www.spit-ct.ro/wp-content/uploads/documente/hotarari-consiliu-local/2026/01/HCL-nr.-462_23.12.2025-privind-stabilirea-impozitelor-si-taxelor-la-nivelul-municipiului-Constanta-in-anul-2026/Anexa-nr.-1-Impozitul_taxa-pe-cladiri.pdf" },
      { nume: "HCL nr. 65/2026 (reduceri)", url: "https://www.spit-ct.ro/wp-content/uploads/documente/hotarari-consiliu-local/2026/03/H.C.L.-nr.-65_06.03.2026-privind-reducerea-cotelor-aditionale-la-impozitele-si-taxele-locale-si-acordarea-unor-facilitati-fiscale-pentru-anul-2026/H.C.L.-nr.-65_06.03.2026-privind-reducerea-cotelor-aditionale-la-impozitele-si-taxele-locale-si-acordarea-unor-facilitati-fiscale-pentru-anul-2026.pdf" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "bacau",
    oras: "bacau",
    nume: "Bacău",
    an: 2026,
    hotarare: "HCL nr. 553 din 19.12.2025 și HCL nr. 592 din 23.12.2025 (impozitele pentru 2026); cota la locuințe păstrată prin HCL nr. 554 din 19.12.2025",
    cote: [{ ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,1%" }],
    bonificatie: "Neconfirmată încă din documentele oficiale; întreabă la Direcția Venituri Locale Bacău",
    note: [
      "Cota de 0,1% a rămas la fel ca în 2025. Impozitul crește totuși, pentru că valoarea impozabilă pe m² a crescut prin lege.",
      "Exemplul oficial al primăriei: un apartament cu 50 m² utili în zona A plătește 468 lei în 2026 (70 m² × 2.677 lei × 2,5 × 0,1%).",
    ],
    surse: [{ nume: "Calcul taxe locale 2026, Direcția Venituri Locale Bacău", url: "https://taxe.municipiulbacau.ro/calcul-taxe-locale-2026/" }],
    verificat: "25.10.2026",
  },
  {
    judet: "bihor",
    oras: "oradea",
    nume: "Oradea",
    an: 2026,
    hotarare: "HCL nr. 854/2025 privind impozitele, taxele și tarifele locale pentru anul fiscal 2026 (anexa nr. 1)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,111%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,70%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,3%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,15%" },
      { ce: "Clădiri fără contract de canalizare, acolo unde există rețea (majorare)", valoare: "+50% la impozit" },
    ],
    bonificatie: "Nu apare în anexa hotărârii; întreabă la direcția de taxe",
    note: ["La clădirile nerezidențiale ale persoanelor fizice, hotărârea prevede în unele cazuri o cotă mai mare (0,90%)."],
    surse: [{ nume: "HCL nr. 854/2025, anexa 1 (Monitorul Oficial Local Oradea)", url: "https://mol.oradea.ro/storage/49927/HCL-854_25.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "neamt",
    oras: "piatra-neamt",
    nume: "Piatra Neamț",
    an: 2026,
    hotarare: "Tabloul cotelor și taxelor locale pentru anul 2026, publicat de Primăria Piatra Neamț",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,8%" },
      { ce: "Clădiri cu destinație mixtă ale persoanelor fizice (când nu se pot separa)", valoare: "0,3%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3%" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (clădiri, teren, mașini)",
    note: [],
    surse: [{ nume: "Tabloul taxelor locale 2026 (primariapn.ro, PDF)", url: "https://www.primariapn.ro/documents/10179/5907963/tablou_taxe_locale.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "olt",
    oras: "slatina",
    nume: "Slatina",
    an: 2026,
    hotarare: "HCL nr. 559 din 19.12.2025 privind stabilirea impozitelor și taxelor locale pentru anul 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,08%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "1%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3%" },
    ],
    bonificatie: "10% pentru persoanele fizice (2% pentru firme, la clădiri), la plata întregului an până la 31 martie",
    note: ["Cota de 0,08% la locuințe a rămas la fel ca în 2025."],
    surse: [{ nume: "HCL nr. 559/2025 (primariaslatina.ro, PDF)", url: "http://www.primariaslatina.ro/images/dispozitii/h_559_191225.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "calarasi",
    oras: "calarasi",
    nume: "Călărași",
    an: 2026,
    hotarare: "HCL nr. 241 din 22.12.2025 privind stabilirea impozitelor, taxelor și tarifelor locale pentru anul 2026 (anexa 1)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,104%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,832%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,208%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,56%" },
    ],
    bonificatie: "10% pentru persoanele fizice, la plata integrală a impozitului pe clădiri până la 31 martie",
    note: ["Hotărârea a fost modificată pe 16.03.2026 doar pentru reducerile acordate persoanelor cu handicap (OG nr. 9/2026); cotele au rămas aceleași."],
    surse: [
      { nume: "HCL nr. 241/2025 (primariacalarasi.ro, PDF)", url: "https://primariacalarasi.ro/storage/2020/12/HCL-241-2.pdf" },
      { nume: "Modificările din 16.03.2026 (primariacalarasi.ro, PDF)", url: "https://primariacalarasi.ro/storage/2026/03/Modificari-impozite-si-taxe.pdf" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "bistrita-nasaud",
    oras: "bistrita",
    nume: "Bistrița",
    an: 2026,
    hotarare: "HCL nr. 302 din 29.12.2025 privind stabilirea impozitelor și taxelor locale în anul 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) și anexe ale persoanelor fizice", valoare: "0,08%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,8%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,08%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3%" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (nu se acordă dacă impozitul e de cel mult 50 lei)",
    note: [],
    surse: [{ nume: "HCL nr. 302/2025 (primariabistrita.ro, PDF)", url: "https://primariabistrita.ro/wp-content/uploads/2025/12/HCL-302-din-29.12.2025.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "harghita",
    oras: "miercurea-ciuc",
    nume: "Miercurea Ciuc",
    an: 2026,
    hotarare: "HCL nr. 354/2025 privind stabilirea impozitelor și taxelor locale, precum și a taxelor speciale în municipiul Miercurea Ciuc pe anul 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) și anexe ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "1,2%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,2%" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (persoane fizice și firme)",
    note: ["Cotele la locuințe (0,1%) și la clădiri nerezidențiale ale persoanelor fizice (1,2%) au rămas la fel ca în 2025."],
    surse: [{ nume: "HCL nr. 354/2025 (miercureaciuc.ro, PDF)", url: "https://miercureaciuc.ro/files/documents/Hot%20nr%20354%20stab%20impozite%20si%20taxe%202026.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "suceava",
    oras: "suceava",
    nume: "Suceava",
    an: 2026,
    hotarare: "HCL nr. 329 din 23.12.2025 privind stabilirea impozitelor și taxelor locale, precum și a taxelor speciale, pentru anul 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) și anexe ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,6% (0,9% dacă valoarea declarată e mai mică decât cea calculată de primărie)" },
      { ce: "Clădiri rezidențiale ale firmelor (cu cota adițională)", valoare: "0,3%" },
      { ce: "Clădiri nerezidențiale ale firmelor (cu cota adițională)", valoare: "1,95%" },
    ],
    bonificatie: "10% pentru plata integrală a impozitului pe clădiri până la primul termen (persoane fizice și firme)",
    note: ["Cotele au rămas la nivelul din 2025; sumele fixe au fost indexate cu inflația de 5,6%."],
    surse: [{ nume: "HCL nr. 329/2025 (primariasv.ro, PDF)", url: "https://www.primariasv.ro/dm_suceava/2025/hotarari.nsf/696698B41C09FEB9C2258D7100364B94/$FILE/329.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "mures",
    oras: "targu-mures",
    nume: "Târgu Mureș",
    an: 2026,
    hotarare: "HCL nr. 330 din 23.12.2025 privind impozitele și taxele locale pe anul 2026 (anexa 1)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,085%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,65%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,1%" },
    ],
    bonificatie: "10% pentru persoanele fizice, la plata integrală până la 31 martie (și pentru firme, în condițiile din hotărâre)",
    note: ["HCL nr. 36/2026 a modificat anexa doar la impozitul pe mașini; cotele pentru clădiri au rămas aceleași."],
    surse: [
      { nume: "HCL nr. 330/2025 (tirgumures.ro, PDF)", url: "https://www.tirgumures.ro/portal/servicii/2025/hotarari.nsf/all/0A80BC31CE24F9E3C2258D6F002233C4/$FILE/HCL%20330.pdf" },
      { nume: "Anexa 1: cotele (tirgumures.ro, PDF)", url: "https://www.tirgumures.ro/portal/servicii/2025/hotarari.nsf/all/0A80BC31CE24F9E3C2258D6F002233C4/$FILE/Anexa%201.pdf" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "galati",
    oras: "galati",
    nume: "Galați",
    an: 2026,
    hotarare: "HCL nr. 416 din 31.07.2025 privind indexarea impozitelor și taxelor locale începând cu anul 2026, modificată prin HCL nr. 655/2025 și HCL nr. 670 din 29.12.2025",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) și anexe ale persoanelor fizice", valoare: "0,09%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "1,3%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3%" },
    ],
    bonificatie: "10% pentru persoanele fizice (3% pentru firme, la clădiri), la plata întregului an până la 31 martie",
    note: ["Cota pentru clădirile nerezidențiale ale persoanelor fizice a fost mărită de la 0,6% la 1,3% prin HCL nr. 670/2025."],
    surse: [
      { nume: "HCL nr. 416/2025 (primariagalati.ro, PDF)", url: "https://primariagalati.ro/dm_galati/hotarari.nsf/28FC94F90B77E50BC2258CDF00357EF3/$FILE/HCL_416.pdf" },
      { nume: "HCL nr. 670/2025, modificarea (primariagalati.ro, PDF)", url: "https://primariagalati.ro/dm_galati/hotarari.nsf/727F15985566B8BBC2258D7900340AE4/$FILE/HCL_670.pdf" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "salaj",
    oras: "zalau",
    nume: "Zalău",
    an: 2026,
    hotarare: "HCL nr. 415 din 30.12.2025, anexa nr. 1 (tabloul impozitelor și taxelor locale începând cu anul fiscal 2026)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) și anexe ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,3%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1%" },
    ],
    bonificatie: "Neconfirmată încă din documentele oficiale; întreabă la Direcția Impozite și Taxe Locale Zalău",
    note: [],
    surse: [{ nume: "HCL nr. 415/2025, anexa 1 (zalausj.ro, PDF)", url: "https://www.zalausj.ro/portal/zalau/portal.nsf/D6E683C62C51B139C2258DBD003C75CD/$FILE/tablou_impozite.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "tulcea",
    oras: "tulcea",
    nume: "Tulcea",
    an: 2026,
    hotarare: "HCL nr. 370 din 30.12.2025 privind stabilirea impozitelor și taxelor locale pentru anul 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) și anexe ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "1,1%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,1%" },
    ],
    bonificatie: "10% pentru plata integrală a impozitului pe clădiri până la 31 martie (persoane fizice și firme)",
    note: [],
    surse: [{ nume: "HCL nr. 370/2025 (primariatulcea.ro, PDF)", url: "https://www.primariatulcea.ro/wp-content/uploads/2026/01/HCL-nr.-370-din-30.12.2025.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "vrancea",
    oras: "focsani",
    nume: "Focșani",
    an: 2026,
    hotarare: "HCL nr. 474 din 29.12.2025 privind stabilirea impozitelor și taxelor locale aplicabile în anul fiscal 2026",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) și anexe ale persoanelor fizice", valoare: "0,1%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "1,3%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2% (+50% cotă adițională)" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3%" },
    ],
    bonificatie: "10% pentru persoanele fizice (5% pentru firme), la plata întregului an până la 31 martie",
    note: [],
    surse: [{ nume: "HCL nr. 474/2025 (focsani.info, PDF)", url: "https://www.focsani.info/fisiere/userfiles/proiecte%20act%20noirmativ/HOTARARE_ITL_2026.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "satu-mare",
    oras: "satu-mare",
    nume: "Satu Mare",
    an: 2026,
    hotarare: "HCL nr. 98 din 24.04.2025 privind impozitele și taxele locale în anul 2026, cu anexele republicate prin HCL nr. 343 din 22.12.2025",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) și anexe ale persoanelor fizice", valoare: "0,1184%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,7%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3%" },
    ],
    bonificatie: "10% pentru persoanele fizice, la plata întregului an până la 31 martie (și pentru firme, în condițiile din hotărâre)",
    note: ["Hotărârea a mai fost modificată prin HCL nr. 313/2025 și HCL nr. 56/2026; cotele pentru clădiri au rămas aceleași."],
    surse: [
      { nume: "HCL nr. 98/2025 (primariasm.ro)", url: "https://www.primariasm.ro/hotararea-nr-9824042025" },
      { nume: "HCL nr. 343/2025, anexele 1-5 (primariasm.ro, DOC)", url: "https://www.primariasm.ro/storage/hotarari/2025/343/anexe-1-5-la-hcl-343.doc" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "covasna",
    oras: "sfantu-gheorghe",
    nume: "Sfântu Gheorghe",
    an: 2026,
    hotarare: "HCL nr. 557/2025 privind impozitele și taxele locale pentru anul 2026 (anexa nr. 1)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,08%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,9%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,12%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3% (plus cotă adițională)" },
    ],
    bonificatie: "Neconfirmată încă din documentele oficiale (anexa nr. 1 nu o menționează); întreabă la Primăria Sfântu Gheorghe",
    note: [
      "Cota pentru locuințe este cea minimă permisă de Codul fiscal (0,08%).",
      "Prin HCL nr. 75/2026 consiliul local a redus cotele adiționale stabilite inițial; cotele de bază pentru clădiri din anexa nr. 1 nu sunt modificate de anexa acestei hotărâri.",
    ],
    surse: [
      { nume: "Anexa nr. 1 la HCL nr. 557/2025 (sfantugheorgheinfo.ro, PDF)", url: "https://sfantugheorgheinfo.ro/uploads/anexa-nr-1-la-hcl-impozite-si-taxe-2026-1767171901.pdf" },
      { nume: "Anexa la HCL nr. 75/2026, criteriile pentru cotele adiționale (sfantugheorgheinfo.ro, PDF)", url: "https://www.sfantugheorgheinfo.ro/uploads/anexa-la-hcl-75-1773307546.pdf" },
    ],
    verificat: "26.10.2026",
  },
  {
    judet: "dambovita",
    oras: "targoviste",
    nume: "Târgoviște",
    an: 2026,
    hotarare: "HCL nr. 434 din 23.12.2025 privind impozitele și taxele locale începând cu anul 2026 (anexa 1)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,09%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,53%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,2% (+48% cotă adițională)" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (clădiri, teren, mașini)",
    note: [],
    surse: [{ nume: "HCL nr. 434/2025, anexa 1 (pmtgv.ro, PDF)", url: "https://www.pmtgv.ro/MonitorPMT/Hotarari/2025/HCL%20434/Anexa%201.pdf" }],
    verificat: "25.10.2026",
  },
  {
    judet: "prahova",
    oras: "ploiesti",
    nume: "Ploiești",
    an: 2026,
    hotarare: "HCL nr. 744 din 29.12.2025 privind stabilirea impozitelor și taxelor locale pentru anul 2026",
    cote: [
      { ce: "Locuința de domiciliu (clădire rezidențială) a persoanelor fizice", valoare: "0,095%" },
      { ce: "A doua clădire rezidențială, în afara celei de domiciliu", valoare: "0,15%" },
      { ce: "A treia clădire rezidențială și următoarele", valoare: "0,2%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "1,3%" },
      { ce: "Clădiri rezidențiale ale firmelor (cu cota adițională)", valoare: "0,4%" },
      { ce: "Clădiri nerezidențiale ale firmelor (cu cota adițională)", valoare: "1,46%" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie",
    note: [],
    surse: [
      { nume: "HCL nr. 744/2025 (ploiesti.ro)", url: "https://ploiesti.ro/hotarari/hotararea-nr-744-din-29-decembrie-2025-privind-stabilirea-impozitelor-si-taxelor-locale-pentru-anul-2026/" },
      { nume: "Anexa 1: impozitul și taxa pe clădiri (PDF)", url: "https://ploiesti.ro/wp-content/uploads/2025/12/744_29.12.2025_anexa_1_impozitul-si-taxa-pe-cladiri.pdf" },
    ],
    verificat: "25.10.2026",
  },
  {
    judet: "sibiu",
    oras: "sibiu",
    nume: "Sibiu",
    an: 2026,
    hotarare: "HCL nr. 125/2025, modificată prin HCL nr. 462 din 30.12.2025 (menținută prin HCL nr. 114/2026)",
    cote: [
      { ce: "Locuințe (clădiri rezidențiale) ale persoanelor fizice", valoare: "0,08%" },
      { ce: "Clădiri nerezidențiale ale persoanelor fizice", valoare: "0,5%" },
      { ce: "Clădiri rezidențiale ale firmelor", valoare: "0,2% (+25% cotă adițională)" },
      { ce: "Clădiri nerezidențiale ale firmelor", valoare: "1,3%" },
    ],
    bonificatie: "10% pentru plata integrală până la 31 martie (clădiri, teren, mașini)",
    note: ["O firmă a contestat cota de 1,3% pentru clădirile nerezidențiale ale firmelor; Consiliul Local a respins plângerea și a menținut hotărârea (HCL nr. 114/2026)."],
    surse: [
      { nume: "HCL nr. 462/2025 (sibiu.ro)", url: "https://www.sibiu.ro/ro2/pdf2025/HCL_462_2025.pdf" },
      { nume: "HCL nr. 114/2026, menținerea hotărârii (sibiu.ro)", url: "https://www.sibiu.ro/ro2/pdf2026/HCL_114_2026.pdf" },
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
