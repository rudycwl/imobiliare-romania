// Copia de noapte a bazei locale cu pg_dump (format custom, se restaurează cu pg_restore), pe lângă copia JSON
// făcută de aplicație. Rulează ca root din cheiamea-copie-baza.service; nu face nimic cât timp site-ul e încă pe Neon.
// Pe disc: /var/lib/cheiamea-copii/pgdump-AAAA-LL-ZZ.dump (ultimele 14), în R2: copie/baza/pgdump-AAAA-LL-ZZ.dump.
import { execFileSync } from "node:child_process";
import { chownSync, existsSync, readFileSync, readdirSync, renameSync, unlinkSync, openSync, closeSync } from "node:fs";
import path from "node:path";
import { cerereR2 } from "./servicii.mjs";

const DIR = "/var/lib/cheiamea-copii";
const PASTREZ = 14;
if (!existsSync("/etc/cheiamea/baza-locala.gata")) {
  console.log("Baza încă nu e locală; sar peste pg_dump.");
  process.exit(0);
}
const zi = new Date().toISOString().slice(0, 10);
const nume = `pgdump-${zi}.dump`;
const fisier = path.join(DIR, nume);
const fd = openSync(fisier + ".nou", "w", 0o600);
try {
  // Ca utilizatorul postgres, prin socket local (fără parolă în comandă).
  execFileSync("runuser", ["-u", "postgres", "--", "pg_dump", "-Fc", "-d", "cheiamea"], { stdio: ["ignore", fd, "inherit"], maxBuffer: 1 << 30 });
} finally {
  closeSync(fd);
}
renameSync(fisier + ".nou", fisier);
const uid = Number(execFileSync("id", ["-u", "cheiamea"]).toString().trim());
const gid = Number(execFileSync("id", ["-g", "cheiamea"]).toString().trim());
chownSync(fisier, uid, gid);
const date = readFileSync(fisier);
console.log(`pg_dump: ${nume}, ${date.length} octeți`);
for (const f of readdirSync(DIR).filter((x) => /^pgdump-\d{4}-\d{2}-\d{2}\.dump$/.test(x)).sort().slice(0, -PASTREZ)) unlinkSync(path.join(DIR, f));

const env = JSON.parse(readFileSync("/etc/cheiamea/env.json", "utf8"));
const r = await cerereR2(env, "PUT", `copie/baza/${nume}`, {}, date);
console.log(r.ok ? "R2: copiat" : `R2: ${r.status ? `HTTP ${r.status}` : r.text}`);
