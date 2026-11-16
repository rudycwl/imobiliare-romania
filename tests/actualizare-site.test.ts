import { test } from "node:test";
import assert from "node:assert/strict";
import { anuntDinPagina, decizii, diferentaPoze, type Verificare } from "@/lib/import-site-softimobiliar";

const ok: Verificare = { tip: "ok", externId: "1", rand: {} };
const lipsa: Verificare = { tip: "disparut" };
const cazut: Verificare = { tip: "eroare", motiv: "timeout" };

test("pagina dispărută: prima dată se notează, a doua oară la rând se retrage", () => {
  const d = decizii([
    { anuntId: 1, proprietarId: "A", lipsuriInainte: 0, v: lipsa },
    { anuntId: 2, proprietarId: "A", lipsuriInainte: 1, v: lipsa },
    { anuntId: 3, proprietarId: "A", lipsuriInainte: 1, v: cazut },
    { anuntId: 4, proprietarId: "A", lipsuriInainte: 0, v: ok },
  ]);
  assert.equal(d.get(1), "noteaza-disparut");
  assert.equal(d.get(2), "retrage");
  assert.equal(d.get(3), "nimic"); // site-ul nu răspunde: nu atingem nimic
  assert.equal(d.get(4), "actualizeaza");
});

test("protecția: peste 30% eșecuri la o agenție (min. 5 anunțuri) → nu retragem nimic; altă agenție nu e afectată", () => {
  const lista = [
    ...[1, 2, 3, 4, 5, 6, 7].map((id) => ({ anuntId: id, proprietarId: "A", lipsuriInainte: 1, v: ok })),
    { anuntId: 8, proprietarId: "A", lipsuriInainte: 1, v: lipsa },
    { anuntId: 9, proprietarId: "A", lipsuriInainte: 1, v: lipsa },
    { anuntId: 10, proprietarId: "A", lipsuriInainte: 1, v: cazut },
    { anuntId: 11, proprietarId: "A", lipsuriInainte: 1, v: cazut },
    { anuntId: 20, proprietarId: "B", lipsuriInainte: 1, v: lipsa },
  ];
  const d = decizii(lista); // A: 4 eșecuri din 11 = 36%
  assert.equal(d.get(8), "nimic");
  assert.equal(d.get(9), "nimic");
  assert.equal(d.get(1), "actualizeaza");
  assert.equal(d.get(20), "retrage");
  // A cu 3 eșecuri din 11 (27%): retragerea merge
  const d2 = decizii(lista.filter((x) => x.anuntId !== 11));
  assert.equal(d2.get(8), "retrage");
});

test("pozele: se schimbă doar când galeria de pe site se schimbă", () => {
  const ex = [
    { id: 1, sursaUrl: "https://a.test/1.jpg" },
    { id: 2, sursaUrl: "https://a.test/2.jpg" },
    { id: 3, sursaUrl: null }, // pusă de mână
  ];
  const gal = ["https://a.test/1.jpg", "https://a.test/2.jpg", "https://a.test/9.jpg"]; // 9 scoasă de agenție la import
  assert.deepEqual(diferentaPoze(ex, null, gal, 10), { deSters: [], deAdaugat: [] }); // prima verificare
  assert.deepEqual(diferentaPoze(ex, gal, [...gal].reverse(), 10), { deSters: [], deAdaugat: [] }); // aceeași galerie
  assert.deepEqual(diferentaPoze(ex, gal, ["https://a.test/1.jpg", "https://a.test/9.jpg", "https://a.test/4.jpg"], 10), {
    deSters: [2],
    deAdaugat: ["https://a.test/4.jpg"], // nu și 9, pe care agenția a scos-o
  });
  const multe = Array.from({ length: 10 }, (_, i) => ({ id: i, sursaUrl: `https://a.test/${i}.jpg` }));
  const g = multe.map((p) => p.sursaUrl);
  assert.deepEqual(diferentaPoze(multe, g, [...g, "https://a.test/n.jpg"], 10).deAdaugat, []); // max 10
});

test("pagina de listă sub linkul anunțului nu e anunț (contează ca dispărut)", () => {
  const lista = `<!doctype html><html><body><h1>Apartamente de vanzare Iasi</h1><a href="apartament-x-de-vanzare-iasi-1.html">x</a></body></html>`;
  const r = anuntDinPagina(lista, "https://agentie.test/apartament-3-camere-de-vanzare-iasi-900.html");
  assert.ok("eroare" in r && /nu e un anunț|nu are cod/.test(r.eroare));
});
