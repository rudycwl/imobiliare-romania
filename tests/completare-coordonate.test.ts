import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Completarea coordonatelor (src/lib/geocodare.ts → completeazaCoordonate): stradă → zonă → centrul localității,
// mereu aproximativ (punctProprietar = false), idempotentă. Cu bază de test (TEST_DATABASE_URL) și Nominatim simulat.
const BAZA = process.env.TEST_DATABASE_URL;
const cuBaza = { skip: BAZA ? false : "fără TEST_DATABASE_URL" };

const carol = JSON.parse(readFileSync(new URL("./date/nominatim/carol-11-iasi.json", import.meta.url), "utf8"));
const CENTRU_IASI = { lat: 47.1615, lng: 27.5837 };
const TATARASI = { lat: 47.1654, lng: 27.6122 };
const CENTRU_CRAIOVA = { lat: 44.3190, lng: 23.7967 };

const TUDOR = { lat: 47.1560029, lng: 27.6016607 };

function nominatimSimulat(opt: { picaZona?: () => boolean } = {}) {
  const cereri: string[] = [];
  const orig = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const u = new URL(String(input));
    cereri.push(u.search);
    assert.match(u.hostname, /nominatim\.openstreetmap\.org/);
    const p = u.searchParams;
    const r = (x: unknown) => new Response(JSON.stringify(x), { status: 200, headers: { "content-type": "application/json" } });
    const pct = (x: { lat: number; lng: number }, address: Record<string, string>) => [{ lat: String(x.lat), lon: String(x.lng), address }];
    if (p.get("street")) return r(/Carol I/.test(p.get("street")!) ? carol : []);
    if (p.get("city") === "Iași") return r(pct(CENTRU_IASI, { city: "Iași" }));
    if (p.get("city") === "Craiova") return r(pct(CENTRU_CRAIOVA, { city: "Craiova" }));
    if (p.get("q") === "Tătărași, Iași") return r(pct(TATARASI, { suburb: "Tătărași", city: "Iași" }));
    if (p.get("q") === "Tudor Vladimirescu, Iași") {
      if (opt.picaZona?.()) return new Response("Too Many Requests", { status: 429 });
      // Ca Nominatim: întâi satul Tudor Vladimirescu (com. Mogoșești-Siret), apoi cartierul din Iași.
      return r([
        { lat: "47.1322851", lon: "26.7780097", address: { village: "Tudor Vladimirescu", municipality: "Mogoșești-Siret" } },
        { lat: String(TUDOR.lat), lon: String(TUDOR.lng), address: { suburb: "Tudor Vladimirescu", city: "Iași" } },
      ]);
    }
    return r([]);
  }) as typeof fetch;
  return { cereri, gata: () => (globalThis.fetch = orig) };
}

test("cu bază: completare – stradă găsită, altfel zona, altfel centrul localității; aproximativ; a doua rulare nu schimbă nimic", cuBaza, async () => {
  process.env.DATABASE_URL = BAZA;
  delete process.env.POZE_DIR;
  const { db } = await import("@/lib/db");
  const { publicaPrinApi } = await import("@/lib/api-cod");
  const { completeazaCoordonate } = await import("@/lib/geocodare");
  const { punctPublic, distantaM, RAZA_APROXIMATIVA_M } = await import("@/lib/locatie");
  // Două conturi: contul gratuit publică cel mult 3 anunțuri active.
  const cont = () =>
    db.utilizator.create({
      data: { slug: `test-coord-${Math.random().toString(36).slice(2, 8)}`, tip: "agentie", nume: "Agenția test coordonate", telefon: "0700000000", judet: "iasi", oras: "iasi", emailConfirmatLa: new Date() },
    });
  const u = await cont();
  const u2 = await cont();
  const sim = nominatimSimulat();
  try {
    const baza = { descriere: "Test.", tip: "apartament", tranzactie: "vanzare", pret: 90000, suprafata: 50, camere: 2, judet: "Iași", oras: "Iași" };
    const r = await publicaPrinApi(u.id, [
      { ...baza, cod: "S", titlu: "Apartament cu stradă găsită", zona: "Copou" },
      { ...baza, cod: "Z", titlu: "Apartament cu stradă negăsită", zona: "Tătărași" },
      { ...baza, cod: "L", titlu: "Apartament doar cu localitatea", judet: "Dolj", oras: "Craiova", zona: "Centru" },
    ]);
    const r2 = await publicaPrinApi(u2.id, [
      { ...baza, cod: "P", titlu: "Apartament cu punctul proprietarului", zona: "Copou" },
      { ...baza, cod: "E", titlu: "Apartament expirat fără punct", zona: "Tătărași" },
    ]);
    const id = Object.fromEntries([...r.publicate, ...r2.publicate].map((p) => [p.cod!, p.id]));
    assert.equal(Object.keys(id).length, 5);
    await db.anunt.update({ where: { id: id.S }, data: { strada: "Bulevardul Carol I", numar: "11" } });
    await db.anunt.update({ where: { id: id.Z }, data: { strada: "Strada Inexistentă", numar: "3" } });
    await db.anunt.update({ where: { id: id.P }, data: { lat: 47.17, lng: 27.57, punctProprietar: true } });
    await db.anunt.update({ where: { id: id.E }, data: { expiraLa: new Date(Date.now() - 864e5) } });
    const ids = Object.values(id);

    // Fără `toate` (după salvare): doar cele active.
    let rez = await completeazaCoordonate(15, { ids });
    assert.deepEqual(rez, { completate: 3, esuate: 0, oprit: false });
    assert.equal((await db.anunt.findUniqueOrThrow({ where: { id: id.E } })).lat, null);
    // La pornire (`toate`): și cel expirat.
    rez = await completeazaCoordonate(Number.MAX_SAFE_INTEGER, { toate: true, ids });
    assert.deepEqual(rez, { completate: 1, esuate: 0, oprit: false });

    const x = async (k: string) => db.anunt.findUniqueOrThrow({ where: { id: id[k] } });
    const S = await x("S");
    assert.deepEqual([S.lat, S.lng, S.punctProprietar, S.sursaLoc], [47.1742067, 27.5713755, false, "adresa"], "adresa găsită după stradă");
    const Z = await x("Z");
    assert.deepEqual([Z.lat, Z.lng, Z.sursaLoc], [TATARASI.lat, TATARASI.lng, "zona"], "strada negăsită → zona");
    const L = await x("L");
    assert.deepEqual([L.lat, L.lng, L.sursaLoc], [CENTRU_CRAIOVA.lat, CENTRU_CRAIOVA.lng, "localitate"], "zona negăsită → centrul localității");
    const P = await x("P");
    assert.deepEqual([P.lat, P.lng, P.punctProprietar], [47.17, 27.57, true], "punctul proprietarului nu se atinge");
    assert.deepEqual([(await x("E")).lat, (await x("E")).lng], [TATARASI.lat, TATARASI.lng]);

    // Pe site: mereu zonă (cerc), iar centrul cercului nu e chiar adresa găsită.
    const pub = punctPublic(S)!;
    assert.equal(pub.aproximativ, true);
    const d = distantaM({ lat: S.lat!, lng: S.lng! }, pub);
    assert.ok(d > 60 && d < RAZA_APROXIMATIVA_M - 50, `${d} m`);

    // Idempotentă: a doua rulare nu mai găsește nimic de completat și nu întreabă Nominatim.
    const inainte = sim.cereri.length;
    assert.deepEqual(await completeazaCoordonate(Number.MAX_SAFE_INTEGER, { toate: true, ids }), { completate: 0, esuate: 0, oprit: false });
    assert.equal(sim.cereri.length, inainte);
  } finally {
    sim.gata();
    await db.utilizator.deleteMany({ where: { id: { in: [u.id, u2.id] } } });
  }
});

test("cu bază: o eroare Nominatim la zonă nu pune anunțul pe centrul localității; recompletarea mută punctele vechi de pe centru pe cartier", cuBaza, async () => {
  process.env.DATABASE_URL = BAZA;
  delete process.env.POZE_DIR;
  const { db } = await import("@/lib/db");
  const { publicaPrinApi } = await import("@/lib/api-cod");
  const { completeazaCoordonate, recompleteazaCoordonate } = await import("@/lib/geocodare");
  const cont = () =>
    db.utilizator.create({
      data: { slug: `test-coord-${Math.random().toString(36).slice(2, 8)}`, tip: "agentie", nume: "Agenția test coordonate 2", telefon: "0700000000", judet: "iasi", oras: "iasi", emailConfirmatLa: new Date() },
    });
  const u = await cont();
  let pica = true;
  const sim = nominatimSimulat({ picaZona: () => pica });
  try {
    const baza = { descriere: "Test.", tip: "apartament", tranzactie: "vanzare", pret: 90000, suprafata: 50, camere: 2, judet: "Iași", oras: "Iași", zona: "Tudor Vladimirescu" };
    const r = await publicaPrinApi(u.id, [
      { ...baza, cod: "N", titlu: "Apartament nou în Tudor Vladimirescu" },
      { ...baza, cod: "V", titlu: "Apartament vechi pus pe centrul Iașului" },
      { ...baza, cod: "O", titlu: "Apartament cu punctul proprietarului pe centru" },
    ]);
    const id = Object.fromEntries(r.publicate.map((p) => [p.cod!, p.id]));
    // Ca #6 live: completarea veche (fără sursă) l-a pus pe centrul Iașului.
    await db.anunt.update({ where: { id: id.V }, data: { lat: CENTRU_IASI.lat, lng: CENTRU_IASI.lng, punctProprietar: false } });
    await db.anunt.update({ where: { id: id.O }, data: { lat: CENTRU_IASI.lat, lng: CENTRU_IASI.lng, punctProprietar: true } });
    const ids = Object.values(id);
    const x = (k: string) => db.anunt.findUniqueOrThrow({ where: { id: id[k] } });

    // 1. Nominatim răspunde 429 la căutarea zonei (centrul localității merge): nu se salvează nimic, rularea se oprește.
    assert.deepEqual(await completeazaCoordonate(15, { ids }), { completate: 0, esuate: 0, oprit: true });
    assert.equal((await x("N")).lat, null);
    // 2. Nominatim merge din nou: cartierul, nu satul cu același nume și nu centrul.
    pica = false;
    assert.deepEqual(await completeazaCoordonate(15, { ids }), { completate: 1, esuate: 0, oprit: false });
    const N = await x("N");
    assert.deepEqual([N.lat, N.lng, N.sursaLoc], [TUDOR.lat, TUDOR.lng, "zona"]);

    // 3. Recompletarea: punctul vechi de pe centru se mută pe cartier; al proprietarului rămâne.
    assert.deepEqual(await recompleteazaCoordonate({ ids }), { refacute: 1, mutate: 1, oprit: false });
    const V = await x("V");
    assert.deepEqual([V.lat, V.lng, V.sursaLoc], [TUDOR.lat, TUDOR.lng, "zona"]);
    const O = await x("O");
    assert.deepEqual([O.lat, O.lng, O.punctProprietar, O.sursaLoc], [CENTRU_IASI.lat, CENTRU_IASI.lng, true, null]);
    // A doua rulare nu mai are ce face și nu întreabă Nominatim.
    const inainte = sim.cereri.length;
    assert.deepEqual(await recompleteazaCoordonate({ ids }), { refacute: 0, mutate: 0, oprit: false });
    assert.equal(sim.cereri.length, inainte);
  } finally {
    sim.gata();
    await db.utilizator.delete({ where: { id: u.id } });
  }
});
