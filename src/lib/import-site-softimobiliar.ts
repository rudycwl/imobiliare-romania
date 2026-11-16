import { JUDETE } from "@/modules/judete";
import { slugify } from "./etichete";
import { numarFeed, potrivire, TIP, TRANZ, type RandFeed } from "./feed-xml";

// PROBĂ: importul anunțurilor direct de pe site-ul public al unei agenții făcut de Soft Imobiliar
// (același șablon la multe agenții: /apartamente-de-vanzare/iasi-8449/1, anunțuri …-35590.html).
// Folosit doar cu acordul agenției, când nu poate obține linkul de export XML din program.
// Funcțiile de aici nu fac cereri: primesc HTML-ul (descărcarea, ritmul și robots.txt sunt la apelant).
// Rezultatul e același rând ca la feed-ul XML (RandFeed), deci restul fluxului (citesteRand, importaRanduri,
// actualizare, retragere) rămâne cel din src/lib/feeduri.ts.

export const USER_AGENT_SITE = "CheiaMeaBot/1.0 (+https://cheiamea.ro)";

type Eroare = { eroare: string; externId: string };

const ENTITATI: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  icirc: "î", Icirc: "Î", acirc: "â", Acirc: "Â", abreve: "ă", Abreve: "Ă", atilde: "ă", Atilde: "Ă",
  scedil: "ș", Scedil: "Ș", tcedil: "ț", Tcedil: "Ț", scaron: "ș", Scaron: "Ș",
  ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", sbquo: "‚", ldquo: "“", rdquo: "”", bdquo: "„",
  laquo: "«", raquo: "»", hellip: "…", euro: "€", deg: "°", sup2: "²", sup3: "³", middot: "·", bull: "•",
  eacute: "é", egrave: "è", agrave: "à", ouml: "ö", uuml: "ü", auml: "ä", ordm: "º", times: "×", frac12: "½",
};

/** Entitățile HTML → text. Descrierea vine uneori codată de două ori („&amp;icirc;”), deci repetăm cât se schimbă ceva. */
export function decodeaza(s: string): string {
  let t = s;
  for (let i = 0; i < 3; i++) {
    const nou = t.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const cod = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(cod) && cod > 0 && cod < 0x110000 ? String.fromCodePoint(cod) : m;
      }
      return ENTITATI[e] ?? m;
    });
    if (nou === t) break;
    t = nou;
  }
  return t;
}

/** HTML → text simplu: paragrafele și <br> devin rânduri noi. */
function textDinHtml(html: string): string {
  return decodeaza(
    decodeaza(html)
      .replace(/<(br|\/p|\/div|\/li|\/h\d)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const absolut = (href: string, baza: string) => {
  try {
    return new URL(decodeaza(href), baza).toString();
  } catch {
    return "";
  }
};

/** Șablonul are <base href="https://site/">: linkurile relative („apartament-…-123.html”) pornesc de la rădăcină. */
function bazaPagina(html: string, url: string) {
  const b = html.match(/<base\b[^>]*href="([^"]+)"/i)?.[1];
  return b ? absolut(b, url) || url : url;
}

/** Linkurile paginilor de listă din sitemap (doar rădăcinile pe categorii: /apartamente-de-vanzare/iasi-8449/1). */
export function paginiDeListaDinSitemap(xml: string): string[] {
  const out = new Set<string>();
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const u = decodeaza(m[1]);
    try {
      const p = new URL(u).pathname.split("/").filter(Boolean);
      if (p.length === 3 && /-\d+$/.test(p[1]) && p[2] === "1") out.add(u);
    } catch {
      /* link invalid în sitemap */
    }
  }
  return [...out];
}

/** O pagină de listă → linkurile anunțurilor de pe ea și ale celorlalte pagini din aceeași listă (paginare). */
export function listaAnunturi(html: string, urlPagina: string): { anunturi: string[]; pagini: string[] } {
  const anunturi = new Set<string>();
  const pagini = new Set<string>();
  const cale = new URL(urlPagina).pathname.replace(/\/\d+\/?$/, "");
  const baza = bazaPagina(html, urlPagina);
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    const u = absolut(m[1], baza);
    if (!u) continue;
    const url = new URL(u);
    if (url.host !== new URL(urlPagina).host) continue;
    // Anunțurile: …-de-vanzare-…-35590.html; nu paginile de agent („oferte-agent-…-11-1.html”).
    if (/^\/[a-z0-9-]+-\d+\.html$/.test(url.pathname) && !/^\/(oferte-)?agent/.test(url.pathname)) anunturi.add(url.origin + url.pathname);
    else if (url.pathname.replace(/\/\d+\/?$/, "") === cale && /\/\d+\/?$/.test(url.pathname)) pagini.add(url.origin + url.pathname);
  }
  return { anunturi: [...anunturi], pagini: [...pagini] };
}

/** Valoarea de lângă o etichetă din paginile Soft Imobiliar („<span class="label">Zona:</span><span>Copou</span>”). */
function eticheta(html: string, ...nume: string[]): string {
  for (const n of nume) {
    const re = new RegExp(
      `<span[^>]*class="[^"]*label[^"]*"[^>]*>\\s*${n}\\s*:?\\s*</span>\\s*<(?:span|div)[^>]*>([\\s\\S]*?)</(?:span|div)>`,
      "i",
    );
    const m = html.match(re);
    if (m) {
      const v = textDinHtml(m[1]);
      if (v) return v;
    }
  }
  return "";
}

/** Datele structurate (JSON-LD RealEstateListing): prețul și moneda sunt aici cele mai curate. */
function jsonLd(html: string): { price?: string; priceCurrency?: string; name?: string } {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      const lista = Array.isArray(j) ? j : [j];
      for (const x of lista) {
        if (x && typeof x === "object" && x.offers) {
          const o = Array.isArray(x.offers) ? x.offers[0] : x.offers;
          return { price: String(o?.price ?? ""), priceCurrency: String(o?.priceCurrency ?? ""), name: String(x.name ?? "") };
        }
      }
    } catch {
      /* JSON-LD stricat: trecem la HTML */
    }
  }
  return {};
}

/** Județul pentru un oraș, când site-ul nu-l scrie (Soft Imobiliar afișează doar „Zona, Oraș”). */
export function judetPentruOras(oras: string): string {
  const so = slugify(oras).replace(/^(municipiul|orasul|oras)-/, "");
  if (!so) return "";
  const gasite = JUDETE.filter((j) => j.orase.some((o) => o.slug === so || slugify(o.nume) === so));
  // Orașul reședință are același nume cu județul (Iași, Cluj…): îl preferăm când numele apare în mai multe județe.
  const j = gasite.length === 1 ? gasite[0] : gasite.find((x) => x.slug === so || slugify(x.nume).startsWith(so));
  return j?.nume ?? "";
}

export type OptiuniPagina = {
  /** Lei pentru 1 € (prețurile în lei se convertesc, ca la feed-ul XML). */
  cursEuro?: number | null;
  /** Județul agenției, folosit când nu se poate deduce din oraș. */
  judet?: string;
  /** Orașul agenției: localitățile care nu sunt în lista site-ului (sate din jur) devin zone ale lui. */
  oras?: string;
};

/** O pagină de anunț Soft Imobiliar → rând de import (aceleași câmpuri ca feed-ul XML) + codul din program. */
export function anuntDinPagina(html: string, url: string, opt: OptiuniPagina = {}): RandFeed | Eroare {
  const idUrl = url.match(/-(\d+)\.html(?:$|[?#])/)?.[1] ?? "";
  // Codul afișat („ID: 35592”) e cel din programul agenției (același ca în exportul XML); cel din link poate diferi.
  const externId = (eticheta(html, "ID") || html.match(/data-pid="(\d+)"/)?.[1] || idUrl).replace(/\D/g, "").slice(0, 100);
  if (!externId) return { eroare: "pagina nu are cod de anunț", externId: "" };
  if (!/<h1\b/i.test(html) || !/summary-description|single-property/i.test(html)) {
    return { eroare: "pagina nu e un anunț (șablon necunoscut sau anunț retras)", externId };
  }

  const ld = jsonLd(html);
  const titlu = textDinHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || decodeaza(ld.name ?? "");

  // Prețul: JSON-LD, altfel „245,000 EUR” din antet.
  const pretAntet = textDinHtml(html.match(/class="box-price[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
  let pret = numarFeed(ld.price || pretAntet.replace(/[^\d.,]/g, ""));
  const moneda = (ld.priceCurrency || pretAntet.match(/EUR|RON|LEI|€/i)?.[0] || "EUR").toUpperCase();
  if (pret && /RON|LEI/.test(moneda)) {
    if (!opt.cursEuro) return { eroare: "prețul e în lei și cursul euro nu e disponibil acum", externId };
    pret = pret / opt.cursEuro;
  } else if (!/EUR|€/.test(moneda)) return { eroare: `moneda „${moneda}” nu e acceptată (doar EUR sau RON)`, externId };

  // Tranzacția: din link („…-de-vanzare-…”, „…-de-inchiriat-…”), altfel din calea de navigare sau titlu.
  const firimituri = textDinHtml(html.match(/<ul[^>]*BreadcrumbList[\s\S]*?<\/ul>/i)?.[0] ?? "");
  const tranzactie = potrivire(new URL(url).pathname + " " + firimituri + " " + titlu, TRANZ);

  const tipText = eticheta(html, "Tip");
  const caleTip = new URL(url).pathname.split("-de-")[0];
  const tip = potrivire(tipText || caleTip || titlu, TIP);

  const camereText = eticheta(html, "Camere", "Nr\\.? camere");
  let camere = numarFeed(camereText);
  if (!camere && /garsonier|studio/i.test(caleTip + " " + titlu)) camere = 1;
  const sup = numarFeed(
    eticheta(html, "Suprafață utilă", "Suprafata utila", "Suprafata", "Suprafață", "Suprafață teren", "Suprafata teren", "Suprafață totală", "Suprafata totala").replace(/m\s*p|m2|m²/gi, ""),
  );

  // Localizarea: „Tudor Vladimirescu, Iasi” → zona, oraș; județul nu e scris pe pagină.
  const locatie = textDinHtml(html.match(/<div class="label">\s*Locatie\s*<\/div>\s*<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const parti = locatie.split(",").map((s) => s.trim()).filter(Boolean);
  let oras = parti.length ? parti[parti.length - 1] : "";
  let zona = eticheta(html, "Zona") || (parti.length > 1 ? parti.slice(0, -1).join(", ") : "");
  let judet = judetPentruOras(oras);
  // Satele din jurul orașului („Horpaz”) nu sunt în lista de localități: le punem ca zonă a orașului agenției.
  if (!judet && oras && opt.oras) {
    zona = zona || oras;
    oras = opt.oras;
    judet = judetPentruOras(oras);
  }
  judet = judet || opt.judet || "";

  // Pozele: galeria mare (data-fancybox="gallery"), în ordinea din pagină; miniaturile .png din liste nu.
  const poze: string[] = [];
  const baza = bazaPagina(html, url);
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*data-fancybox="gallery"/gi)) {
    const u = absolut(m[1], baza);
    if (/^https:\/\//i.test(u) && /\.(jpe?g|webp)(\?|$)/i.test(u) && !poze.includes(u)) poze.push(u);
    if (poze.length >= 30) break;
  }
  if (!poze.length) {
    const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1];
    if (og && /^https:\/\//i.test(og)) poze.push(decodeaza(og));
  }

  const descriereHtml = html.match(/id="summary-description"[^>]*>([\s\S]*?)<\/div>\s*(?:<a[^>]*see-more|<\/div>)/i)?.[1] ?? "";

  return {
    externId,
    rand: {
      titlu,
      descriere: textDinHtml(descriereHtml),
      tip,
      tranzactie,
      pret: pret ? String(Math.round(pret)) : "",
      suprafata: sup ? String(Math.round(sup)) : "",
      camere: camere ? String(Math.round(camere)) : "",
      judet,
      oras,
      zona,
      poze: poze.join(" "),
      moneda: pret && /RON|LEI/.test(moneda) ? "RON" : "EUR",
    },
  };
}

/** robots.txt: e permisă calea pentru roboții noștri? (grupul „CheiaMeaBot” sau „*”; cea mai lungă regulă câștigă). */
export function robotsPermite(robots: string, cale: string, agent = "CheiaMeaBot"): boolean {
  type Regula = { permis: boolean; cale: string };
  const grupuri: { agenti: string[]; reguli: Regula[] }[] = [];
  let curent: { agenti: string[]; reguli: Regula[] } | null = null;
  for (const linie of robots.split(/\r?\n/)) {
    const [k, ...rest] = linie.replace(/#.*/, "").split(":");
    const v = rest.join(":").trim();
    const cheie = k.trim().toLowerCase();
    if (cheie === "user-agent") {
      if (!curent || curent.reguli.length) grupuri.push((curent = { agenti: [], reguli: [] }));
      curent.agenti.push(v.toLowerCase());
    } else if ((cheie === "allow" || cheie === "disallow") && curent) {
      if (v) curent.reguli.push({ permis: cheie === "allow", cale: v });
    }
  }
  const grup = grupuri.find((g) => g.agenti.some((a) => a !== "*" && agent.toLowerCase().includes(a))) ?? grupuri.find((g) => g.agenti.includes("*"));
  if (!grup) return true;
  const potrivite = grup.reguli.filter((r) => {
    const re = new RegExp("^" + r.cale.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
    return re.test(cale);
  });
  if (!potrivite.length) return true;
  potrivite.sort((a, b) => b.cale.length - a.cale.length || Number(b.permis) - Number(a.permis));
  return potrivite[0].permis;
}
