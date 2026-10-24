// Pagina /configurare: aici se pun variabilele secrete (DATABASE_URL, chei) direct pe server, nu în chat.
// Protejată de codul din /etc/cheiamea/cod. Rulează ca root doar pe 127.0.0.1:3001, în spatele Caddy (HTTPS).
import { createServer } from "node:http";
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import { execFile, execFileSync } from "node:child_process";
import { contR2, pazesteSite, stareServicii, verificaServiciile } from "./servicii.mjs";

const ENV = "/etc/cheiamea/env.json";
const COD = readFileSync("/etc/cheiamea/cod", "utf8").trim();

// secret: valoarea nu se mai afișează după salvare. Ordinea e cea din formular.
const CAMPURI = [
  { grup: "Baza de date (Neon)" },
  { k: "DATABASE_URL", secret: true, ajutor: "Neon → proiectul cheiamea → Connect → oprește „Connection pooling” → copiază textul care începe cu postgresql://" },
  { grup: "Site" },
  { k: "NEXT_PUBLIC_SITE_URL", implicit: "https://cheiamea.ro", ajutor: "Lasă așa." },
  { k: "ADMIN_EMAILS", ajutor: "Emailul cu care intri în contul tău de pe CheiaMea (pentru Moderare)." },
  { grup: "Copia de rezervă a pozelor (Cloudflare R2)" },
  { k: "R2_ACCOUNT_ID", ajutor: "Cloudflare → R2 → în dreapta, „Account ID”. Merge și adresa S3 (https://….r2.cloudflarestorage.com) copiată de la token." },
  { k: "R2_ACCESS_KEY_ID", secret: true, ajutor: "Cloudflare → R2 → Manage API tokens → token nou „Admin Read & Write” → Access Key ID." },
  { k: "R2_SECRET_ACCESS_KEY", secret: true, ajutor: "Din același token: Secret Access Key." },
  { k: "R2_BUCKET", implicit: "cheiamea-poze", ajutor: "Lasă așa." },
  { k: "R2_PUBLIC_URL", implicit: "https://pub-0a71b9f8884b494e8621ec7743fecb70.r2.dev", ajutor: "Lasă așa." },
  { grup: "Plăți (NETOPIA)" },
  { k: "NETOPIA_LIVE", ajutor: "Scrie „da” doar după ce NETOPIA a aprobat cardul. Gol = plăți de test (sandbox), cu cheile SANDBOX de mai jos." },
  { k: "NETOPIA_POS_SIGNATURE", ajutor: "NETOPIA → Punctul de vânzare CheiaMea → Setări tehnice → semnătura (POS signature)." },
  { k: "NETOPIA_API_KEY", secret: true, ajutor: "NETOPIA → Profil → Securitate → cheia API (live sau sandbox, la fel ca NETOPIA_LIVE)." },
  { k: "NETOPIA_PUBLIC_KEY", lung: true, ajutor: "NETOPIA → Setări tehnice → descarcă cheia publică (.cer) și lipește tot textul." },
  { k: "NETOPIA_SANDBOX_POS_SIGNATURE", ajutor: "Pentru modul de test: sandbox.netopia-payments.com → Punctul de vânzare CheiaMea → Setări tehnice → semnătura." },
  { k: "NETOPIA_SANDBOX_API_KEY", secret: true, ajutor: "Pentru modul de test: sandbox.netopia-payments.com → Profil → Securitate → cheia API." },
  { grup: "Facturare (Oblio)" },
  { k: "OBLIO_EMAIL", ajutor: "Emailul contului Oblio." },
  { k: "OBLIO_SECRET", secret: true, ajutor: "Oblio → Setări → Date cont → API secret." },
  { k: "FACTURARE_CIF", implicit: "39409800", ajutor: "CUI-ul Hugetech." },
  { k: "FACTURARE_SERIE", implicit: "CHM" },
  { k: "FACTURARE_PLATITOR_TVA", ajutor: "Scrie „da” doar dacă Hugetech e plătitoare de TVA." },
  { k: "FACTURARE_COTA_TVA", implicit: "21" },
  { grup: "Emailuri trimise de site (Brevo)" },
  { k: "BREVO_API_KEY", secret: true, ajutor: "Brevo → numele tău (sus, dreapta) → SMTP & API → API Keys → Generate a new API key. Fără ea, „Am uitat parola” și alertele pe email nu merg." },
  { k: "EMAIL_EXPEDITOR", implicit: "noreply@cheiamea.ro", ajutor: "Lasă așa. Domeniul cheiamea.ro trebuie verificat în Brevo (Senders, Domains & Dedicated IPs → Domains)." },
  { k: "NETLIFY_TOKEN", secret: true, ajutor: "Opțional: app.netlify.com/user/applications → Personal access tokens → New access token. Cu el, site-ul își pune singur rândurile DNS (Brevo, cheiamea.com)." },
  { grup: "ERP Hugetech" },
  { k: "ERP_KEY", secret: true, ajutor: "Render → hugetech-erp → Environment → valoarea CHEIAMEA_ERP_KEY." },
];
const VALID = {
  DATABASE_URL: (v) => /^postgres(ql)?:\/\/\S+$/.test(v),
  NETOPIA_LIVE: (v) => v === "da",
  NEXT_PUBLIC_SITE_URL: (v) => /^https:\/\//.test(v),
};
const CHEI = new Set(CAMPURI.filter((c) => c.k).map((c) => c.k));

const citesteEnv = () => (existsSync(ENV) ? JSON.parse(readFileSync(ENV, "utf8")) : {});
function scrieEnv(env) {
  writeFileSync(ENV + ".nou", JSON.stringify(env, null, 2), { mode: 0o640 });
  execFileSync("chown", ["root:cheiamea", ENV + ".nou"]);
  renameSync(ENV + ".nou", ENV);
}
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const codBun = (c) => {
  const a = Buffer.from(String(c ?? "")), b = Buffer.from(COD);
  return a.length === b.length && timingSafeEqual(a, b);
};
const citeste = (f) => { try { return readFileSync(f, "utf8").trim(); } catch { return null; } };
const stare = () => {
  try { return JSON.parse(readFileSync("/opt/cheiamea/stare.json", "utf8")); } catch { return { stare: "necunoscut" }; }
};
/** Starea publică: versiunea, când a verificat ultima dată main, ultima eroare și serviciile externe (fără chei). */
const starePublica = () => ({
  ...stare(),
  verificatMain: citeste("/opt/cheiamea/verificat"),
  ultimaEroare: citeste("/opt/cheiamea/ultima-eroare"),
  servicii: stareServicii(),
});

const verifica = () => verificaServiciile(citesteEnv()).catch((e) => console.error("Servicii:", e));
setTimeout(verifica, 15_000);
setInterval(verifica, 10 * 60_000);
// Paza site-ului: un email adminilor dacă nu răspunde 5 minute la rând.
setInterval(() => pazesteSite(citesteEnv()).catch((e) => console.error("Paza:", e)), 60_000);
// Paza: dacă timerul de actualizare se oprește, pornim noi verificarea lui main (flock-ul din script evită dublurile).
setInterval(() => execFile("systemctl", ["start", "--no-block", "cheiamea-actualizare.service"], () => {}), 3 * 60_000);
const TEXT_STARE = {
  "asteapta-configurare": "Aștept datele de mai jos (cel puțin DATABASE_URL).",
  construieste: "Se construiește site-ul (3–10 minute). Reîncarcă pagina mai târziu.",
  gata: "Site-ul merge.",
  eroare: "Build-ul a eșuat. Vezi jurnalul de mai jos.",
};

function pagina(env, mesaj) {
  const s = stare();
  let jurnal = "";
  try { jurnal = readFileSync("/opt/cheiamea/ultimul-build.log", "utf8").split("\n").slice(-40).join("\n"); } catch {}
  const campuri = CAMPURI.map((c) => {
    if (c.grup) return `<h2>${esc(c.grup)}</h2>`;
    const are = !!env[c.k];
    const val = c.secret ? "" : env[c.k] ?? c.implicit ?? "";
    const ph = c.secret && are ? "salvat; lasă gol ca să rămână" : "";
    const intrare = c.lung
      ? `<textarea name="${c.k}" rows="4" placeholder="${ph}">${esc(val)}</textarea>`
      // Câmpurile secrete nu sunt type="password": browserul ar pune singur în ele parola salvată pentru cheiamea.ro.
      : `<input name="${c.k}" type="text"${c.secret ? ' class="secret"' : ""} value="${esc(val)}" placeholder="${ph}" autocomplete="off" spellcheck="false" data-lpignore="true" data-1p-ignore>`;
    return `<label><b>${c.k}</b>${are ? " ✓" : ""}${intrare}${c.ajutor ? `<small>${esc(c.ajutor)}</small>` : ""}</label>`;
  }).join("\n");
  return `<!doctype html><html lang="ro"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Configurare CheiaMea</title>
<style>body{font:16px system-ui,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#1b2a41}
label{display:block;margin:14px 0}input,textarea{display:block;width:100%;box-sizing:border-box;padding:8px;margin-top:4px;font:inherit}
.secret{-webkit-text-security:disc}small{color:#555}h2{margin-top:28px;border-bottom:1px solid #ddd}button{background:#f28c28;color:#fff;border:0;padding:12px 24px;font-size:17px;border-radius:6px;cursor:pointer}
.stare{background:#eef4fb;padding:12px;border-radius:6px}.ok{background:#e7f6e7;padding:12px;border-radius:6px}pre{background:#f4f4f4;padding:8px;overflow:auto;font-size:12px}</style>
<h1>Configurare CheiaMea</h1>
${mesaj ? `<p class="ok">${esc(mesaj)}</p>` : ""}
<p class="stare"><b>Stare:</b> ${esc(TEXT_STARE[s.stare] ?? s.stare)} ${s.versiune ? `(versiunea ${esc(s.versiune)})` : ""}</p>
<pre>${esc(JSON.stringify(stareServicii(), null, 2))}</pre>
<form method="post" action="/configurare">
<input type="hidden" name="cod" value="${esc(COD)}">
${campuri}
<p><button>Salvează și pornește site-ul</button></p>
</form>
${jurnal ? `<h2>Jurnal build</h2><pre>${esc(jurnal)}</pre>` : ""}
</html>`;
}

function trimite(res, cod, corp, tip = "text/html; charset=utf-8") {
  res.writeHead(cod, { "Content-Type": tip, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  res.end(corp);
}

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/configurare/stare") return trimite(res, 200, JSON.stringify(starePublica()), "application/json");
  if (url.pathname !== "/configurare") return trimite(res, 404, "Nu există.");

  if (req.method === "GET") {
    if (!codBun(url.searchParams.get("cod"))) return setTimeout(() => trimite(res, 403, "Cod greșit."), 1000);
    return trimite(res, 200, pagina(citesteEnv(), url.searchParams.get("salvat") ? "Am salvat. Site-ul se construiește acum." : ""));
  }
  if (req.method !== "POST") return trimite(res, 405, "");
  let corp = "";
  req.on("data", (b) => { corp += b; if (corp.length > 200_000) req.destroy(); });
  req.on("end", () => {
    const f = new URLSearchParams(corp);
    if (!codBun(f.get("cod"))) return setTimeout(() => trimite(res, 403, "Cod greșit."), 1000);
    const env = citesteEnv();
    for (const [k, v] of f) {
      if (!CHEI.has(k)) continue;
      let val = v.replace(/\r\n/g, "\n").trim();
      if (k === "R2_ACCOUNT_ID" && val) val = contR2(val);
      const camp = CAMPURI.find((c) => c.k === k);
      // O valoare care nu poate fi bună nu o înlocuiește pe cea veche (de ex. o parolă completată de browser).
      if (VALID[k] && val && !VALID[k](val)) continue;
      if (val) env[k] = val;
      else if (!camp.secret) delete env[k];
    }
    scrieEnv(env);
    writeFileSync("/opt/cheiamea/forteaza", "");
    execFile("systemctl", ["start", "--no-block", "cheiamea-actualizare.service"], () => {});
    setTimeout(verifica, 3000);
    res.writeHead(303, { Location: `/configurare?cod=${encodeURIComponent(COD)}&salvat=1` });
    res.end();
  });
}).listen(3001, "127.0.0.1");
