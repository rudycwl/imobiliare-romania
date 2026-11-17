// Afișarea paginii de anunț: localizare fără dubluri, caracteristici extrase din descriere
// și descrierea împărțită în paragrafe și liste. Funcții pure; textul din baza de date nu se schimbă.

import { COMPARTIMENTARE, DOTARI, STARE, type Dotare } from "./caracteristici-liste";

const simplu = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const egal = (a: string, b: string) => simplu(a) === simplu(b);

export type Localizare = { zona: string | null; oras: string; judet: string | null };

/**
 * „Zona, Oraș (jud. Județ)”. Zona dispare dacă lipsește sau repetă orașul.
 * București (orașele sunt sectoarele): „Zona, Sector X, București”, fără „jud.”.
 */
export function localizare(zona: string | null | undefined, oras: string, judet: string, judetSlug?: string): Localizare {
  const z = zona?.trim() || null;
  const bucuresti = judetSlug === "bucuresti" || egal(judet, "București");
  return {
    zona: z && !egal(z, oras) && !egal(z, judet) ? z : null,
    oras,
    judet: bucuresti && egal(oras, judet) ? null : judet,
  };
}

export function textLocalizare(l: Localizare, judetSlug?: string): string {
  const baza = [l.zona, l.oras].filter(Boolean).join(", ");
  if (!l.judet) return baza;
  return judetSlug === "bucuresti" || egal(l.judet, "București") ? `${baza}, ${l.judet}` : `${baza} (jud. ${l.judet})`;
}

// ---------- Caracteristici din descriere ----------

export type Caracteristici = {
  etaj?: string;
  anConstructie?: number;
  clasaEnergetica?: string;
  bai?: number;
  balcon?: string;
  incalzire?: string;
  mobilare?: string;
  aerConditionat?: string;
  suprafataUtila?: number;
  suprafataTotala?: number;
  /** Casă: numărul de niveluri (doar din câmpul completat). */
  niveluri?: number;
  /** Etajele clădirii, când etajul nu e completat (doar din câmpul completat). */
  regimInaltime?: string;
  compartimentare?: string;
  stare?: string;
  /** Codurile dotărilor (DOTARI); pe pagină apar ca etichete scurte. */
  dotari?: Dotare[];
};

// Granițe de cuvânt care țin cont de diacritice (\b din JS vede „ă” ca separator).
const I = "(?<![\\p{L}\\p{N}])";
const S = "(?![\\p{L}\\p{N}])";
const re = (s: string, f = "iu") => new RegExp(s.replace(/\\</g, I).replace(/\\>/g, S), f);

const MP = "(?:mp|m2|m²|metri pătrați|metri patrati)";
const NUM = "(\\d{1,4}(?:[.,]\\d{1,3})?)";

/** „79,69” → 79.69; „1.200” → 1200; „79.69” → 79.69. */
export function numar(s: string): number {
  if (/^\d{1,3}\.\d{3}$/.test(s)) return Number(s.replace(".", ""));
  return Number(s.replace(",", "."));
}

const NUMERE: Record<string, number> = { o: 1, un: 1, una: 1, doua: 2, două: 2, doi: 2, trei: 3, patru: 4, cinci: 5 };

export function extrageCaracteristici(descriere: string, acum = new Date()): Caracteristici {
  const t = descriere.replace(/\s+/g, " ");
  const c: Caracteristici = {};

  // Etaj: „etajul 2 din 11”, „etaj 3/4”, „parter din 4”, „etajul 5”.
  const etaj = t.match(re("\\<(?:situat |aflat )?(?:la )?(?:etaj(?:ul)?\\s*(\\d{1,2})|(parter))\\>\\s*(?:(?:din|\\/)\\s*(\\d{1,2})\\>)?"));
  if (etaj) {
    const nr = etaj[1] ?? "Parter";
    const total = etaj[3] ? Number(etaj[3]) : null;
    if (!(total != null && etaj[1] && Number(etaj[1]) > total)) c.etaj = total != null ? `${nr}/${total}` : nr;
  }

  // An construcție: doar cu verbul/substantivul lângă an, ca să nu luăm alte date.
  const an = t.match(re("\\<(?:construit(?:ă|a)?|construcți(?:e|a|ei)|finalizat(?:ă|a)?|an(?:ul)? (?:de )?construcți(?:e|ei)|recepționat(?:ă|a)?)\\>\\s*(?:în |in |din |:\\s*)?(?:anul\\s+)?((?:18|19|20)\\d{2})\\>"));
  if (an) {
    const y = Number(an[1]);
    if (y >= 1850 && y <= acum.getFullYear() + 3) c.anConstructie = y;
  }

  // Clasă energetică: litera trebuie să fie majusculă („clasa energetică a fost…” nu e „A”).
  const ce = t.match(/(?<![\p{L}])[Cc]las(?:a|ă|ei|e)\s+(?:de\s+)?[Ee]nergetic(?:ă|a|e)\s*:?\s*(A\+{0,2}|[B-G])(?![\p{L}\p{N}])/u);
  if (ce) c.clasaEnergetica = ce[1];

  // Băi: „două băi”, „2 băi”, „o baie”, „2 grupuri sanitare”.
  const bai = t.match(re("\\<(\\d|o|un|una|doi|două|doua|trei|patru|cinci)\\s+(?:băi|bai|baie|grupuri sanitare|grup sanitar)\\>"));
  if (bai) {
    const n = /\d/.test(bai[1]) ? Number(bai[1]) : NUMERE[bai[1].toLowerCase()];
    const singular = /\s(?:baie|grup sanitar)$/i.test(bai[0]);
    if (n && n <= 9 && (n === 1) === singular) c.bai = n;
  }

  // Balcon: „fără balcon” nu contează; „balcon de 6,04 mp” → 6 m²; „2 balcoane”.
  if (!re("\\<fără balcon|\\<fara balcon").test(t)) {
    const mp = t.match(re(`\\<balcon(?:ul)?(?:\\s+(?:închis|inchis|deschis))?\\s+(?:de|cu suprafața de|cu o suprafață de)\\s+${NUM}\\s*${MP}`));
    const multe = t.match(re("\\<(\\d|două|doua|trei)\\s+balcoane\\>"));
    const inchis = re("\\<balcon(?:ul)?\\s+(?:este\\s+)?(?:închis|inchis)\\>").test(t) ? "închis, " : "";
    if (multe) {
      const n = /\d/.test(multe[1]) ? Number(multe[1]) : NUMERE[multe[1].toLowerCase()];
      if (n) c.balcon = `${n} balcoane`;
    } else if (mp) c.balcon = `Da, ${inchis}${Math.round(numar(mp[1]))} m²`;
    else if (inchis) c.balcon = "Da, închis";
    else if (re("\\<balcon(?:ul)?\\>").test(t)) c.balcon = "Da";
  }

  // Încălzire: doar formulări clare.
  const inc: string[] = [];
  const add = (ok: boolean, eticheta: string) => ok && !inc.includes(eticheta) && inc.push(eticheta);
  // „centrală” singur nu ajunge („zonă centrală”): trebuie urmat de termică / proprie / nouă / pe gaz …
  add(
    re("\\<(?:centrală|centrala|centrale) (?:termică |termica )?(?:proprie|de apartament|pe gaz|termică|termica|nouă|noua|individuală|individuala|murală|murala|(?:în|in) condensare)\\>|\\<CT proprie\\>").test(t),
    "Centrală proprie",
  );
  add(re("\\<(?:încălzire|incalzire|încălzirea|incalzirea) (?:este )?centralizat(?:ă|a)\\>|\\<termoficare\\>|\\<agent termic\\>").test(t), "Centralizată");
  add(re("\\<(?:încălzire|incalzire) (?:în|in) pardoseală\\>|\\<(?:încălzire|incalzire) (?:în|in) pardoseala\\>").test(t), "În pardoseală");
  add(re("\\<pomp(?:ă|a) de căldură\\>|\\<pomp(?:ă|a) de caldura\\>").test(t), "Pompă de căldură");
  add(inc.length === 0 && re("\\<(?:încălzire|incalzire) (?:pe|cu) gaz\\>").test(t), "Pe gaz");
  if (inc.length) c.incalzire = inc.join(", ");

  // Mobilare.
  if (re("\\<nemobilat(?:ă|a)?\\>").test(t)) c.mobilare = "Nemobilat";
  else if (re("\\<semimobilat(?:ă|a)?\\>").test(t)) c.mobilare = "Semimobilat";
  else {
    const mob = re("\\<mobilat(?:ă|a)?\\>").test(t);
    const ut = re("\\<utilat(?:ă|a)?\\>").test(t);
    if (mob && ut) c.mobilare = "Mobilat și utilat";
    else if (mob) c.mobilare = "Mobilat";
    else if (ut) c.mobilare = "Utilat";
  }

  // Aer condiționat: „două aparate de aer condiționat”, „AC în fiecare cameră”; nu „fără aer condiționat”.
  if (!re("\\<f(?:ă|a)r(?:ă|a) aer condi(?:ț|ţ|t)ionat\\>").test(t)) {
    const ac = t.match(re("\\<(?:(\\d+|un|o|unu|dou(?:ă|a)|doi|trei|patru)\\s+(?:aparate?|unit(?:ăți|ati|ate))\\s+(?:de\\s+)?)?aer(?:ul)?\\s+condi(?:ț|ţ|t)ionat\\>|\\<climatizare\\>|\\<(?:aparat|aparate) (?:de )?AC\\>"));
    if (ac) {
      const n: Record<string, number> = { un: 1, o: 1, unu: 1, doua: 2, "două": 2, doi: 2, trei: 3, patru: 4 };
      const k = ac[1] ? (/^\d+$/.test(ac[1]) ? Number(ac[1]) : n[ac[1].toLowerCase()]) : undefined;
      c.aerConditionat = k && k > 1 ? `Da, ${k} aparate` : "Da";
    } else if (/(?<![\p{L}\p{N}])AC(?![\p{L}\p{N}])/u.test(t)) c.aerConditionat = "Da"; // „AC nou”: abrevierea, doar cu majuscule
  }

  // Compartimentare (granița de cuvânt oprește „semidecomandat” să fie citit ca „decomandat”).
  const comp = t.match(re("\\<(semidecomandat|nedecomandat|decomandat|circular|open[ -]?space)(?:ă|a|e)?\\>"));
  if (comp) {
    const k = comp[1].toLowerCase().replace(/^open.*/, "open-space") as keyof typeof COMPARTIMENTARE;
    c.compartimentare = COMPARTIMENTARE[k];
  }

  // Starea: „nerenovat” înaintea lui „renovat” (granița de cuvânt nu lasă „renovat” să se potrivească în „nerenovat”).
  if (re("\\<(?:nerenovat(?:ă|a)?|necesit(?:ă|a) (?:renovare|renovări|renovari|lucrări|lucrari|reparații|reparatii)|de renovat)\\>").test(t)) c.stare = STARE["necesita-renovare"];
  else if (re("\\<(?:bloc nou|imobil nou|clădire nouă|cladire noua|construcție nouă|constructie noua|locuință nouă|locuinta noua|ansamblu nou)\\>").test(t)) c.stare = STARE.nou;
  else if (re("\\<(?:renovat(?:ă|a)?|finisaje noi|renovare completă|renovare completa)\\>").test(t)) c.stare = STARE.renovat;
  else if (re("\\<stare (?:foarte )?bun(?:ă|a)\\>").test(t)) c.stare = STARE.bun;

  // Dotări: doar formulări clare; pagina le arată doar pe cele potrivite tipului (DOTARI_TIP).
  const dot: [Dotare, string][] = [
    ["lift", "\\<lift(?:ul|uri|urile)?\\>"],
    ["parcare", "\\<loc(?:uri|ul)? de parcare\\>|\\<parcare (?:proprie|privată|privata|subterană|subterana|inclusă|inclusa|asigurată|asigurata)\\>|\\<cu parcare\\>"],
    ["garaj", "\\<garaj\\>"],
    ["boxa", "\\<box(?:ă|a)\\>"],
    ["termopan", "\\<termopan(?:e|uri)?\\>"],
    ["usa-metalica", "\\<u(?:ș|ş|s)(?:ă|a) metalic(?:ă|a)\\>"],
    ["interfon", "\\<(?:video)?interfon\\>"],
    ["acces-securizat", "\\<acces (?:securizat|controlat)\\>"],
    ["video", "\\<(?:supraveghere|monitorizare) video\\>|\\<camere (?:video|de supraveghere)\\>"],
    ["alarma", "\\<(?:sistem (?:de )?)?alarm(?:ă|a)\\>"],
    ["internet", "\\<internet\\>|\\<fibr(?:ă|a) optic(?:ă|a)\\>"],
    ["curte", "\\<curte\\>"],
    ["amenajat", "\\<amenajat(?:ă|a)? (?:pentru|ca) birou(?:ri)?\\>"],
    ["grup-sanitar", "\\<grup(?:uri)? sanitar(?:e)?\\>"],
    ["chicineta", "\\<chicinet(?:ă|a)\\>|\\<kitchenette\\>"],
    ["frigider", "\\<(?:mini-?)?frigider\\>"],
    ["acces-24", "\\<(?:acces|program) (?:non-?stop|24\\s?/\\s?7|24 din 24)\\>"],
    ["vitrina", "\\<vitrin(?:ă|a|e)\\>"],
    ["rampa", "\\<ramp(?:ă|a) de (?:încărcare|incarcare)\\>"],
    ["curent", "\\<curent(?:ul)? electric\\>|\\<electricitate\\>"],
    ["canalizare", "\\<canalizare\\>"],
  ];
  const dotari = dot.filter(([, r]) => re(r).test(t)).map(([k]) => k);
  if (dotari.length) c.dotari = dotari;

  // Suprafețe: „suprafață totală de 79,69 mp, din care 73,65 mp utili”, „suprafață utilă 60 mp”.
  const tot = t.match(re(`\\<suprafa(?:ț|ţ|t)(?:ă|a) total(?:ă|a)\\s*(?:de\\s+|:\\s*)?${NUM}\\s*${MP}`)) ?? t.match(re(`${NUM}\\s*${MP}\\s+(?:suprafață |suprafata )?total(?:i|e|ă|a)?\\>`));
  if (tot) c.suprafataTotala = Math.round(numar(tot[1]));
  const ut = t.match(re(`\\<suprafa(?:ț|ţ|t)(?:ă|a) util(?:ă|a)\\s*(?:de\\s+|:\\s*)?${NUM}\\s*${MP}`)) ?? t.match(re(`${NUM}\\s*${MP}\\s+util(?:i|e|ă|a)?\\>`));
  if (ut) c.suprafataUtila = Math.round(numar(ut[1]));
  if (c.suprafataUtila && c.suprafataTotala && c.suprafataUtila > c.suprafataTotala) {
    delete c.suprafataUtila;
    delete c.suprafataTotala;
  }
  return c;
}

/** Un rând din blocul „Caracteristici”; `lista` = valori afișate ca etichete scurte (dotările). */
export type RandCaracteristici = { eticheta: string; valoare: string; lista?: string[] };

/** Rândurile din blocul „Caracteristici”, în ordinea afișării. */
export function randuriCaracteristici(
  a: { tranzactie: string; tip: string; suprafata: number; camere: number | null },
  c: Caracteristici,
  etichete: { tranzactie: string; tip: string },
): RandCaracteristici[] {
  const r: RandCaracteristici[] = [
    { eticheta: "Tranzacție", valoare: etichete.tranzactie },
    { eticheta: "Tip", valoare: etichete.tip },
  ];
  // Suprafața anunțului e cea utilă; doar dacă descrierea dă altă suprafață utilă rămâne „Suprafață”.
  const altaUtila = !!c.suprafataUtila && c.suprafataUtila !== a.suprafata;
  r.push({ eticheta: a.tip === "teren" ? "Suprafață teren" : altaUtila ? "Suprafață" : "Suprafață utilă", valoare: `${a.suprafata} m²` });
  if (altaUtila) r.push({ eticheta: "Suprafață utilă", valoare: `${c.suprafataUtila} m²` });
  if (c.suprafataTotala && c.suprafataTotala !== a.suprafata) r.push({ eticheta: "Suprafață totală", valoare: `${c.suprafataTotala} m²` });
  if (a.camere) r.push({ eticheta: "Camere", valoare: String(a.camere) });
  if (c.compartimentare) r.push({ eticheta: "Compartimentare", valoare: c.compartimentare });
  if (c.bai) r.push({ eticheta: "Băi", valoare: String(c.bai) });
  if (c.etaj) r.push({ eticheta: "Etaj", valoare: c.etaj });
  else if (c.regimInaltime) r.push({ eticheta: "Regim de înălțime", valoare: c.regimInaltime });
  if (c.niveluri) r.push({ eticheta: "Niveluri", valoare: String(c.niveluri) });
  if (c.anConstructie) r.push({ eticheta: "An construcție", valoare: String(c.anConstructie) });
  if (c.stare) r.push({ eticheta: "Stare", valoare: c.stare });
  if (c.balcon) r.push({ eticheta: "Balcon", valoare: c.balcon });
  if (c.incalzire) r.push({ eticheta: "Încălzire", valoare: c.incalzire });
  if (c.mobilare) r.push({ eticheta: "Mobilare", valoare: c.mobilare });
  if (c.aerConditionat) r.push({ eticheta: "Aer condiționat", valoare: c.aerConditionat });
  if (c.clasaEnergetica) r.push({ eticheta: "Clasă energetică", valoare: c.clasaEnergetica });
  if (c.dotari?.length) {
    const lista = c.dotari.map((d) => DOTARI[d]);
    r.push({ eticheta: a.tip === "teren" ? "Utilități" : "Dotări", valoare: lista.join(", "), lista });
  }
  return r;
}

// ---------- Descrierea ----------

export type BlocDescriere = { tip: "p"; text: string } | { tip: "titlu"; text: string } | { tip: "lista"; elemente: string[] };

const MARCAJ = /^\s*(?:[-–—•*·✓✔►▪●]|\d{1,2}[.)])\s+/;
const titlu = (l: string) => l.length <= 60 && /:$/.test(l) && !MARCAJ.test(l);
const element = (l: string, max: number) => l.length <= max && !/[.!?:;]$/.test(l);

/**
 * Împarte descrierea în paragrafe, titluri („Dotări:”) și liste.
 * Liste: rândurile scurte fără punct final de după un titlu, rândurile cu marcaj („- ”, „• ”)
 * sau cel puțin 3 rânduri scurte consecutive fără punct final. Rândurile goale multiple contează ca unul.
 */
export function blocuriDescriere(text: string): BlocDescriere[] {
  const linii = text.replace(/\r\n?/g, "\n").split("\n").map((l) => l.replace(/\s+/g, " ").trim());
  // Rânduri nevide, cu informația dacă înainte a fost un rând gol (separator de paragraf).
  const r: { text: string; gol: boolean }[] = [];
  let gol = false;
  for (const l of linii) {
    if (!l) { gol = true; continue; }
    r.push({ text: l, gol: gol && r.length > 0 });
    gol = false;
  }
  const out: BlocDescriere[] = [];
  let i = 0;
  while (i < r.length) {
    const l = r[i].text;
    // Titlu urmat de elemente.
    if (titlu(l)) {
      let j = i + 1;
      const el: string[] = [];
      while (j < r.length && (MARCAJ.test(r[j].text) || element(r[j].text, 120)) && !titlu(r[j].text)) el.push(r[j++].text.replace(MARCAJ, ""));
      if (el.length) {
        out.push({ tip: "titlu", text: l }, { tip: "lista", elemente: el });
        i = j;
        continue;
      }
    }
    // Rânduri cu marcaj.
    if (MARCAJ.test(l)) {
      const el: string[] = [];
      while (i < r.length && MARCAJ.test(r[i].text)) el.push(r[i++].text.replace(MARCAJ, ""));
      out.push({ tip: "lista", elemente: el });
      continue;
    }
    // Cel puțin 3 rânduri scurte fără punct final.
    let j = i;
    while (j < r.length && element(r[j].text, 80) && !titlu(r[j].text)) j++;
    if (j - i >= 3) {
      out.push({ tip: "lista", elemente: r.slice(i, j).map((x) => x.text) });
      i = j;
      continue;
    }
    // Paragraf: rândurile lipite (fără rând gol între ele).
    const p = [l];
    i++;
    while (i < r.length && !r[i].gol && !MARCAJ.test(r[i].text) && !titlu(r[i].text)) p.push(r[i++].text);
    out.push({ tip: "p", text: p.join("\n") });
  }
  return out;
}
