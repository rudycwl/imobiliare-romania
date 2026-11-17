// Recuperează în baza locală ce s-a scris în Neon DUPĂ copia de rezervă din care a fost restaurată baza locală.
// Se rulează manual, când Neon răspunde din nou (după resetarea lunară), pe server, ca utilizatorul cheiamea:
//
//   cd /opt/cheiamea/baza-locala-lucru
//   sudo -u cheiamea env COPII_DIR=/var/lib/cheiamea-copii node scripts/recupereaza-diferente.mjs            # doar arată ce ar face
//   sudo -u cheiamea env COPII_DIR=/var/lib/cheiamea-copii node scripts/recupereaza-diferente.mjs --aplica   # scrie în baza locală
//
// Comparație în trei: COPIA (baza de la care a pornit baza locală) / NEON (acum) / LOCAL (acum), rând cu rând după cheia primară:
//  - rând nou în Neon (nu era în copie) -> se adaugă local; dacă id-ul numeric e deja luat de un rând nou local,
//    primește un id nou, iar rândurile copil din Neon (poze, istoric preț...) sunt legate de id-ul nou;
//  - rând modificat în Neon și NEmodificat local -> se ia varianta din Neon;
//  - rând modificat și în Neon și local -> NU se atinge (conflict, apare în raport);
//  - rând șters în Neon după copie -> NU se șterge local (apare în raport).
// Neon se citește doar în tranzacție READ ONLY. Nimic nu se șterge. Fără --aplica nu se scrie nimic.
// Adrese: Neon din NEON_DATABASE_URL, baza locală din DATABASE_URL (ambele din /etc/cheiamea/env.json).
// Copia: --copie <fișier.json.gz>, implicit cea din /etc/cheiamea/baza-locala.json (comutat.restaurare.copie) din COPII_DIR.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { Prisma, PrismaClient } from "@prisma/client";
import { MODELE, convertesteRand, faraParola, ordineModele, ordineRanduri } from "./restaureaza-copie.mjs";

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const APLICA = process.argv.includes("--aplica");
const json = (v) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));
const delegat = (m) => m.name[0].toLowerCase() + m.name.slice(1);
const tabel = (m) => `"${(m.dbName ?? m.name).replace(/"/g, '""')}"`;

const pk = (m) => m.primaryKey?.fields ?? m.fields.filter((f) => f.isId).map((f) => f.name);
const cheie = (m, r) => json(pk(m).map((c) => r[c]));
const whereCheie = (m, r) => {
  const c = pk(m);
  if (c.length === 1) return { [c[0]]: r[c[0]] };
  return { [m.primaryKey?.name ?? c.join("_")]: Object.fromEntries(c.map((k) => [k, r[k]])) };
};
const idAuto = (m) => m.fields.find((f) => f.isId && f.default?.name === "autoincrement");
const scalari = (m) => m.fields.filter((f) => f.kind === "scalar" || f.kind === "enum").map((f) => f.name);
/** La fel pe câmpurile pe care le are copia (o copie mai veche poate să nu aibă coloanele adăugate între timp). */
const egal = (m, a, b, campuri) => campuri.every((c) => json(a[c]) === json(b[c]));

async function main() {
  const env = JSON.parse(readFileSync(process.env.ENV_FILE || "/etc/cheiamea/env.json", "utf8"));
  const neonUrl = env.NEON_DATABASE_URL, localUrl = env.DATABASE_URL;
  if (!neonUrl || !localUrl) throw new Error("Lipsesc NEON_DATABASE_URL / DATABASE_URL în env.json");
  if (faraParola(neonUrl) === faraParola(localUrl)) throw new Error("NEON_DATABASE_URL și DATABASE_URL sunt aceeași bază");

  let fisier = arg("--copie");
  if (!fisier) {
    const st = JSON.parse(readFileSync("/etc/cheiamea/baza-locala.json", "utf8"));
    const r = st.comutat?.restaurare ?? {};
    if (st.comutat?.sursa === "neon") { console.log("Baza locală a fost copiată direct din Neon: nu e nimic de recuperat."); return; }
    if (!r.copie) throw new Error("Nu știu din ce copie s-a restaurat; dă --copie <fișier>");
    fisier = path.join(process.env.COPII_DIR || "/var/lib/cheiamea-copii", r.copie);
  }
  if (!existsSync(fisier)) throw new Error(`Nu găsesc copia ${fisier}`);
  const copie = JSON.parse(gunzipSync(readFileSync(fisier)).toString("utf8"));
  console.log(`Copia de bază: ${path.basename(fisier)} (făcută la ${copie.cand}). Neon: ${faraParola(neonUrl)}. Local: ${faraParola(localUrl)}.`);
  console.log(APLICA ? "MOD: APLIC modificările în baza locală." : "MOD: doar arăt (rulează cu --aplica ca să scrie).");

  // A doua aplicare ar dubla rândurile mutate pe id nou: o refuzăm (fără --din-nou explicit).
  const aplicat = path.join(process.env.COPII_DIR || "/var/lib/cheiamea-copii", `recuperare-aplicata-${path.basename(fisier)}`);
  if (APLICA && existsSync(aplicat) && !process.argv.includes("--din-nou")) {
    throw new Error(`Recuperarea din această copie a fost deja aplicată (${readFileSync(aplicat, "utf8").trim()}). Rulează fără --aplica ca să vezi ce a rămas.`);
  }
  const neon = new PrismaClient({ datasourceUrl: neonUrl });
  const local = new PrismaClient({ datasourceUrl: localUrl });
  const raport = { copie: path.basename(fisier), copieDin: copie.cand, aplicat: APLICA, tabele: {} };
  try {
    const dinNeon = await neon.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      const t = {};
      for (const m of MODELE) t[m.name] = JSON.parse(json(await tx[delegat(m)].findMany()));
      return t;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 10 * 60_000, maxWait: 60_000 });

    // id vechi (Neon) -> id nou (local), pentru rândurile mutate pe alt id.
    const remap = new Map(MODELE.map((m) => [m.name, new Map()]));
    const legaturi = (m) => m.fields.filter((f) => f.kind === "object" && f.relationFromFields?.length === 1);
    const aplicaRemap = (m, r) => {
      const out = { ...r };
      for (const f of legaturi(m)) {
        const c = f.relationFromFields[0], h = remap.get(f.type);
        if (out[c] != null && h.has(out[c])) out[c] = h.get(out[c]);
      }
      return out;
    };

    for (const m of ordineModele()) {
      const r = (raport.tabele[m.name] = { adaugate: 0, mutatePeIdNou: 0, actualizate: 0, conflicte: [], stearseInNeon: 0, erori: [] });
      const baza = new Map((copie.tabele[m.name] ?? []).map((x) => [cheie(m, x), x]));
      const loc = new Map(JSON.parse(json(await local[delegat(m)].findMany())).map((x) => [cheie(m, x), x]));
      const neonRanduri = dinNeon[m.name];
      const peNeon = new Set(neonRanduri.map((x) => cheie(m, x)));
      r.stearseInNeon = [...baza.keys()].filter((k) => !peNeon.has(k)).length;
      const auto = idAuto(m);
      const campuri = scalari(m);
      // Id-urile noi (pentru rândurile mutate) încep după cel mai mare id din AMBELE baze, ca să nu se lovească
      // de rândurile din Neon care își păstrează id-ul.
      if (auto && APLICA) {
        const maxNeon = Math.max(0, ...neonRanduri.map((x) => Number(x[auto.name])));
        await local.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('${tabel(m).replace(/'/g, "''")}', '${auto.dbName ?? auto.name}'), GREATEST(COALESCE((SELECT MAX("${auto.dbName ?? auto.name}") FROM ${tabel(m)}), 0), ${maxNeon}) + 1, false)`,
        );
      }
      for (const n of ordineRanduri(m, neonRanduri)) {
        const k = cheie(m, n), b = baza.get(k), l = loc.get(k);
        const campuriBaza = b ? campuri.filter((c) => c in b) : campuri;
        try {
          if (!b) {
            // Rând nou în Neon.
            if (l && egal(m, l, n, campuri)) continue; // deja recuperat (rulare repetată)
            const ignorate = new Set();
            if (!l) {
              if (APLICA) await local[delegat(m)].create({ data: convertesteRand(m, aplicaRemap(m, n), ignorate) });
              r.adaugate++;
            } else if (auto) {
              // Id-ul e ocupat de un rând nou creat local: rândul din Neon primește un id nou.
              const { [auto.name]: _, ...faraId } = aplicaRemap(m, n);
              let nou = null;
              if (APLICA) nou = (await local[delegat(m)].create({ data: convertesteRand(m, faraId, ignorate) }))[auto.name];
              remap.get(m.name).set(n[auto.name], nou ?? `(nou)`);
              r.mutatePeIdNou++;
            } else {
              r.conflicte.push({ cheie: k, motiv: "aceeași cheie creată și local și în Neon" });
            }
          } else if (!egal(m, b, n, campuriBaza)) {
            // Rând modificat în Neon după copie.
            if (!l) r.conflicte.push({ cheie: k, motiv: "modificat în Neon, șters local" });
            else if (!egal(m, b, l, campuriBaza)) {
              if (!egal(m, l, n, campuri)) r.conflicte.push({ cheie: k, motiv: "modificat și în Neon și local" });
            } else {
              const ignorate = new Set();
              const data = convertesteRand(m, aplicaRemap(m, n), ignorate);
              for (const c of pk(m)) delete data[c];
              if (APLICA) await local[delegat(m)].update({ where: whereCheie(m, n), data });
              r.actualizate++;
            }
          }
        } catch (e) {
          r.erori.push({ cheie: k, eroare: String(e?.message ?? e).split("\n").filter(Boolean).pop()?.slice(0, 300) });
        }
      }
      // Secvența: după cel mai mare id (am putut insera id-uri peste ea).
      if (auto && APLICA) {
        await local.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('${tabel(m).replace(/'/g, "''")}', '${auto.dbName ?? auto.name}'), COALESCE((SELECT MAX("${auto.dbName ?? auto.name}") FROM ${tabel(m)}), 0) + 1, false)`,
        );
      }
      const s = r;
      if (s.adaugate || s.mutatePeIdNou || s.actualizate || s.conflicte.length || s.stearseInNeon || s.erori.length) {
        console.log(`${m.name}: +${s.adaugate} noi, ${s.mutatePeIdNou} pe id nou, ${s.actualizate} actualizate, ${s.conflicte.length} conflicte, ${s.stearseInNeon} șterse în Neon (nu le șterg), ${s.erori.length} erori`);
      }
      raport.tabele[m.name].remap = Object.fromEntries(remap.get(m.name));
    }
  } finally {
    await neon.$disconnect().catch(() => {});
    await local.$disconnect().catch(() => {});
  }
  if (APLICA) writeFileSync(aplicat, new Date().toISOString(), { mode: 0o600 });
  const f = arg("--raport") ?? `recuperare-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(f, JSON.stringify(raport, null, 2), { mode: 0o600 });
  console.log(`Raport complet: ${f}`);
}

main().catch((e) => {
  console.error(`EROARE: ${String(e?.message ?? e).split("\n").filter(Boolean).slice(-3).join(" | ")}`);
  process.exit(1);
});
