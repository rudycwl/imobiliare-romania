import { test } from "node:test";
import assert from "node:assert/strict";
import { citesteFeed, numarFeed } from "@/lib/feed-xml";
import { cheieProprietate, suprafataApropiata } from "@/lib/duplicate";
import { evolutiePret } from "@/lib/istoric-pret";

const rand = (r: ReturnType<typeof citesteFeed>["anunturi"][number]) => {
  assert.ok(!("eroare" in r), "eroare" in r ? r.eroare : "");
  return r as Exclude<typeof r, { eroare: string }>;
};

test("formatul CheiaMea (românește), cu poze ca listă", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><anunturi><anunt><id>AP-1</id><titlu>Apartament 2 camere Tătărași</titlu><descriere><![CDATA[<p>Renovat</p>]]></descriere>
    <tip>apartament</tip><tranzactie>vanzare</tranzactie><pret moneda="EUR">89.000</pret><suprafata>54,5</suprafata><camere>2</camere>
    <judet>Iași</judet><oras>Iași</oras><zona>Tătărași</zona><poze><poza>https://a.ro/1.jpg</poza><poza>https://a.ro/2.jpg</poza></poze></anunt>
    <anunt><id>AP-2</id><titlu>Garsonieră Copou</titlu><tip>garsoniera</tip><tranzactie>inchiriere</tranzactie><pret>350</pret><suprafata>30</suprafata><judet>Iași</judet><oras>Iași</oras></anunt></anunturi>`;
  const f = citesteFeed(xml, null);
  assert.equal(f.anunturi.length, 2);
  const a = rand(f.anunturi[0]);
  assert.equal(a.externId, "AP-1");
  assert.equal(a.rand.pret, "89000");
  assert.equal(a.rand.suprafata, "55");
  assert.equal(a.rand.descriere, "Renovat");
  assert.equal(a.rand.poze, "https://a.ro/1.jpg https://a.ro/2.jpg");
  const b = rand(f.anunturi[1]);
  assert.equal(b.rand.tip, "apartament");
  assert.equal(b.rand.camere, "1");
  assert.equal(b.rand.tranzactie, "inchiriere");
});

test("format englezesc, cu localizarea grupată, atribute și preț în lei", () => {
  const xml = `<listings><listing id="X9"><title>Casa 4 camere Bucium</title><property_type>House</property_type><offer_type>Sale</offer_type>
    <price currency="RON">500000</price><usable_area>120</usable_area><rooms>4</rooms>
    <location><county>Iasi</county><city>Iasi</city><neighborhood>Bucium</neighborhood></location>
    <images><image url="https://a.ro/c1.jpg"/><image url="https://a.ro/c2.jpg"/></images></listing></listings>`;
  const a = rand(citesteFeed(xml, 5).anunturi[0]);
  assert.equal(a.externId, "X9");
  assert.equal(a.rand.tip, "casa");
  assert.equal(a.rand.tranzactie, "vanzare");
  assert.equal(a.rand.pret, "100000");
  assert.equal(a.rand.zona, "Bucium");
  assert.equal(a.rand.oras, "Iasi");
  assert.equal(a.rand.poze, "https://a.ro/c1.jpg https://a.ro/c2.jpg");
});

test("un singur anunț în fișier și anunț fără cod", () => {
  const unu = citesteFeed(`<root><offer><ref>R1</ref><title>Teren intravilan 1000 mp</title><type>land</type><transaction>sale</transaction><price>20000</price><area>1000</area><city>Iasi</city></offer></root>`, null);
  assert.equal(rand(unu.anunturi[0]).rand.tip, "teren");
  const faraCod = citesteFeed(`<a><b><titlu>Apartament de vanzare</titlu><pret>1</pret><oras>Iasi</oras><suprafata>50</suprafata></b><b><titlu>Ap 2</titlu><pret>2</pret><oras>Iasi</oras><suprafata>40</suprafata></b></a>`, null);
  assert.ok("eroare" in faraCod.anunturi[0]);
});

test("moneda necunoscută și prețul în lei fără curs dau eroare pe anunț", () => {
  const f = citesteFeed(`<x><y><id>1</id><titlu>Ap test</titlu><pret currency="USD">1000</pret><oras>Iasi</oras></y><y><id>2</id><titlu>Ap test</titlu><pret currency="RON">1000</pret><oras>Iasi</oras></y></x>`, null);
  assert.ok("eroare" in f.anunturi[0] && /USD/.test(f.anunturi[0].eroare));
  assert.ok("eroare" in f.anunturi[1] && /curs/.test(f.anunturi[1].eroare));
});

test("fișier care nu e feed", () => {
  assert.throws(() => citesteFeed("<html><body>nimic</body></html>", null), /Nu am găsit anunțuri/);
});

test("numerele din feed", () => {
  assert.equal(numarFeed("85.000"), 85000);
  assert.equal(numarFeed("85,000"), 85000);
  assert.equal(numarFeed("85000.00"), 85000);
  assert.equal(numarFeed("54,5"), 54.5);
  assert.equal(numarFeed("1.250.000 €"), 1250000);
  assert.equal(numarFeed(""), null);
});

test("aceeași proprietate: cheia și suprafața ±3%", () => {
  const a = { judet: "iasi", oras: "iasi", zona: "Tătărași", tip: "apartament", tranzactie: "vanzare", camere: 2 };
  assert.equal(cheieProprietate(a), cheieProprietate({ ...a, zona: "tatarasi" }));
  assert.notEqual(cheieProprietate(a), cheieProprietate({ ...a, camere: 3 }));
  assert.ok(suprafataApropiata(54, 55));
  assert.ok(!suprafataApropiata(54, 60));
});

test("evoluția prețului: scădere, zile pe piață, schimbări comasate", () => {
  const z = (d: string) => new Date(`2026-${d}T10:00:00Z`);
  const e = evolutiePret([{ pret: 100000, la: z("10-01") }, { pret: 100000, la: z("10-05") }, { pret: 95000, la: z("10-20") }], 95000, z("10-01"), z("11-01"));
  assert.deepEqual(e.scadere, { procent: 5, dela: 100000 });
  assert.equal(e.schimbari.length, 2);
  assert.equal(e.zile, 31);
  assert.equal(evolutiePret([{ pret: 100, la: z("10-01") }], 100, z("10-01"), z("10-01")).scadere, null);
});
