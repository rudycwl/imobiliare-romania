import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { access, mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

// Pozele stau într-un spațiu de stocare compatibil S3 (Cloudflare R2), nu pe Netlify,
// ca traficul pentru imagini să nu consume traficul inclus în Netlify.
// Variabile: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (token „Admin Read & Write”, ca să poată seta CORS),
// R2_BUCKET, R2_PUBLIC_URL (adresa publică r2.dev a bucket-ului sau un domeniu propriu).

const env = () => ({
  cont: process.env.R2_ACCOUNT_ID ?? "",
  cheie: process.env.R2_ACCESS_KEY_ID ?? "",
  secret: process.env.R2_SECRET_ACCESS_KEY ?? "",
  bucket: process.env.R2_BUCKET ?? "",
  public: (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, ""),
});

// Pe serverul propriu (Oracle) pozele noi stau pe disc, în POZE_DIR, și se servesc de Caddy la /poze/.
// Cheile lor încep cu „local/”; pozele vechi din R2 rămân la adresa lor publică.
const LOCAL = "local/";
const dirLocal = () => process.env.POZE_DIR ?? "";
export const stocareLocala = () => !!dirLocal();
export const r2Configurat = () => Object.values(env()).every(Boolean);

export const stocareConfigurata = () => stocareLocala() || r2Configurat();

export const urlPublic = (cheie: string) => (cheie.startsWith(LOCAL) ? `/poze/${cheie.slice(LOCAL.length)}` : `${env().public}/${cheie}`);

/** Prefixul cheilor noi: „local/” când pozele stau pe disc. */
export const prefixCheie = () => (stocareLocala() ? LOCAL : "");

/** Calea pe disc a unei poze locale; refuză orice cheie care nu are forma generată de cheieNoua. */
export function caleLocala(cheie: string) {
  if (!/^local\/anunturi\/\d+\/[0-9a-f]{16}\.(webp|jpg)$/.test(cheie)) return null;
  return path.join(dirLocal(), cheie.slice(LOCAL.length));
}

const cheieSemnare = () => createHash("sha256").update(`poze:${process.env.DATABASE_URL ?? ""}`).digest();
const semnaturaLocala = (date: string) => createHmac("sha256", cheieSemnare()).update(date).digest("hex");

/** Verifică parametrii semnați din URL-ul de încărcare locală (cheie, tip, mărime, expirare). */
export function verificaIncarcareLocala(q: URLSearchParams) {
  const [c, t, m, e, s] = ["c", "t", "m", "e", "s"].map((k) => q.get(k) ?? "");
  const asteptat = Buffer.from(semnaturaLocala([c, t, m, e].join("|")));
  const primit = Buffer.from(s);
  if (asteptat.length !== primit.length || !timingSafeEqual(asteptat, primit)) return null;
  if (!(Number(e) > Date.now())) return null;
  return { cheie: c, tip: t, marime: Number(m) };
}

export async function salveazaLocal(cheie: string, date: Buffer) {
  const cale = caleLocala(cheie);
  if (!cale) throw new Error("Cheie invalidă");
  await mkdir(path.dirname(cale), { recursive: true });
  await writeFile(cale, date);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const hmac = (k: Buffer | string, s: string) => createHmac("sha256", k).update(s).digest();
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** URL semnat (AWS Signature V4, query string) pentru o operație pe un obiect. */
function urlSemnat(metoda: "PUT" | "DELETE", cheie: string, antete: Record<string, string>, expiraSec = 300) {
  const e = env();
  const host = `${e.cont}.r2.cloudflarestorage.com`;
  const acum = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const zi = acum.slice(0, 8);
  const scope = `${zi}/auto/s3/aws4_request`;
  const toateAntetele: Record<string, string> = { host, ...Object.fromEntries(Object.entries(antete).map(([k, v]) => [k.toLowerCase(), v])) };
  const semnate = Object.keys(toateAntetele).sort();
  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": `${e.cheie}/${scope}`,
    "X-Amz-Date": acum,
    "X-Amz-Expires": String(expiraSec),
    "X-Amz-SignedHeaders": semnate.join(";"),
  };
  const qs = Object.keys(query).sort().map((k) => `${enc(k)}=${enc(query[k])}`).join("&");
  const cale = `/${e.bucket}/${cheie.split("/").map(enc).join("/")}`;
  const canonic = [metoda, cale, qs, semnate.map((k) => `${k}:${toateAntetele[k].trim()}\n`).join(""), semnate.join(";"), "UNSIGNED-PAYLOAD"].join("\n");
  const deSemnat = ["AWS4-HMAC-SHA256", acum, scope, sha256(canonic)].join("\n");
  const kSemnare = hmac(hmac(hmac(hmac(`AWS4${e.secret}`, zi), "auto"), "s3"), "aws4_request");
  const semnatura = createHmac("sha256", kSemnare).update(deSemnat).digest("hex");
  return `https://${host}${cale}?${qs}&X-Amz-Signature=${semnatura}`;
}

/** URL prin care browserul încarcă direct poza; tipul și mărimea sunt semnate, deci nu pot fi schimbate. */
export function urlIncarcare(cheie: string, tip: string, marime: number) {
  if (cheie.startsWith(LOCAL)) {
    const date = [cheie, tip, String(marime), String(Date.now() + 300_000)];
    const q = new URLSearchParams({ c: date[0], t: date[1], m: date[2], e: date[3], s: semnaturaLocala(date.join("|")) });
    return `/api/poze?${q}`;
  }
  return urlSemnat("PUT", cheie, { "content-type": tip, "content-length": String(marime) });
}

export async function stergeObiect(cheie: string) {
  if (cheie.startsWith(LOCAL)) {
    const cale = caleLocala(cheie);
    if (cale) await unlink(cale).catch((e) => { if (e.code !== "ENOENT") throw e; });
    return;
  }
  if (!r2Configurat()) return;
  const r = await fetch(urlSemnat("DELETE", cheie, {}), { method: "DELETE", signal: AbortSignal.timeout(10000) });
  if (!r.ok && r.status !== 404) throw new Error(`Ștergerea pozei a eșuat: ${r.status}`);
}

/** Copia de rezervă a unei poze de pe disc în R2 (vezi src/lib/copie-poze.ts). */
export async function puneInR2(cheie: string, date: Buffer, tip: string) {
  const r = await fetch(urlSemnat("PUT", cheie, { "content-type": tip }), {
    method: "PUT",
    headers: { "content-type": tip },
    body: new Uint8Array(date),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`Copierea în R2 a eșuat: ${r.status}`);
}

/** Verifică că poza chiar a ajuns în stocare înainte s-o legăm de anunț. */
export async function exista(cheie: string) {
  if (cheie.startsWith(LOCAL)) {
    const cale = caleLocala(cheie);
    return !!cale && (await access(cale).then(() => true, () => false));
  }
  const r = await fetch(urlPublic(cheie), { method: "HEAD", signal: AbortSignal.timeout(10000) });
  return r.ok;
}

/** Cerere semnată (AWS Signature V4, antet Authorization) la nivel de bucket, ex. ?cors. */
async function cerereBucket(metoda: "PUT" | "GET", subresursa: string, corp = "") {
  const e = env();
  const host = `${e.cont}.r2.cloudflarestorage.com`;
  const acum = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const zi = acum.slice(0, 8);
  const scope = `${zi}/auto/s3/aws4_request`;
  const hashCorp = sha256(corp);
  const antete: Record<string, string> = { host, "x-amz-content-sha256": hashCorp, "x-amz-date": acum };
  if (corp) antete["content-md5"] = createHash("md5").update(corp).digest("base64");
  const semnate = Object.keys(antete).sort();
  const canonic = [metoda, `/${e.bucket}`, `${subresursa}=`, semnate.map((k) => `${k}:${antete[k]}\n`).join(""), semnate.join(";"), hashCorp].join("\n");
  const deSemnat = ["AWS4-HMAC-SHA256", acum, scope, sha256(canonic)].join("\n");
  const kSemnare = hmac(hmac(hmac(hmac(`AWS4${e.secret}`, zi), "auto"), "s3"), "aws4_request");
  const semnatura = createHmac("sha256", kSemnare).update(deSemnat).digest("hex");
  const trimise = Object.fromEntries(Object.entries(antete).filter(([k]) => k !== "host"));
  return fetch(`https://${host}/${e.bucket}?${subresursa}=`, {
    method: metoda,
    headers: { ...trimise, Authorization: `AWS4-HMAC-SHA256 Credential=${e.cheie}/${scope}, SignedHeaders=${semnate.join(";")}, Signature=${semnatura}` },
    body: corp || undefined,
    signal: AbortSignal.timeout(10000),
  });
}

let corsSetat: Promise<void> | null = null;

/**
 * Permite browserului să încarce poze direct în bucket doar de pe site-ul nostru (CORS).
 * Se setează automat la prima încărcare, ca să nu trebuiască configurat de mână în Cloudflare.
 */
export function asiguraCors() {
  if (stocareLocala()) return Promise.resolve();
  corsSetat ??= (async () => {
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro").replace(/\/$/, "");
    const origini = [...new Set([site, "https://cheiamea.ro", "https://nou.cheiamea.ro", "https://www.cheiamea.ro", "https://cheiamea.com", "https://www.cheiamea.com"])];
    const xml =
      `<CORSConfiguration><CORSRule>${origini.map((o) => `<AllowedOrigin>${o}</AllowedOrigin>`).join("")}` +
      `<AllowedMethod>PUT</AllowedMethod><AllowedMethod>GET</AllowedMethod><AllowedHeader>content-type</AllowedHeader>` +
      `<MaxAgeSeconds>86400</MaxAgeSeconds></CORSRule></CORSConfiguration>`;
    const r = await cerereBucket("PUT", "cors", xml);
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 300)}`);
  })().catch((e) => {
    // Nu blocăm încărcarea: dacă regula există deja (pusă de mână), pozele merg oricum.
    corsSetat = null;
    console.error("R2 CORS:", (e as Error).message);
  });
  return corsSetat;
}
