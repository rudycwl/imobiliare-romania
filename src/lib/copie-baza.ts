import "server-only";
import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { gzipSync } from "zlib";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { puneInR2, r2Configurat } from "./stocare";

// Copia de rezervă a bazei de date (Neon): în fiecare noapte, toate tabelele într-un fișier JSON comprimat
// pe discul serverului (ultimele 14 zile) și, dacă sunt cheile R2, și în Cloudflare R2 sub „copie/baza/”.

const PASTREZ = 14;

const json = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));

export async function copiazaBaza() {
  const dir = process.env.COPII_DIR;
  if (!dir) return { motiv: "lipsește COPII_DIR" };
  const tabele: Record<string, unknown[]> = {};
  for (const m of Prisma.dmmf.datamodel.models) {
    const delegat = (db as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[m.name[0].toLowerCase() + m.name.slice(1)];
    tabele[m.name] = await delegat.findMany();
  }
  const zi = new Date().toISOString().slice(0, 10);
  const nume = `baza-${zi}.json.gz`;
  const date = gzipSync(json({ cand: new Date().toISOString(), tabele }));
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(path.join(dir, nume), date, { mode: 0o600 });
  // Păstrăm doar ultimele 14 copii de pe disc.
  const vechi = (await readdir(dir)).filter((f) => /^baza-\d{4}-\d{2}-\d{2}\.json\.gz$/.test(f)).sort().slice(0, -PASTREZ);
  await Promise.all(vechi.map((f) => unlink(path.join(dir, f))));
  let r2 = "lipsesc cheile R2";
  if (r2Configurat()) {
    r2 = await puneInR2(`copie/baza/${nume}`, date, "application/gzip").then(
      () => "copiat",
      (e) => `eroare: ${e instanceof Error ? e.message : e}`,
    );
  }
  const randuri = Object.fromEntries(Object.entries(tabele).map(([k, v]) => [k, v.length]));
  return { fisier: nume, octeti: date.length, randuri, r2 };
}
