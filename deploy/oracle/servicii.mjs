// Verifică singur serviciile externe (Brevo, Cloudflare R2) cu cheile din /etc/cheiamea/env.json și duce
// configurarea emailurilor cât se poate fără butoane: adaugă domeniul în Brevo, cere verificarea, creează
// expeditorul și trimite un singur email de test. Rândurile DNS nu le schimbă singur: le pune adminul
// din /admin/email („Pune rândurile în Netlify DNS”).
// Rezultatul (fără nicio cheie) apare public în /configurare/stare, ca să poată fi verificat de oriunde.
import { createHash, createHmac } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const TEST_TRIMIS = "/etc/cheiamea/email-test-trimis";

async function cerere(url, { metoda = "GET", antete = {}, corp } = {}) {
  try {
    const r = await fetch(url, {
      method: metoda,
      headers: { accept: "application/json", ...(corp === undefined ? {} : { "content-type": "application/json" }), ...antete },
      body: corp === undefined ? undefined : typeof corp === "string" ? corp : JSON.stringify(corp),
      signal: AbortSignal.timeout(20000),
    });
    const text = await r.text();
    let date = {};
    try { date = text ? JSON.parse(text) : {}; } catch { date = { message: text.slice(0, 300) }; }
    return { ok: r.ok, status: r.status, date, text };
  } catch (e) {
    return { ok: false, status: 0, date: { message: String(e?.message ?? e) }, text: "" };
  }
}

const mesaj = (r) => String(r.date?.message ?? r.date?.code ?? `HTTP ${r.status}`).slice(0, 300);

// ---------- Brevo ----------

async function brevo(env, metoda, cale, corp) {
  return cerere(`https://api.brevo.com/v3${cale}`, { metoda, corp, antete: { "api-key": env.BREVO_API_KEY } });
}

async function email(env) {
  if (!env.BREVO_API_KEY) return { stare: "lipseste-cheia" };
  const expeditor = (env.EMAIL_EXPEDITOR || "noreply@cheiamea.ro").trim().toLowerCase();
  const domeniu = expeditor.split("@")[1];
  const cont = await brevo(env, "GET", "/account");
  // Cel mai des: „unrecognised IP address” (Brevo → Settings → Security → Authorized IPs).
  if (!cont.ok) return { stare: "cheie-refuzata", mesaj: mesaj(cont) };

  let d = await brevo(env, "GET", `/senders/domains/${domeniu}`);
  if (!d.ok && d.status === 404) {
    const p = await brevo(env, "POST", "/senders/domains", { name: domeniu });
    if (!p.ok) return { stare: "domeniu-refuzat", mesaj: mesaj(p) };
    d = await brevo(env, "GET", `/senders/domains/${domeniu}`);
  }
  if (!d.ok) return { stare: "domeniu-necitit", mesaj: mesaj(d) };

  const randuri = Object.values(d.date?.dns_records ?? {}).filter((r) => r?.type && r?.value);
  const lista = () => randuri.map((r) => ({ tip: r.type, nume: r.host_name, gasit: !!r.status }));
  if (!(d.date?.authenticated && d.date?.verified)) {
    await brevo(env, "PUT", `/senders/domains/${domeniu}/authenticate`);
    d = await brevo(env, "GET", `/senders/domains/${domeniu}`);
    if (d.ok) randuri.splice(0, randuri.length, ...Object.values(d.date?.dns_records ?? {}).filter((r) => r?.type && r?.value));
  }
  const gata = !!(d.date?.authenticated && d.date?.verified);
  if (!gata) return { stare: "astept-dns", domeniu, randuri: lista() };

  const s = await brevo(env, "GET", "/senders");
  if (!(s.date?.senders ?? []).some((x) => String(x.email).toLowerCase() === expeditor)) {
    await brevo(env, "POST", "/senders", { name: "CheiaMea", email: expeditor });
  }
  // Un singur email de test, la primul admin, ca proprietarul să vadă că merge.
  const admin = String(env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (admin && !existsSync(TEST_TRIMIS)) {
    const t = await brevo(env, "POST", "/smtp/email", {
      sender: { name: "CheiaMea", email: expeditor },
      to: [{ email: admin }],
      subject: "CheiaMea: emailurile site-ului merg",
      textContent: "Bună,\n\nDacă citești asta, site-ul CheiaMea poate trimite emailuri: „Am uitat parola” și alertele pentru căutările salvate funcționează.\n\nEchipa CheiaMea",
    });
    if (t.ok) writeFileSync(TEST_TRIMIS, new Date().toISOString());
    else return { stare: "test-esuat", domeniu, mesaj: mesaj(t) };
  }
  return { stare: "gata", domeniu, testTrimis: existsSync(TEST_TRIMIS) ? readFileSync(TEST_TRIMIS, "utf8").trim() : null };
}

// ---------- Cloudflare R2 (semnătură S3 v4, doar o listare de 1 obiect) ----------

const sha = (s) => createHash("sha256").update(s).digest("hex");
const hmac = (k, s) => createHmac("sha256", k).update(s).digest();

/** Acceptă atât ID-ul contului, cât și adresa S3 (https://<id>.r2.cloudflarestorage.com) copiată din Cloudflare. */
export const contR2 = (v) => String(v ?? "").trim().replace(/^https?:\/\//, "").split(".")[0].split("/")[0];

async function r2(env) {
  const cont = contR2(env.R2_ACCOUNT_ID);
  if (!cont || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return { stare: "lipsesc-cheile" };
  const bucket = env.R2_BUCKET || "cheiamea-poze";
  const host = `${cont}.r2.cloudflarestorage.com`;
  const acum = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const zi = acum.slice(0, 8);
  const qs = "list-type=2&max-keys=1";
  const antete = `host:${host}\nx-amz-content-sha256:${sha("")}\nx-amz-date:${acum}\n`;
  const semnate = "host;x-amz-content-sha256;x-amz-date";
  const canonic = ["GET", `/${bucket}`, qs, antete, semnate, sha("")].join("\n");
  const scop = `${zi}/auto/s3/aws4_request`;
  const deSemnat = ["AWS4-HMAC-SHA256", acum, scop, sha(canonic)].join("\n");
  const k = hmac(hmac(hmac(hmac(`AWS4${env.R2_SECRET_ACCESS_KEY}`, zi), "auto"), "s3"), "aws4_request");
  const r = await cerere(`https://${host}/${bucket}?${qs}`, {
    antete: {
      "x-amz-date": acum,
      "x-amz-content-sha256": sha(""),
      authorization: `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${scop}, SignedHeaders=${semnate}, Signature=${createHmac("sha256", k).update(deSemnat).digest("hex")}`,
    },
  });
  if (r.ok) return { stare: "gata" };
  return { stare: "chei-refuzate", mesaj: (r.text.match(/<Message>([^<]*)/)?.[1] ?? mesaj(r)).slice(0, 200) };
}

// ---------- ciclul ----------

let ultima = { verificat: null };

export async function verificaServiciile(env) {
  const [e, r] = await Promise.all([email(env).catch((x) => ({ stare: "eroare", mesaj: String(x) })), r2(env).catch((x) => ({ stare: "eroare", mesaj: String(x) }))]);
  ultima = { verificat: new Date().toISOString(), email: e, r2: r, netlifyToken: !!env.NETLIFY_TOKEN };
  return ultima;
}

export const stareServicii = () => ultima;
