import "server-only";
import { createHash, createHmac } from "crypto";

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

export const stocareConfigurata = () => Object.values(env()).every(Boolean);

export const urlPublic = (cheie: string) => `${env().public}/${cheie}`;

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
  return urlSemnat("PUT", cheie, { "content-type": tip, "content-length": String(marime) });
}

export async function stergeObiect(cheie: string) {
  const r = await fetch(urlSemnat("DELETE", cheie, {}), { method: "DELETE", signal: AbortSignal.timeout(10000) });
  if (!r.ok && r.status !== 404) throw new Error(`Ștergerea pozei a eșuat: ${r.status}`);
}

/** Verifică că poza chiar a ajuns în stocare înainte s-o legăm de anunț. */
export async function exista(cheie: string) {
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
  corsSetat ??= (async () => {
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro").replace(/\/$/, "");
    const origini = [...new Set([site, "https://cheiamea.ro", "https://www.cheiamea.ro", "https://cheiamea.com", "https://www.cheiamea.com"])];
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
