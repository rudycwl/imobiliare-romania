import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { _reseteaza, faraDatePersonale, listaErori, MAX_ERORI, pastreazaEroare, raporteazaEroare } from "../src/lib/raport-erori";
import { cuReincercare, deReincercat, urlCuTimeout } from "../src/lib/db";

// Rudy 15.11.2026: erorile CheiaMea ajung în ERP (GET /api/erp/erori), nu pe email; Neon are nevoie de timp de trezire.

const dir = mkdtempSync(join(tmpdir(), "erori-"));
const nou = (n: string) => {
  const f = join(dir, `${n}.jsonl`);
  _reseteaza(f);
  return f;
};

test("aceeași eroare se numără, cu prima și ultima dată; adresa fără parametri", () => {
  nou("numar");
  const e = { sursa: "server" as const, mesaj: "Can't reach database server", unde: "/?q=ion@exemplu.ro" };
  pastreazaEroare(e, new Date("2026-11-15T09:57:00Z"));
  const a = pastreazaEroare({ ...e, unde: "/?alt=1" }, new Date("2026-11-15T10:05:00Z"))!;
  assert.equal(a.numar, 2);
  assert.equal(a.unde, "/");
  assert.equal(a.prima, "2026-11-15T09:57:00.000Z");
  assert.equal(a.ultima, "2026-11-15T10:05:00.000Z");
  assert.equal(listaErori().length, 1);
  assert.equal(listaErori(new Date("2026-11-15T10:00:00Z")).length, 1);
  assert.equal(listaErori(new Date("2026-11-15T11:00:00Z")).length, 0);
});

test("lista supraviețuiește repornirii (fișierul jsonl) și rămâne în limită", () => {
  const f = nou("repornire");
  pastreazaEroare({ sursa: "server", mesaj: "A", unde: "/a" });
  pastreazaEroare({ sursa: "browser", mesaj: "B", unde: "/b" });
  pastreazaEroare({ sursa: "server", mesaj: "A", unde: "/a" });
  _reseteaza(f); // ca la o repornire: memoria goală, fișierul rămâne
  const l = listaErori();
  assert.deepEqual(l.map((e) => [e.mesaj, e.numar]), [["A", 2], ["B", 1]]);
  for (let i = 0; i < MAX_ERORI + 30; i++) pastreazaEroare({ sursa: "server", mesaj: `E${i}`, unde: "/" });
  assert.equal(listaErori().length, MAX_ERORI);
  _reseteaza(f);
  assert.equal(listaErori().length, MAX_ERORI);
  assert.equal(listaErori()[0].mesaj, `E${MAX_ERORI + 29}`);
});

test("un fișier stricat nu oprește site-ul", () => {
  const f = nou("stricat");
  writeFileSync(f, "nu e json\n{\"id\":1}\n");
  assert.doesNotThrow(() => pastreazaEroare({ sursa: "server", mesaj: "X", unde: "/" }));
  assert.equal(listaErori().length, 1);
});

test("fără date personale în mesaje și detalii", () => {
  const t = faraDatePersonale("user ion.popescu@gmail.com tel 0722 123 456 ip 10.1.2.3 cnp 1850101123456 postgresql://u:parola@host/db https://x.ro/p?token=abc");
  for (const s of ["ion.popescu", "0722", "10.1.2.3", "1850101123456", "parola", "token=abc"]) assert.ok(!t.includes(s), s);
  nou("personale");
  const e = pastreazaEroare({ sursa: "server", mesaj: "Unique constraint on email ana@x.ro", unde: "/cont?email=ana@x.ro", detalii: "ana@x.ro" })!;
  assert.ok(!JSON.stringify(e).includes("ana@x.ro"));
  assert.ok(!readFileSync(join(dir, "personale.jsonl"), "utf8").includes("ana@x.ro"));
});

test("„Failed to find Server Action” nu se păstrează", async () => {
  nou("ignorata");
  await raporteazaEroare({ sursa: "server", mesaj: "Failed to find Server Action \"abc\"", unde: "/" });
  assert.equal(listaErori().length, 0);
});

test("nu se mai trimite email (Brevo) pentru erori", () => {
  const s = readFileSync("src/lib/raport-erori.ts", "utf8");
  assert.ok(!/brevo|ADMIN_EMAILS|fetch\(/i.test(s.replace(/^\s*\/\/.*$/gm, "")));
});

test("/api/erp/erori cere X-ERP-Key și nu atinge baza", () => {
  const r = readFileSync("src/app/api/erp/erori/route.ts", "utf8");
  assert.match(r, /cheieBuna\(req\.headers\.get\("x-erp-key"\)/);
  assert.ok(!r.includes("@/lib/db"));
  assert.match(readFileSync("src/app/api/erp/route.ts", "utf8"), /from "@\/lib\/cheie-erp"/);
});

test("DATABASE_URL primește connect_timeout=15 și pool_timeout=15 doar dacă lipsesc", () => {
  const u = new URL(urlCuTimeout("postgresql://u:p@ep-x.eu-central-1.aws.neon.tech/neondb?sslmode=require")!);
  assert.equal(u.searchParams.get("connect_timeout"), "15");
  assert.equal(u.searchParams.get("pool_timeout"), "15");
  assert.equal(u.searchParams.get("sslmode"), "require");
  assert.equal(u.password, "p");
  const v = new URL(urlCuTimeout("postgresql://u:p@h/db?connect_timeout=30")!);
  assert.equal(v.searchParams.get("connect_timeout"), "30");
  assert.equal(urlCuTimeout(undefined), undefined);
});

const cunoscuta = (code: string) => new Prisma.PrismaClientKnownRequestError("x", { code, clientVersion: "6" });

test("se reîncearcă doar erorile de conexiune; P1017 doar la citiri", () => {
  assert.ok(deReincercat(cunoscuta("P1001"), "create"));
  assert.ok(deReincercat(cunoscuta("P1002"), "update"));
  assert.ok(deReincercat(new Prisma.PrismaClientInitializationError("x", "6", "P1001"), "findMany"));
  assert.ok(deReincercat(cunoscuta("P1017"), "groupBy"));
  assert.ok(!deReincercat(cunoscuta("P1017"), "create"));
  assert.ok(!deReincercat(cunoscuta("P2002"), "create"));
  assert.ok(!deReincercat(new Error("altceva"), "findMany"));
});

test("cuReincercare: o singură reîncercare, după pauză", async () => {
  let n = 0;
  assert.equal(await cuReincercare(async () => (++n === 1 ? Promise.reject(cunoscuta("P1001")) : "ok"), "findMany", 10), "ok");
  assert.equal(n, 2);
  n = 0;
  await assert.rejects(cuReincercare(async () => { n++; throw cunoscuta("P1001"); }, "findMany", 10));
  assert.equal(n, 2);
  n = 0;
  await assert.rejects(cuReincercare(async () => { n++; throw cunoscuta("P2002"); }, "create", 10));
  assert.equal(n, 1);
});

test("clientul real reîncearcă o dată când baza nu răspunde (și tranzacțiile nu se blochează)", async () => {
  process.env.DATABASE_URL = "postgresql://u:p@127.0.0.1:1/db?connect_timeout=2";
  const { db } = await import("../src/lib/db");
  const t = Date.now();
  await assert.rejects(db.anunt.groupBy({ by: ["judet"], _count: true }), (e: unknown) => deReincercat(e, "groupBy"));
  assert.ok(Date.now() - t >= 1400, "a așteptat ~1,5 s înainte de reîncercare");
  await assert.rejects(Promise.race([db.$transaction([db.anunt.count(), db.vizita.count()]), new Promise((_, r) => setTimeout(() => r(new Error("blocat")), 15_000))]),
    (e: Error) => e.message !== "blocat");
  await db.$disconnect();
});
