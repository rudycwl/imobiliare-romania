// Conținut editorial pentru pagina de start și /legislatie: știri, proiecte noi, reguli pe categorii.
// Se actualizează manual aici. Textele juridice sunt informații generale (de verificat de un jurist).

export const ACTUALIZAT = "23.10.2026";

export type Stire = { categorie: string; titlu: string; sursa: string; url: string };
export type Proiect = { stadiu: string; loc: string; titlu: string; descriere: string; progres: number; sursa: string; url: string };
export type Regula = { titlu: string; text: string };
export type Public = { id: string; nume: string; reguli: Regula[] };

export const BANDA: { eticheta: string; text: string; href: string }[] = [
  { eticheta: "Legislație", text: "TVA 9% la locuințe noi s-a aplicat până la 31 iulie 2026. Vezi ce se aplică acum", href: "/legislatie#tva" },
  { eticheta: "Vânzători", text: "Impozit la vânzare: 3% sub 3 ani de deținere, 1% peste 3 ani, fără plafon neimpozabil", href: "/legislatie#vanzatori" },
  { eticheta: "Proiecte", text: "Iași: ansamblu nou cu 11 blocuri propus în Bucium", href: "/#proiecte" },
  { eticheta: "Agenții", text: "Agenție Fondatoare: 6 luni gratuit pentru primele 100 de agenții", href: "/pentru-agentii" },
];

export const PROIECTE: Proiect[] = [
  {
    stadiu: "În aprobare",
    loc: "Bucium, Iași",
    titlu: "Ansamblu rezidențial cu 11 blocuri",
    descriere: "Proiectul a intrat în discuția consilierilor locali. Urmează avizele și autorizația de construire.",
    progres: 18,
    sursa: "BZI.ro",
    url: "https://www.bzi.ro/un-nou-ansamblu-rezidential-de-locuinte-cu-11-blocuri-va-fi-construit-in-bucium-proiectul-imobiliar-se-afla-pe-masa-consilierilor-locali-5357889",
  },
  {
    stadiu: "În construcție",
    loc: "Copou, Iași",
    titlu: "Royal Town: o nouă etapă",
    descriere: "O nouă etapă de dezvoltare în cartierul de pe dealul Copou.",
    progres: 55,
    sursa: "Ziarul Financiar",
    url: "https://www.zf.ro/zf-24/etapa-dezvoltare-orasul-royal-town-copou-107-apartamente-peste-23083139",
  },
  {
    stadiu: "Renovare",
    loc: "Iași",
    titlu: "Două blocuri consolidate seismic și renovate energetic",
    descriere: "Proiect public de consolidare și eficiență energetică pentru două clădiri de locuințe.",
    progres: 35,
    sursa: "BZI.ro",
    url: "https://www.bzi.ro/doua-cladiri-rezidentiale-multifamiliale-din-iasi-vor-fi-consolidate-seismic-si-renovate-energetic-proiectul-valoreaza-peste-59-milioane-de-lei-5098324",
  },
];

export const STIRI: Stire[] = [
  {
    categorie: "Vânzători",
    titlu: "Impozitul la vânzarea unei locuințe: 3% sau 1%, fără plafon",
    sursa: "BZI.ro",
    url: "https://www.bzi.ro/cum-se-calculeaza-impozitul-la-vanzarea-unui-imobil-in-2026-iata-ce-presupune-taxarea-la-vanzarea-unei-proprietati-5496306",
  },
  {
    categorie: "Piață",
    titlu: "Piața de investiții imobiliare a revenit pe creștere",
    sursa: "Revista Biz",
    url: "https://www.revistabiz.ro/cushman-wakefield-echinox-piata-de-investitii-imobiliare-din-romania-a-revenit-pe-crestere/",
  },
  {
    categorie: "Piață",
    titlu: "Tranzacțiile scad ușor, dar prețurile locuințelor rămân ridicate",
    sursa: "Antena 3",
    url: "https://www.antena3.ro/conferinte/conferintele-romania-inteligenta/tranzactiile-scad-usor-dar-preturile-imobiliarelor-raman-ridicate-cum-arata-accesibilitatea-locuintelor-in-romania-768265.html",
  },
];

export const STIRE_TVA = {
  titlu: "TVA la locuințele noi: ce s-a schimbat după 31 iulie 2026",
  text: "Cota redusă de 9% s-a aplicat doar până la 31 iulie 2026, cu condiții (maximum 120 m², cel mult 600.000 lei, antecontract semnat până la 1 august 2025). Acum, la locuințele noi cumpărate de la firme se aplică, de regulă, cota standard de 21%. Între persoane fizice nu se plătește TVA.",
  sursa: "Capital.ro",
  url: "https://www.capital.ro/achizitia-unei-locuinte-vechi-in-2026-cand-trebuie-cetatenii-sa-plateasca-tva.html",
};

export const PUBLICURI: Public[] = [
  {
    id: "cumparatori",
    nume: "Cumpărători",
    reguli: [
      { titlu: "Contractul se face la notar", text: "Vânzarea unei locuințe se încheie în formă autentică, la notar. Abia apoi proprietatea trece pe numele tău." },
      { titlu: "Cere extrasul de carte funciară", text: "Înainte să dai avans, verifică cine e proprietarul și dacă există ipoteci sau interdicții." },
      { titlu: "TVA doar când cumperi de la firmă", text: "De la o persoană fizică nu plătești TVA. La o locuință nouă de la dezvoltator, TVA e inclus în preț, de regulă la cota standard." },
      { titlu: "Certificatul energetic e obligatoriu", text: "Vânzătorul trebuie să ți-l prezinte. Arată cât consumă locuința." },
    ],
  },
  {
    id: "vanzatori",
    nume: "Vânzători persoane fizice",
    reguli: [
      { titlu: "Impozit de 3% sau 1%", text: "3% dacă ai deținut locuința sub 3 ani, 1% peste 3 ani. Se aplică la toată valoarea, fără plafon neimpozabil." },
      { titlu: "Impozitul se plătește la notar", text: "Notarul îl calculează și îl reține la semnarea contractului." },
      { titlu: "Actele de pregătit", text: "Actul de proprietate, documentația cadastrală, certificatul fiscal de la primărie și certificatul energetic." },
      { titlu: "Atenție la vânzările repetate", text: "Dacă vinzi des, ANAF poate considera că faci afaceri, iar atunci se pot datora TVA și alte taxe." },
    ],
  },
  {
    id: "firme",
    nume: "Firme",
    reguli: [
      { titlu: "Clădiri noi: cu TVA", text: "Locuințele și spațiile noi se vând cu TVA. Clădirile vechi sunt, de regulă, scutite, cu opțiune de taxare." },
      { titlu: "Factură și e-Factura", text: "Vânzarea se facturează și se raportează în sistemul e-Factura." },
      { titlu: "Contractul tot la notar", text: "Și pentru firme, transferul proprietății imobiliare se face prin act autentic." },
      { titlu: "Întreabă contabilul", text: "Regimul TVA depinde de situația firmei. Verifică înainte de a stabili prețul." },
    ],
  },
  {
    id: "dezvoltatori",
    nume: "Dezvoltatori",
    reguli: [
      { titlu: "Autorizația de construire", text: "Fără autorizație nu poți începe lucrările. Publică stadiul proiectului ca să câștigi încrederea cumpărătorilor." },
      { titlu: "Recepția la terminarea lucrărilor", text: "După recepție se face intabularea apartamentelor și se pot semna contractele finale." },
      { titlu: "Antecontract clar", text: "Scrie în antecontract termenul de predare, avansul și ce se întâmplă la întârziere." },
      { titlu: "TVA la locuințele noi", text: "Cota redusă de 9% s-a încheiat la 31 iulie 2026. Prețurile afișate trebuie să includă TVA-ul corect." },
    ],
  },
];
