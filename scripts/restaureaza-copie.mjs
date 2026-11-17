// Umple baza de date locală (PostgreSQL de pe serverul Oracle) cu datele CheiaMea.
// Două surse, alese explicit cu --mod:
//   neon:  baza veche (Neon), dacă răspunde repede: citire într-o tranzacție READ ONLY (nu scrie nimic acolo);
//   copie: cea mai nouă copie de rezervă JSON gz din COPII_DIR (baza-AAAA-LL-ZZ.json.gz, făcută de src/lib/copie-baza.ts),
//          iar dacă nu e niciuna pe disc, cea mai nouă din Cloudflare R2 (copie/baza/).
// Toate inserările se fac într-o singură tranzacție pe baza țintă: ori intră tot, ori nimic.
// Tabelele se inserează în ordinea dependențelor (din Prisma DMMF), rândurile care se referă la același tabel
// (recomandări, stornări) după rândul la care se referă; secvențele (autoincrement) se pun după maxim.
// La sfârșit numărul de rânduri din fiecare tabel trebuie să fie egal cu cel din sursă, altfel se anulează tot.
//
// Rulare (ca utilizatorul cheiamea, din folderul aplicației, după `npm ci` și `prisma migrate deploy` pe baza țintă):
//   TINTA_DATABASE_URL=postgresql://… node scripts/restaureaza-copie.mjs --mod neon|copie [--copie fisier.json.gz] [--raport raport.json]
// Adresa bazei vechi se citește din ENV_FILE (implicit /etc/cheiamea/env.json): NEON_DATABASE_URL sau DATABASE_URL.
// Nicio parolă nu se scrie în jurnal sau în raport.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { Prisma, PrismaClient } from "@prisma/client";

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const are = (n) => process.argv.includes(n);
const jurnal = (...m) => console.log(new Date().toISOString(), ...m);

export const MODELE = Prisma.dmmf.datamodel.models;
const delegat = (m) => m.name[0].toLowerCase() + m.name.slice(1);
const tabel = (m) => `"${(m.dbName ?? m.name).replace(/"/g, '""')}"`;
const coloana = (f) => `"${(f.dbName ?? f.name).replace(/"/g, '""')}"`;

/** Adresa fără parolă, pentru jurnal. */
export const faraParola = (url) => {
  try { const u = new URL(url); return `${u.protocol}//${u.username ? `${u.username}@` : ""}${u.host}${u.pathname}`; } catch { return "(adresă invalidă)"; }
};
const esteLocala = (url) => { try { return ["127.0.0.1", "localhost", "::1", "[::1]"].includes(new URL(url).hostname); } catch { return false; } };

const json = (v) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));

/** Ordinea de inserare: un model vine după modelele la care are chei străine (fără cele către el însuși). */
export function ordineModele(modele = MODELE) {
  const dupa = new Map(modele.map((m) => [m.name, new Set(
    m.fields.filter((f) => f.kind === "object" && f.relationFromFields?.length && f.type !== m.name).map((f) => f.type),
  )]));
  const rezultat = [], vazut = new Set(), inLucru = new Set();
  const viziteaza = (n) => {
    if (vazut.has(n)) return;
    if (inLucru.has(n)) throw new Error(`Dependență circulară între tabele la ${n}`);
    inLucru.add(n);
    for (const d of dupa.get(n) ?? []) viziteaza(d);
    inLucru.delete(n); vazut.add(n);
    rezultat.push(modele.find((m) => m.name === n));
  };
  for (const m of modele) viziteaza(m.name);
  return rezultat;
}

/** Rândurile unui tabel care se referă la el însuși (recomandări, stornări), ordonate: întâi cel la care se referă. */
export function ordineRanduri(m, randuri) {
  const auto = m.fields.filter((f) => f.kind === "object" && f.relationFromFields?.length && f.type === m.name);
  if (!auto.length) return randuri;
  const cheie = (r, campuri) => `${campuri.join(",")}=${json(campuri.map((c) => r[c]))}`;
  const pus = new Set(), rezultat = [];
  let ramase = randuri;
  while (ramase.length) {
    const amanate = [];
    for (const r of ramase) {
      const gata = auto.every((f) => {
        if (f.relationFromFields.some((c) => r[c] === null || r[c] === undefined)) return true;
        const ref = `${f.relationToFields.join(",")}=${json(f.relationFromFields.map((c) => r[c]))}`;
        return pus.has(ref) || ref === cheie(r, f.relationToFields);
      });
      if (!gata) { amanate.push(r); continue; }
      rezultat.push(r);
      for (const f of auto) pus.add(cheie(r, f.relationToFields));
    }
    if (amanate.length === ramase.length) {
      // Referințe către rânduri care lipsesc: le punem la sfârșit; cheia străină refuză inserarea
      // și toată tranzacția se anulează (nu inventăm date).
      rezultat.push(...amanate);
      break;
    }
    ramase = amanate;
  }
  return rezultat;
}

/** Transformă un rând din JSON (date ca text, bigint ca text) în valorile pe care le acceptă Prisma. */
export function convertesteRand(m, r, ignorate) {
  const out = {};
  for (const [k, v] of Object.entries(r)) {
    const f = m.fields.find((x) => x.name === k);
    if (!f || (f.kind !== "scalar" && f.kind !== "enum")) { ignorate.add(`${m.name}.${k}`); continue; }
    out[k] = convertesteValoare(f, v);
  }
  return out;
}

function convertesteValoare(f, v) {
  if (v === undefined) return undefined;
  if (f.type === "Json") return v === null ? Prisma.DbNull : v;
  if (v === null) return null;
  if (f.isList) return v.map((x) => convertesteValoare({ ...f, isList: false }, x));
  switch (f.type) {
    case "DateTime": {
      const d = v instanceof Date ? v : new Date(v);
      if (Number.isNaN(d.getTime())) throw new Error(`Dată invalidă în ${f.name}`);
      return d;
    }
    case "BigInt": return BigInt(v);
    case "Decimal": return typeof v === "object" ? String(v) : v;
    case "Bytes": {
      if (typeof v === "string") return Buffer.from(v, "base64");
      if (v?.type === "Buffer" && Array.isArray(v.data)) return Buffer.from(v.data);
      if (typeof v === "object") return Buffer.from(Object.keys(v).sort((a, b) => a - b).map((k) => v[k]));
      return v;
    }
    case "Int": case "Float": return typeof v === "string" ? Number(v) : v;
    default: return v;
  }
}

// ---------- surse ----------

const RE_COPIE = /^baza-\d{4}-\d{2}-\d{2}\.json\.gz$/;

function citesteEnv() {
  const f = process.env.ENV_FILE || "/etc/cheiamea/env.json";
  try { return JSON.parse(readFileSync(f, "utf8")); } catch { return {}; }
}

/** Citește toate tabelele din baza veche, doar citire, cu limită de timp (Neon oprit = renunțăm repede). */
async function dinNeon(url, limitaMs, doarSonda = false) {
  const u = new URL(url);
  u.searchParams.set("connect_timeout", "10");
  u.searchParams.set("pool_timeout", "10");
  const sursa = new PrismaClient({ datasourceUrl: u.toString() });
  const cuLimita = (p, ms, ce) => Promise.race([p, new Promise((_, nu) => setTimeout(() => nu(new Error(`${ce}: fără răspuns în ${ms / 1000} s`)), ms).unref())]);
  try {
    await cuLimita(sursa.$queryRawUnsafe("SELECT 1"), limitaMs, "conectare");
    if (doarSonda) return null;
    const tabele = await cuLimita(sursa.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      const t = {};
      for (const m of MODELE) t[m.name] = await tx[delegat(m)].findMany();
      return t;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 10 * 60_000, maxWait: 30_000 }), 12 * 60_000, "citire");
    // Aceeași formă ca o copie de rezervă (JSON), ca restaurarea să fie una singură.
    return JSON.parse(json({ cand: new Date().toISOString(), tabele }));
  } finally {
    await sursa.$disconnect().catch(() => {});
  }
}

function copieDePeDisc(dir) {
  if (!dir || !existsSync(dir)) return null;
  const f = readdirSync(dir).filter((x) => RE_COPIE.test(x)).sort().at(-1);
  return f ? path.join(dir, f) : null;
}

async function copieDinR2(env, dirLucru) {
  const { cerereR2 } = await import("../deploy/oracle/servicii.mjs");
  const lista = await cerereR2(env, "GET", "", { "list-type": "2", prefix: "copie/baza/baza-", "max-keys": "1000" });
  if (!lista.ok) throw new Error(`R2 listare: HTTP ${lista.status}`);
  const chei = [...lista.text.matchAll(/<Key>([^<]+)<\/Key>/g)].map((x) => x[1]).filter((k) => RE_COPIE.test(path.basename(k))).sort();
  const cheie = chei.at(-1);
  if (!cheie) return null;
  const r = await cerereR2(env, "GET", cheie);
  if (!r.ok) throw new Error(`R2 descărcare ${cheie}: HTTP ${r.status}`);
  const f = path.join(dirLucru, path.basename(cheie));
  writeFileSync(f, r.buffer, { mode: 0o600 });
  return f;
}

const citesteCopie = (f) => JSON.parse(gunzipSync(readFileSync(f)).toString("utf8"));

// ---------- restaurare ----------

/** Inserează copia în baza țintă, într-o singură tranzacție. Întoarce numărul de rânduri pe tabel. */
export async function restaureaza(tinta, copie, { golesteDacaAreDate = false } = {}) {
  if (!copie?.tabele || typeof copie.tabele !== "object") throw new Error("Copia nu are câmpul „tabele”");
  const necunoscute = Object.keys(copie.tabele).filter((t) => !MODELE.some((m) => m.name === t));
  if (necunoscute.length) jurnal(`Atenție: tabele din copie care nu mai există în schemă (ignorate): ${necunoscute.join(", ")}`);
  const ignorate = new Set();
  const asteptat = {};
  const rez = await tinta.$transaction(async (tx) => {
    // Baza țintă trebuie să fie goală: nu suprascriem date fără să știm.
    const existente = {};
    for (const m of MODELE) existente[m.name] = await tx[delegat(m)].count();
    const total = Object.values(existente).reduce((a, b) => a + b, 0);
    if (total > 0) {
      if (!golesteDacaAreDate) throw new Error(`Baza țintă are deja date (${json(existente)}); nu suprascriu.`);
      jurnal(`Baza țintă are date dintr-o încercare anterioară (${total} rânduri); o golesc (nu e încă baza site-ului).`);
      await tx.$executeRawUnsafe(`TRUNCATE ${MODELE.map(tabel).join(", ")} RESTART IDENTITY CASCADE`);
    }
    for (const m of ordineModele()) {
      const brute = copie.tabele[m.name] ?? [];
      if (!Array.isArray(brute)) throw new Error(`Tabelul ${m.name} din copie nu e o listă`);
      asteptat[m.name] = brute.length;
      const randuri = ordineRanduri(m, brute.map((r) => convertesteRand(m, r, ignorate)));
      for (let i = 0; i < randuri.length; i += 500) {
        await tx[delegat(m)].createMany({ data: randuri.slice(i, i + 500) });
      }
    }
    // Secvențele: următorul id după cel mai mare din copie.
    for (const m of MODELE) {
      for (const f of m.fields.filter((x) => x.default?.name === "autoincrement")) {
        await tx.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('${tabel(m).replace(/'/g, "''")}', '${(f.dbName ?? f.name).replace(/'/g, "''")}'), COALESCE((SELECT MAX(${coloana(f)}) FROM ${tabel(m)}), 0) + 1, false)`,
        );
      }
    }
    // Verificare: fiecare tabel are exact câte rânduri are sursa.
    const numarat = {};
    for (const m of MODELE) {
      numarat[m.name] = await tx[delegat(m)].count();
      if (numarat[m.name] !== asteptat[m.name]) throw new Error(`Tabelul ${m.name}: ${numarat[m.name]} rânduri în bază, ${asteptat[m.name]} în copie`);
    }
    return numarat;
  }, { timeout: 30 * 60_000, maxWait: 60_000 });
  if (ignorate.size) jurnal(`Câmpuri din copie care nu mai există în schemă (ignorate): ${[...ignorate].join(", ")}`);
  return rez;
}

const scrieRaport = (r) => { if (arg("--raport")) writeFileSync(arg("--raport"), JSON.stringify(r, null, 2)); };

/**
 * --mod sonda: doar verifică dacă Neon răspunde (cod 0 = da, 3 = nu); nu citește și nu scrie nimic.
 * --mod neon:  doar din baza veche (Neon); dacă nu răspunde, iese cu codul 3 și nu atinge nimic.
 * --mod copie: doar din cea mai nouă copie de rezervă (disc, apoi R2) sau din --copie <fișier>.
 */
async function main() {
  const mod = arg("--mod");
  if (!["sonda", "neon", "copie"].includes(mod)) throw new Error("Folosește --mod sonda, neon sau copie");
  const tintaUrl = process.env.TINTA_DATABASE_URL;
  if (!tintaUrl) throw new Error("Lipsește TINTA_DATABASE_URL");
  const env = citesteEnv();
  const vecheUrl = env.NEON_DATABASE_URL || env.DATABASE_URL;
  // Siguranță: ținta nu poate fi baza din care citim; nu golim niciodată baza pe care rulează site-ul.
  if (vecheUrl && faraParola(vecheUrl) === faraParola(tintaUrl)) throw new Error("Ținta e chiar baza din care citesc; mă opresc.");
  const tintaELive = !!env.DATABASE_URL && faraParola(env.DATABASE_URL) === faraParola(tintaUrl);
  const dirLucru = arg("--lucru") ?? process.cwd();

  let copie = null, sursa = null, fisier = null;
  const neon = { incercatLa: new Date().toISOString(), raspunde: false, mesaj: null };
  if (mod === "sonda" || mod === "neon") {
    if (!vecheUrl || esteLocala(vecheUrl)) throw new Error("Nu am adresa bazei Neon (NEON_DATABASE_URL / DATABASE_URL).");
    jurnal(`Încerc baza veche ${faraParola(vecheUrl)} (doar citire)...`);
    try {
      copie = await dinNeon(vecheUrl, Number(arg("--limita-neon") ?? 25_000), mod === "sonda");
      neon.raspunde = true;
      sursa = "neon";
    } catch (e) {
      neon.mesaj = String(e?.message ?? e).split("\n").filter(Boolean).pop()?.slice(0, 300) ?? "eroare";
      jurnal(`Baza veche nu răspunde: ${neon.mesaj}`);
      scrieRaport({ neon });
      return 3;
    }
    if (mod === "sonda") { jurnal("Neon răspunde."); scrieRaport({ neon }); return 0; }
    // O păstrăm ca o copie în plus (nu înlocuiește copiile de noapte).
    const dir = process.env.COPII_DIR;
    if (dir && existsSync(dir)) {
      const f = path.join(dir, `neon-${copie.cand.replace(/[:.]/g, "-")}.json.gz`);
      writeFileSync(f, gzipSync(JSON.stringify(copie)), { mode: 0o600 });
      jurnal(`Datele din Neon salvate și în ${f}`);
    }
  } else {
    fisier = arg("--copie") ?? copieDePeDisc(process.env.COPII_DIR);
    sursa = fisier ? "copie-disc" : null;
    if (!fisier) {
      jurnal("Nicio copie pe disc; caut în Cloudflare R2...");
      fisier = await copieDinR2(env, dirLucru).catch((e) => { jurnal(`R2: ${e.message}`); return null; });
      sursa = fisier ? "copie-r2" : null;
    }
    if (!fisier) throw new Error("Nu există nicio copie de rezervă (nici pe disc, nici în R2).");
    jurnal(`Restaurez din copia ${path.basename(fisier)}`);
    copie = citesteCopie(fisier);
  }
  // O sursă goală nu înlocuiește nimic: mai degrabă ne oprim.
  const totalSursa = Object.values(copie.tabele ?? {}).reduce((a, t) => a + (Array.isArray(t) ? t.length : 0), 0);
  if (!totalSursa) throw new Error(`Sursa (${sursa}) nu are niciun rând; mă opresc.`);

  const tinta = new PrismaClient({ datasourceUrl: tintaUrl });
  try {
    const randuri = await restaureaza(tinta, copie, { golesteDacaAreDate: !tintaELive });
    jurnal(`Restaurare reușită din ${sursa}: ${json(randuri)}`);
    scrieRaport({
      ...(mod === "neon" ? { neon } : {}),
      mod,
      sursa,
      copie: fisier ? path.basename(fisier) : null,
      copieDin: copie.cand ?? null,
      restauratLa: new Date().toISOString(),
      randuri,
    });
    return 0;
  } finally {
    await tinta.$disconnect().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  main().then((cod) => process.exit(cod), (e) => {
    jurnal(`EROARE: ${String(e?.message ?? e).split("\n").filter(Boolean).slice(-3).join(" | ")}`);
    process.exit(1);
  });
}
