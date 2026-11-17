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

function nominatimSimulat() {
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
    assert.deepEqual(rez, { completate: 3, esuate: 0 });
    assert.equal((await db.anunt.findUniqueOrThrow({ where: { id: id.E } })).lat, null);
    // La pornire (`toate`): și cel expirat.
    rez = await completeazaCoordonate(Number.MAX_SAFE_INTEGER, { toate: true, ids });
    assert.deepEqual(rez, { completate: 1, esuate: 0 });

    const x = async (k: string) => db.anunt.findUniqueOrThrow({ where: { id: id[k] } });
    const S = await x("S");
    assert.deepEqual([S.lat, S.lng, S.punctProprietar], [47.1742067, 27.5713755, false], "adresa găsită după stradă");
    const Z = await x("Z");
    assert.deepEqual([Z.lat, Z.lng], [TATARASI.lat, TATARASI.lng], "strada negăsită → zona");
    const L = await x("L");
    assert.deepEqual([L.lat, L.lng], [CENTRU_CRAIOVA.lat, CENTRU_CRAIOVA.lng], "zona negăsită → centrul localității");
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
    assert.deepEqual(await completeazaCoordonate(Number.MAX_SAFE_INTEGER, { toate: true, ids }), { completate: 0, esuate: 0 });
    assert.equal(sim.cereri.length, inainte);
  } finally {
    sim.gata();
    await db.utilizator.deleteMany({ where: { id: { in: [u.id, u2.id] } } });
  }
});
