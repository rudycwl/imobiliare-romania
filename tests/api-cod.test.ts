import { test } from "node:test";
import assert from "node:assert/strict";
import { codDin, decizieCod } from "@/lib/api-cod";

// Rudy 17.11.2026 („OK cod API”): POST cu același „cod” actualizează / republică anunțul, nu-l dublează.
// Testele cu bază de date rulează doar cu TEST_DATABASE_URL (o bază PostgreSQL de test, cu migrările aplicate),
// ex. TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5499/cheiamea_teste npm test. Fără ea sunt sărite.

const acum = new Date("2026-11-17T12:00:00Z");
const activ = { expiraLa: new Date("2026-12-01T00:00:00Z"), moderare: "ok" };
const retras = { expiraLa: new Date("2026-11-17T11:00:00Z"), moderare: "ok" };

test("codul: lipsă = comportamentul vechi; text sau număr; prea lung sau alt tip = eroare", () => {
  assert.equal(codDin({ titlu: "x" }), null);
  assert.equal(codDin({ cod: "" }), null);
  assert.equal(codDin({ cod: "   " }), null);
  assert.equal(codDin({ cod: null }), null);
  assert.equal(codDin({ cod: " AP-1024 " }), "AP-1024");
  assert.equal(codDin({ cod: 1024 }), "1024");
  assert.ok(typeof codDin({ cod: { a: 1 } }) === "object");
  assert.ok(typeof codDin({ cod: "x".repeat(101) }) === "object");
  assert.equal(codDin(null), null);
  assert.equal(codDin([]), null);
});

test("decizia: cod nou → creare; activ → actualizare fără loc nou; retras/expirat → reactivare doar cu loc liber", () => {
  assert.equal(decizieCod(null, 1, acum), "creeaza");
  assert.equal(decizieCod(null, 0, acum), "limita");
  assert.equal(decizieCod(activ, 0, acum), "actualizeaza"); // actualizarea nu ocupă loc
  assert.equal(decizieCod(retras, 1, acum), "reactiveaza");
  assert.equal(decizieCod(retras, 0, acum), "limita");
  assert.equal(decizieCod({ ...activ, moderare: "respins" }, 5, acum), "respins");
  assert.equal(decizieCod({ ...activ, moderare: "verificare" }, 0, acum), "actualizeaza");
  assert.equal(decizieCod(retras, Infinity, acum), "reactiveaza"); // abonament nelimitat
});

// ---------- Cu baza de date ----------

const BAZA = process.env.TEST_DATABASE_URL;
const cuBaza = { skip: BAZA ? false : "fără TEST_DATABASE_URL" };

async function pregatire() {
  process.env.DATABASE_URL = BAZA;
  delete process.env.POZE_DIR; // fără descărcări de poze în teste
  const { db } = await import("@/lib/db");
  const { publicaPrinApi } = await import("@/lib/api-cod");
  const { retrageAnunt } = await import("@/lib/anunturi");
  const sufix = Math.random().toString(36).slice(2, 8);
  const agentie = (n: string) =>
    db.utilizator.create({
      data: { slug: `test-cod-${n}-${sufix}`, tip: "agentie", nume: `Agenția test ${n}`, telefon: "0700000000", judet: "iasi", oras: "iasi", emailConfirmatLa: new Date() },
    });
  return { db, publicaPrinApi, retrageAnunt, agentie };
}

const anunt = (extra: Record<string, unknown> = {}) => ({
  cod: "AP-1024",
  titlu: "Apartament 2 camere Tătărași, renovat",
  descriere: "Decomandat, etaj 2/4, centrală proprie.",
  tip: "apartament",
  tranzactie: "vanzare",
  pret: 89000,
  suprafata: 54,
  camere: 2,
  judet: "Iași",
  oras: "Iași",
  zona: "Tătărași",
  ...extra,
});

test("cu bază: creare, retrimitere cu preț nou = actualizare (fără dublură), republicare după retragere", cuBaza, async () => {
  const { db, publicaPrinApi, retrageAnunt, agentie } = await pregatire();
  const a = await agentie("a");
  try {
    // 1. Creare
    let r = await publicaPrinApi(a.id, [anunt()]);
    assert.equal(r.publicate.length, 1);
    assert.equal(r.actualizate.length, 0);
    const id = r.publicate[0].id;
    assert.equal((await db.anunt.findUniqueOrThrow({ where: { id } })).externId, "AP-1024");

    // 2. Retrimitere cu preț, titlu și descriere noi → același anunț
    r = await publicaPrinApi(a.id, [anunt({ pret: 85000, titlu: "Apartament 2 camere Tătărași, preț redus", descriere: "Acum cu aer condiționat." })]);
    assert.equal(r.publicate.length, 0);
    assert.deepEqual(r.actualizate, [{ rand: 1, id, cod: "AP-1024", reactivat: false }]);
    assert.equal(await db.anunt.count({ where: { proprietarId: a.id } }), 1, "fără dublură");
    const dupa = await db.anunt.findUniqueOrThrow({ where: { id } });
    assert.equal(dupa.pret, 85000);
    assert.equal(dupa.titlu, "Apartament 2 camere Tătărași, preț redus");
    assert.equal(dupa.descriere, "Acum cu aer condiționat.");
    assert.deepEqual((await db.istoricPret.findMany({ where: { anuntId: id }, orderBy: { la: "asc" } })).map((x) => x.pret), [89000, 85000]);

    // 3. Retras (DELETE din API) → retrimis cu același cod = republicat, același id
    await retrageAnunt(id, a.id);
    assert.ok((await db.anunt.findUniqueOrThrow({ where: { id } })).expiraLa <= new Date());
    r = await publicaPrinApi(a.id, [anunt({ pret: 84000 })]);
    assert.deepEqual(r.actualizate.map((x) => [x.id, x.reactivat]), [[id, true]]);
    assert.equal(r.sarite.length, 0);
    const republicat = await db.anunt.findUniqueOrThrow({ where: { id } });
    assert.ok(republicat.expiraLa > new Date(Date.now() + 59 * 864e5));
    assert.equal(republicat.pret, 84000);

    // 4. Expirat (nu retras) → la fel
    await db.anunt.update({ where: { id }, data: { expiraLa: new Date(Date.now() - 864e5) } });
    r = await publicaPrinApi(a.id, [anunt({ pret: 84000 })]);
    assert.equal(r.actualizate[0]?.reactivat, true);
    assert.equal(await db.anunt.count({ where: { proprietarId: a.id } }), 1);

    // 5. Același cod de două ori în aceeași cerere: al doilea e sărit
    r = await publicaPrinApi(a.id, [anunt(), anunt({ pret: 1 })]);
    assert.equal(r.actualizate.length, 1);
    assert.match(r.sarite[0].motiv, /de două ori/);
  } finally {
    await db.utilizator.delete({ where: { id: a.id } });
  }
});

test("cu bază: același cod la alt cont = anunț separat; fără cod comportamentul vechi", cuBaza, async () => {
  const { db, publicaPrinApi, agentie } = await pregatire();
  const a = await agentie("b1");
  const b = await agentie("b2");
  try {
    const ra = await publicaPrinApi(a.id, [anunt()]);
    const rb = await publicaPrinApi(b.id, [anunt({ pret: 70000 })]);
    assert.equal(ra.publicate.length, 1);
    assert.equal(rb.publicate.length, 1);
    assert.notEqual(ra.publicate[0].id, rb.publicate[0].id);
    assert.equal((await db.anunt.findUniqueOrThrow({ where: { id: ra.publicate[0].id } })).pret, 89000, "anunțul agenției A nu e atins");

    // Fără cod: același titlu și preț nu se dublează, preț nou = anunț nou (ca înainte)
    const fara = anunt({ cod: undefined, titlu: "Casă cu grădină în Bucium, 4 camere", pret: 150000 });
    let r = await publicaPrinApi(a.id, [fara]);
    assert.equal(r.publicate.length, 1);
    assert.equal(r.publicate[0].cod, undefined);
    r = await publicaPrinApi(a.id, [fara]);
    assert.equal(r.publicate.length, 0);
    assert.match(r.sarite[0].motiv, /există deja/);

    // Anunțul publicat fără cod primește codul la prima retrimitere cu cod (nu se dublează)
    const vechi = await db.anunt.findFirstOrThrow({ where: { proprietarId: a.id, externId: null } });
    r = await publicaPrinApi(a.id, [{ ...fara, cod: "CS-7" }]);
    assert.deepEqual(r.actualizate.map((x) => x.id), [vechi.id]);
    r = await publicaPrinApi(a.id, [{ ...fara, cod: "CS-7", pret: 145000 }]);
    assert.deepEqual(r.actualizate.map((x) => x.id), [vechi.id]);
    assert.equal(await db.anunt.count({ where: { proprietarId: a.id } }), 2);
  } finally {
    await db.utilizator.deleteMany({ where: { id: { in: [a.id, b.id] } } });
  }
});

test("cu bază: limita abonamentului (3 gratuite) – cod nou și republicare oprite, actualizarea merge", cuBaza, async () => {
  const { db, publicaPrinApi, retrageAnunt, agentie } = await pregatire();
  const a = await agentie("c");
  try {
    const trei = [1, 2, 3].map((n) => anunt({ cod: `L-${n}`, titlu: `Apartament de test pentru limită ${n}` }));
    let r = await publicaPrinApi(a.id, trei);
    assert.equal(r.publicate.length, 3);
    // Al patrulea cod nou: oprit
    r = await publicaPrinApi(a.id, [anunt({ cod: "L-4", titlu: "Apartament de test pentru limită 4" })]);
    assert.equal(r.publicate.length, 0);
    assert.ok(r.oprit);
    assert.equal(r.sarite.length, 1);
    // Actualizarea unui anunț activ merge și la limită
    r = await publicaPrinApi(a.id, [{ ...trei[0], pret: 80000 }]);
    assert.equal(r.actualizate.length, 1);
    assert.equal(r.oprit, undefined);
    // Retragem L-1, publicăm L-4 (ocupă locul), apoi L-1 nu se mai poate republica
    await retrageAnunt(r.actualizate[0].id, a.id);
    r = await publicaPrinApi(a.id, [anunt({ cod: "L-4", titlu: "Apartament de test pentru limită 4" })]);
    assert.equal(r.publicate.length, 1);
    r = await publicaPrinApi(a.id, [trei[0]]);
    assert.equal(r.actualizate.length, 0);
    assert.ok(r.oprit);
    const l1 = await db.anunt.findFirstOrThrow({ where: { proprietarId: a.id, externId: "L-1" } });
    assert.ok(l1.expiraLa <= new Date(), "rămâne retras");
    assert.equal(await db.anunt.count({ where: { proprietarId: a.id, expiraLa: { gt: new Date() } } }), 3);
  } finally {
    await db.utilizator.delete({ where: { id: a.id } });
  }
});

test("cu bază: caracteristicile prin cod – la creare din câmpuri și descriere; la retrimitere sursa înlocuiește, descrierea doar completează", cuBaza, async () => {
  const { db, publicaPrinApi, agentie } = await pregatire();
  const a = await agentie("car");
  try {
    let r = await publicaPrinApi(a.id, [anunt({ cod: "C-1", bai: 2 })]);
    const id = r.publicate[0].id;
    let x = await db.anunt.findUniqueOrThrow({ where: { id } });
    assert.equal(x.bai, 2, "din câmpul trimis");
    assert.equal(x.etaj, 2, "din descriere („etaj 2/4”)");
    assert.equal(x.compartimentare, "decomandat");

    // Omul corectează pe site; agenția retrimite fără „bai”, cu alt etaj în câmp și altă descriere.
    await db.anunt.update({ where: { id }, data: { bai: 3, mobilare: "mobilat" } });
    r = await publicaPrinApi(a.id, [anunt({ cod: "C-1", etaj: 3, descriere: "Semidecomandat, nemobilat." })]);
    assert.equal(r.actualizate.length, 1);
    x = await db.anunt.findUniqueOrThrow({ where: { id } });
    assert.equal(x.etaj, 3, "câmpul trimis înlocuiește");
    assert.equal(x.bai, 3, "ce lipsește din sursă nu șterge ce a completat omul");
    assert.equal(x.mobilare, "mobilat", "ghicitul din descriere nu suprascrie un câmp completat");
    assert.equal(x.compartimentare, "decomandat", "la fel");
  } finally {
    await db.utilizator.delete({ where: { id: a.id } });
  }
});
