// Conținut editorial pentru pagina de start și /legislatie: noutăți legislative, reguli pe categorii.
// Se actualizează manual aici. Regula casei: doar surse oficiale (Monitorul Oficial, Portal Legislativ,
// ANAF, Ministerul Finanțelor, hotărârile consiliilor locale), cu link și dată. Presa doar la știrile de piață.

export const ACTUALIZAT = "29.10.2026";

export type Sursa = { nume: string; url: string };
/** O noutate legislativă: data actului, ce se schimbă pe scurt și unde se găsește textul oficial. */
export type Stire = { data: string; categorie: string; titlu: string; text: string; act: string; sursa: Sursa };
export type Regula = { titlu: string; text: string; sursa?: Sursa };
export type Public = { id: string; nume: string; reguli: Regula[] };

const ANAF_LEGI = "https://static.anaf.ro/static/10/Anaf/legislatie";
export const COD_FISCAL: Sursa = { nume: "Codul fiscal (Legea 227/2015), Portal Legislativ", url: "https://legislatie.just.ro/Public/DetaliiDocument/171282" };

export const BANDA: { eticheta: string; text: string; href: string }[] = [
  { eticheta: "Impozite locale", text: "Impozitul pe clădiri în 2026, oraș cu oraș: cote, reduceri, termene, cu link la hotărârea primăriei", href: "/impozite-locale" },
  { eticheta: "Legislație", text: "TVA 9% la locuințe noi s-a aplicat până la 30 septembrie 2026 (Legea 161/2026). Vezi ce se aplică acum", href: "/legislatie#tva" },
  { eticheta: "Vânzători", text: "Impozit la vânzare: 3% sub 3 ani de deținere, 1% peste 3 ani, fără plafon neimpozabil", href: "/legislatie#vanzatori" },
  { eticheta: "Clădiri vechi", text: "Din 2026: valoarea impozabilă scade cu 15% la clădirile de 50–100 de ani și cu 25% peste 100 de ani", href: "/legislatie#noutati" },
  { eticheta: "Calculator", text: "Cât ai plăti pe lună pentru o locuință? Calculează rata în câteva secunde", href: "/#credit" },
];

/** Noutăți legislative, cele mai noi primele. Fiecare are link la textul oficial. */
export const STIRI: Stire[] = [
  {
    data: "04.08.2026",
    categorie: "TVA locuințe",
    titlu: "TVA 9% la locuințe noi, prelungit până la 30 septembrie 2026",
    text: "Cota de 9% s-a putut aplica până la 30 septembrie 2026 pentru o singură locuință de cel mult 120 m² utili și 600.000 lei fără TVA, dacă antecontractul cu avans a fost semnat până la 1 august 2025. Cine a cumpărat între 1 august 2026 și intrarea în vigoare a legii cu TVA standard poate cere diferența, din 1 octombrie 2026, după procedura ANAF.",
    act: "Legea nr. 161/2026, Monitorul Oficial nr. 642 din 4 august 2026",
    sursa: { nume: "Textul legii (ANAF)", url: `${ANAF_LEGI}/L_161_2026.pdf` },
  },
  {
    data: "27.02.2026",
    categorie: "Impozit clădiri",
    titlu: "Clădirile vechi plătesc impozit mai mic din 2026",
    text: "Valoarea impozabilă a clădirii se reduce cu 15% dacă are între 50 și 100 de ani și cu 25% dacă are peste 100 de ani. Persoanele cu handicap grav plătesc 50% din impozitul pe locuința de domiciliu, cele cu handicap accentuat 75%. Sumele plătite în plus pe 2026 se compensează sau se restituie.",
    act: "OUG nr. 9/2026, Monitorul Oficial nr. 157 din 27 februarie 2026",
    sursa: { nume: "Textul ordonanței (ANAF)", url: `${ANAF_LEGI}/OUG_9_2026.pdf` },
  },
  {
    data: "15.12.2025",
    categorie: "Impozit clădiri",
    titlu: "Noile valori impozabile pentru clădiri, din 2026",
    text: "Pentru o clădire din beton sau cărămidă cu apă, canalizare, curent și încălzire, valoarea impozabilă de bază este 2.677 lei/m². Primăriile nu pot stabili pentru 2026 o cotă mai mică decât în 2025. Pentru locuințele cu valoarea impozabilă peste 2.500.000 lei se plătește în plus 0,9% din diferență.",
    act: "Legea nr. 239 din 15 decembrie 2025",
    sursa: { nume: "Legea 239/2025, Portal Legislativ", url: "https://legislatie.just.ro/Public/DetaliiDocumentAfis/305208" },
  },
  {
    data: "01.01.2026",
    categorie: "Închiriere",
    titlu: "Închirierea în regim hotelier: 10% din venitul net",
    text: "Pentru veniturile din 2026, la închirierea pe termen scurt a 1–7 camere din locuința proprie, cheltuielile se scad forfetar (30% din venitul brut), iar impozitul este 10% din rest. Peste 7 camere, venitul e tratat ca activitate independentă. Declarația unică se depune până la 25 mai a anului următor.",
    act: "Codul fiscal, art. 83–85, modificat prin Legea nr. 239/2025",
    sursa: { nume: "Ghidul ANAF pentru 2026", url: "https://static.anaf.ro/static/10/Brasov/Brasov/web_ian_2026.pdf" },
  },
  {
    data: "25.07.2025",
    categorie: "TVA locuințe",
    titlu: "Locuințele noi se vând cu TVA 21%",
    text: "Din 1 august 2025, cota standard de TVA este 21%, iar locuințele noi cumpărate de persoane fizice nu mai au cotă redusă, cu excepția regimului tranzitoriu de 9%. Cota de 11% se aplică doar unor clădiri cu destinație socială (cămine de bătrâni, centre pentru copii).",
    act: "Legea nr. 141/2025, Monitorul Oficial nr. 699 din 25 iulie 2025",
    sursa: { nume: "Explicația ANAF (DGRFP Cluj)", url: "https://static.anaf.ro/static/3/Cluj/20250811163039_cj_tva_locuinte_05aug2025.pdf" },
  },
  {
    data: "05.12.2024",
    categorie: "Vânzare",
    titlu: "Impozitul la vânzare se calculează minim la grila notarilor",
    text: "Dacă prețul din contract e mai mic decât valoarea minimă din studiul de piață al camerelor notarilor, impozitul de 3% sau 1% se calculează la valoarea din studiu, nu la prețul declarat.",
    act: "OUG nr. 138/2024, Monitorul Oficial nr. 1222 din 5 decembrie 2024 (art. 111 alin. 4¹ din Codul fiscal)",
    sursa: { nume: "Textul ordonanței (ANAF)", url: `${ANAF_LEGI}/OUG_138_2024.pdf` },
  },
];

/** Știri despre piață: doar din presă de afaceri cunoscută, cu sursa datelor scrisă (decizia lui Rudy, 25.10.2026). */
/** Știri de piață, doar din presa aprobată de Rudy: Agerpres, G4Media, HotNews, Biziday, Profit.ro, Revista Biz. Cu dată și sursa datelor. */
export const STIRI_PIATA: { data: string; titlu: string; text: string; sursa: string; url: string }[] = [
  {
    data: "27.10.2026",
    titlu: "Apartamentele, cu peste 30% mai scumpe în 3 ani; rata a scăzut, chiria a crescut",
    text: "Valoarea apartamentelor a crescut cu peste 30% în ultimii 3 ani, iar chiria pentru un apartament cu 2 camere în marile orașe a ajuns la 440–600 de euro pe lună. În schimb, pentru un credit ipotecar de 300.000 de lei cu dobândă fixă de circa 4,95% în primii trei ani, rata este acum de circa 1.600 de lei pe lună, față de 1.780 de lei în 2023.",
    sursa: "HotNews, analiză OferteBancare.ro",
    url: "https://hotnews.ro/chiria-urca-rata-sta-pe-loc-cine-a-castigat-din-scumpirea-apartamentelor-si-cat-mai-tine-avantajul-2387764",
  },
  {
    data: "27.10.2026",
    titlu: "62% dintre românii cu credit ipotecar vor să-l plătească înainte de termen",
    text: "Un studiu european făcut în iulie 2026 pe peste 22.000 de adulți din 24 de țări arată că 62% dintre românii cu credit ipotecar se așteaptă să-l achite anticipat, față de 25% media europeană. 77% dintre români locuiesc în casa lor, una dintre cele mai mari rate din Europa, iar 50% sunt optimiști în privința pieței imobiliare. Dintre cei care nu au locuință, 47% vor să devină proprietari, iar 26% cred că nu vor cumpăra niciodată.",
    sursa: "Agerpres, studiu Re/Max Europe realizat de Kantar Public",
    url: "https://agerpres.ro/economic/2026/10/27/aproximativ-62-dintre-romanii-cu-credite-ipotecare-se-asteapta-sa-le-achite-anticipat-studiu--1607281",
  },
  {
    data: "23.10.2026",
    titlu: "Peste 98.000 de locuințe vândute în 9 luni, cu 18% mai puține",
    text: "În primele nouă luni din 2026 s-au vândut în toată țara peste 98.000 de locuințe, cu 17,8% mai puține decât anul trecut; în București peste 29.600 (−14,9%), iar Timișul a crescut cu 4,2%. În trimestrul 3, Brașovul a scăzut cel mai mult (−63,4%). Ipotecile pe locuințe au scăzut în trimestrul 3 cu 24,1%, la peste 18.300, dar au crescut ușor în Timiș (+1,6%) și Cluj (+2,5%).",
    sursa: "Revista Biz, date ANCPI analizate de Storia",
    url: "https://www.revistabiz.ro/blocajul-de-la-ancpi-a-dat-in-jos-piata-imobiliara/",
  },
  {
    data: "16.10.2026",
    titlu: "Cadastru: 108.437 de imobile vândute în trimestrul 3, cu 38% mai puține",
    text: "Între iulie și septembrie 2026 s-au vândut în toată țara 108.437 de imobile (case, apartamente și terenuri), față de 174.706 în aceeași perioadă din 2025. Cele mai multe vânzări au fost în București (20.298), Timiș (7.517) și Ilfov (7.231), iar dintre reședințele de județ în Timișoara (3.456), Constanța (2.387) și Iași (1.999). Ipotecile au scăzut la 69.206, cu 26.582 mai puține decât anul trecut.",
    sursa: "Agerpres, comunicat ANCPI",
    url: "https://agerpres.ro/comunicate/2026/10/16/comunicat-de-presa---agentia-nationala-de-cadastru-si-publicitate-imobiliara--1603629",
  },
  {
    data: "14.10.2026",
    titlu: "Investițiile în clădiri comerciale au ajuns la 654 milioane de euro în 9 luni",
    text: "În primele nouă luni din 2026, investițiile în imobile comerciale au depășit volumul din tot anul 2025. Bucureștiul a atras doar 29% (circa 190 milioane de euro), sub nivelul obișnuit de peste 50%, iar vestul țării 33%. Retailul a avut 61% din volum, birourile 33%, iar investitorii străini 83% din tranzacții.",
    sursa: "Agerpres, analiză Crosspoint Real Estate",
    url: "https://agerpres.ro/economic/2026/10/14/investitiile-imobiliare-comerciale-au-ajuns-la-654-milioane-de-euro-in-primele-noua-luni-din-2026-an--1602747",
  },
  {
    data: "13.10.2026",
    titlu: "Cluj-Napoca rămâne cel mai scump oraș, Bucureștiul urcă pe locul 2",
    text: "Prețul mediu cerut pe apartamente: Cluj-Napoca 3.316 €/m², București 2.312 €/m² (+9% într-un an), Brașov 2.309 €/m², Iași circa 2.000 €/m², Timișoara 1.984 €/m² (+8%). Sunt prețuri din anunțuri, nu din tranzacții.",
    sursa: "Agerpres, date Imobiliare.ro",
    url: "https://agerpres.ro/economic/2026/10/13/capitala-pe-locul-ii-in-topul-oraselor-cu-cele-mai-mari-preturi-la-apartamente-cluj-napoca-ramane-li--1602443",
  },
  {
    data: "12.10.2026",
    titlu: "Vânzările de locuințe au scăzut cu o treime în trimestrul 3",
    text: "Între iulie și septembrie 2026 s-au vândut 30.523 de locuințe în toată țara, cu 32% mai puține decât anul trecut. Iulie a fost cea mai slabă lună din ultimii 10 ani, din cauza atacului informatic de la Cadastru. Timișoara este singurul oraș mare cu creștere (+6%).",
    sursa: "Profit.ro, date ANCPI analizate de SVN Romania",
    url: "https://www.profit.ro/povesti-cu-profit/real-estate-constructii/piata-imobiliara-s-a-prabusit-cel-mai-mic-numar-de-locuinte-vandute-din-ultimii-sase-ani-in-regiunea-bucuresti-ilfov-22818788",
  },
  {
    data: "13.10.2026",
    titlu: "Prețurile cerute pe apartamente, oraș cu oraș",
    text: "Craiova 2.142 €/m², Sibiu 2.034 €/m² (+7%), Constanța circa 2.020 €/m² (+6%), Oradea 1.885 €/m² (+5%). La Brașov și Timișoara, apartamentele noi trec de 2.200–2.800 €/m².",
    sursa: "HotNews, date Imobiliare.ro",
    url: "https://hotnews.ro/imobiliare-un-metru-patrat-in-cluj-costa-cat-un-metru-si-jumatate-in-bucuresti-2374492",
  },
];

export const STIRE_TVA = {
  titlu: "TVA la locuințele noi: ce se aplică după 30 septembrie 2026",
  text: "Cota redusă de 9% s-a aplicat, tranzitoriu, până la 30 septembrie 2026 inclusiv (prelungire prin Legea 161/2026), cu condiții: o singură locuință, maximum 120 m² utili, cel mult 600.000 lei fără TVA, antecontract cu avans semnat până la 1 august 2025. Acum, la locuințele noi cumpărate de la firme se aplică cota standard de 21%. Între persoane fizice care nu fac afaceri cu imobile nu se plătește TVA.",
  sursa: "Legea 161/2026 (ANAF)",
  url: `${ANAF_LEGI}/L_161_2026.pdf`,
};

export const PUBLICURI: Public[] = [
  {
    id: "cumparatori",
    nume: "Cumpărători",
    reguli: [
      { titlu: "Contractul se face la notar", text: "Vânzarea unei locuințe se încheie în formă autentică, la notar. Abia apoi proprietatea trece pe numele tău." },
      { titlu: "Cere extrasul de carte funciară", text: "Înainte să dai avans, verifică cine e proprietarul și dacă există ipoteci sau interdicții." },
      { titlu: "TVA doar când cumperi de la firmă", text: "De la o persoană fizică nu plătești TVA. La o locuință nouă de la dezvoltator, TVA e inclus în preț, la cota standard de 21%.", sursa: { nume: "ANAF: cote TVA locuințe", url: "https://static.anaf.ro/static/3/Cluj/20250811163039_cj_tva_locuinte_05aug2025.pdf" } },
      { titlu: "Certificatul energetic e obligatoriu", text: "Vânzătorul trebuie să ți-l prezinte. Arată cât consumă locuința.", sursa: { nume: "Legea 372/2005", url: "https://legislatie.just.ro/Public/DetaliiDocument/66970" } },
    ],
  },
  {
    id: "vanzatori",
    nume: "Vânzători persoane fizice",
    reguli: [
      { titlu: "Impozit de 3% sau 1%", text: "3% dacă ai deținut locuința sub 3 ani, 1% peste 3 ani. Se aplică la toată valoarea, fără plafon neimpozabil, dar cel puțin la valoarea minimă din grila notarilor.", sursa: { nume: "Codul fiscal, art. 111", url: COD_FISCAL.url } },
      { titlu: "Impozitul se plătește la notar", text: "Notarul îl calculează și îl încasează la semnarea contractului.", sursa: { nume: "Codul fiscal, art. 111", url: COD_FISCAL.url } },
      { titlu: "Actele de pregătit", text: "Actul de proprietate, documentația cadastrală, certificatul fiscal de la primărie și certificatul energetic." },
      { titlu: "Atenție la vânzările repetate", text: "Dacă vinzi des, ANAF poate considera că faci afaceri, iar atunci se pot datora TVA și alte taxe." },
    ],
  },
  {
    id: "firme",
    nume: "Firme",
    reguli: [
      { titlu: "Clădiri noi: cu TVA", text: "Locuințele și spațiile noi se vând cu TVA. Clădirile vechi sunt, de regulă, scutite, cu opțiune de taxare.", sursa: { nume: "Codul fiscal, art. 292", url: COD_FISCAL.url } },
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
      { titlu: "TVA la locuințele noi", text: "Cota redusă de 9% s-a încheiat la 30 septembrie 2026 (Legea 161/2026). Acum se aplică 21%. Prețurile afișate trebuie să includă TVA-ul corect.", sursa: { nume: "Legea 161/2026", url: STIRE_TVA.url } },
    ],
  },
];
