import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { alegeAdresa, gasesteAdresa, inLocalitate, stradaPotrivita, type RezultatAdresa } from "@/lib/geocodare";

// Răspunsuri reale Nominatim (17.11.2026, căutare structurată street + city=Iași + county=Iași, addressdetails=1).
const date = (f: string) => JSON.parse(readFileSync(new URL(`./date/nominatim/${f}`, import.meta.url), "utf8")) as RezultatAdresa[];
const vasileAlecsandri = date("vasile-alecsandri-3-iasi.json"); // → Balciu, com. Miroslava
const lapusneanu = date("lapusneanu-10-iasi.json"); // → Podu Iloaiei
const carol = date("carol-11-iasi.json"); // → Iași, Universitate

test("adresa: „Strada Vasile Alecsandri 3, Iași” găsită de Nominatim în Balciu (Miroslava) nu e acceptată", () => {
  assert.equal(inLocalitate(vasileAlecsandri[0], "Iași"), false);
  assert.equal(alegeAdresa(vasileAlecsandri, "Iași", "3"), null);
  // Dacă omul alege chiar comuna Miroslava, același rezultat e bun (municipality).
  assert.deepEqual(alegeAdresa(vasileAlecsandri, "Miroslava", "3"), { lat: 47.1443845, lng: 27.5287153, exact: true });
});

test("adresa: „Strada Lăpușneanu 10, Iași” găsită în Podu Iloaiei nu e acceptată", () => {
  assert.equal(alegeAdresa(lapusneanu, "Iași", "10"), null);
  assert.ok(alegeAdresa(lapusneanu, "Podu Iloaiei", "10"));
});

test("adresa: în localitate (fără diacritice, litere mici); exact doar cu numărul găsit; București", () => {
  assert.deepEqual(alegeAdresa(carol, "IASI", "11"), { lat: 47.1742067, lng: 27.5713755, exact: true });
  assert.equal(alegeAdresa(carol, "Iași", "12")?.exact, false, "alt număr = doar strada");
  assert.equal(inLocalitate({ lat: "0", lon: "0", address: { city: "București", suburb: "Sector 1" } }, "Sectorul 1", true), true);
  assert.equal(inLocalitate({ lat: "0", lon: "0", address: { municipality: "Zona Metropolitană Iași", village: "Valea Lupului" } }, "Iași"), false);
});

test("gasesteAdresa: cele două adrese din alte localități → null (formularul cere mutarea pinului); Carol I 11 → Iași", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const u = new URL(String(input));
    const street = u.searchParams.get("street") ?? "";
    const raspuns = (x: unknown) => new Response(JSON.stringify(x), { status: 200, headers: { "content-type": "application/json" } });
    if (!street && !u.searchParams.get("q")) return raspuns([{ lat: "47.1615", lon: "27.5837", address: { city: "Iași" } }]); // centrul Iașiului
    if (/Vasile Alecsandri/.test(street)) return raspuns(vasileAlecsandri);
    if (/Lăpușneanu/.test(street)) return raspuns(lapusneanu);
    if (/Carol I/.test(street)) return raspuns(carol);
    return raspuns([]);
  }) as typeof fetch;
  try {
    assert.equal(await gasesteAdresa("Strada Vasile Alecsandri", "3", "iasi", "iasi"), null);
    assert.equal(await gasesteAdresa("Strada Lăpușneanu", "10", "iasi", "iasi"), null);
    assert.deepEqual(await gasesteAdresa("Bulevardul Carol I", "11", "iasi", "iasi"), { lat: 47.1742067, lng: 27.5713755, exact: true });
  } finally {
    globalThis.fetch = orig;
  }
});

test("adresa: strada găsită trebuie să fie cea cerută (textul liber poate întoarce altă stradă din oraș)", () => {
  assert.equal(stradaPotrivita("Strada Alexandru Lăpușneanu", "Strada Lăpușneanu"), true);
  assert.equal(stradaPotrivita("Bulevardul Carol I", "Bd. Carol I"), true);
  assert.equal(stradaPotrivita("Strada Văleni", "Strada Balciu"), false);
  const valeni: RezultatAdresa[] = [{ lat: "47.1", lon: "27.5", address: { road: "Strada Văleni", city: "Iași" } }];
  assert.equal(alegeAdresa(valeni, "Iași", "", false, "Strada Balciu"), null);
  assert.ok(alegeAdresa(carol, "Iași", "11", false, "Bulevardul Carol I"));
});

test("gasesteZona: cartierul din localitatea aleasă, nu satul cu același nume („Tudor Vladimirescu, Iași”)", async () => {
  const { gasesteZona } = await import("@/lib/geocodare");
  const orig = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const u = new URL(String(input));
    const r = (x: unknown) => new Response(JSON.stringify(x), { status: 200, headers: { "content-type": "application/json" } });
    if (u.searchParams.get("q") === "Tudor Vladimirescu, Iași")
      return r([
        { lat: "47.1322851", lon: "26.7780097", address: { village: "Tudor Vladimirescu", municipality: "Mogoșești-Siret", county: "Iași" } },
        { lat: "47.1560029", lon: "27.6016607", address: { suburb: "Tudor Vladimirescu", city: "Iași", county: "Iași" } },
      ]);
    if (u.searchParams.get("city") === "Iași") return r([{ lat: "47.1615598", lon: "27.5837814", address: { city: "Iași" } }]);
    return r([]);
  }) as typeof fetch;
  try {
    assert.deepEqual(await gasesteZona("Tudor Vladimirescu", "iasi", "iasi"), { lat: 47.1560029, lng: 27.6016607 });
  } finally {
    globalThis.fetch = orig;
  }
});
