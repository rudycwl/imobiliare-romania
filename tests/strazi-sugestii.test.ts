import { test } from "node:test";
import assert from "node:assert/strict";
import { filtreazaStrazi, normalizeazaStrada, type CandidatStrada } from "@/lib/geocodare";

const iasi = (nume: string, loc = "Iași"): CandidatStrada => ({ nume, localitati: [loc] });

test("normalizare: fără diacritice (și cu sedilă), punctuație, ortografia veche", () => {
  assert.equal(normalizeazaStrada("Strada Ion C. Brătianu"), "strada ion c bratianu");
  assert.equal(normalizeazaStrada("  ȘOSEAUA  Ștefan-cel-Mare "), "soseaua stefan cel mare");
  assert.equal(normalizeazaStrada("Strada Mihail Kogălniceanu ş ţ"), "strada mihail kogalniceanu s t");
  assert.equal(normalizeazaStrada("Stradela Ștefan cel Mare și Sfînt"), normalizeazaStrada("Stradela Stefan cel Mare si Sfant"));
  assert.equal(normalizeazaStrada("Înfrățirii"), "infratirii", "î la început de cuvânt rămâne i");
});

test("filtrare: „bratianu” găsește „Brătianu”, doar din localitatea aleasă, fără dubluri, cel mult 8", () => {
  const brut = [
    iasi("Strada Ion Constantin Brătianu"),
    iasi("Strada Ion Constantin Brătianu"), // altă bucată din aceeași stradă
    iasi("Strada Ion Constantin Bratianu"), // fără diacritice, tot aceeași
    iasi("Fundacul I. C. Brătianu", "Valea Lupului"), // altă localitate
    iasi("Strada Ciornei"), // nu conține textul
    { nume: "", localitati: ["Iași"] },
  ];
  assert.deepEqual(filtreazaStrazi(brut, "bratianu", "Iași"), ["Strada Ion Constantin Brătianu"]);
  assert.deepEqual(filtreazaStrazi(brut, "BRĂTI", "iasi"), ["Strada Ion Constantin Brătianu"], "început de cuvânt, orice formă");
  assert.deepEqual(filtreazaStrazi(brut, "atianu", "Iași"), [], "nu din mijlocul cuvântului");
  const multe = Array.from({ length: 20 }, (_, i) => iasi(`Strada Unirii ${i + 1}`));
  assert.equal(filtreazaStrazi(multe, "unirii", "Iași").length, 8);
  assert.equal(filtreazaStrazi(multe, "unirii", "Iași", 3).length, 3);
});

test("filtrare: toate cuvintele scrise; numele scurte și cele potrivite după nume (nu după „Strada”) primele", () => {
  const brut = [iasi("Bulevardul Ștefan cel Mare și Sfânt"), iasi("Șoseaua Ștefan cel Mare și Sfânt"), iasi("Strada Ștefan Procopiu"), iasi("Stradela Ștefan cel Mare și Sfînt")];
  assert.deepEqual(filtreazaStrazi(brut, "stefan mare", "Iași"), [
    "Șoseaua Ștefan cel Mare și Sfânt",
    "Stradela Ștefan cel Mare și Sfînt",
    "Bulevardul Ștefan cel Mare și Sfânt",
  ]);
  assert.deepEqual(filtreazaStrazi([iasi("Strada Sărărie"), iasi("Stradela Străpungerii")], "str", "Iași").length, 2);
  assert.deepEqual(filtreazaStrazi([{ nume: "Calea Victoriei", localitati: [undefined, "București"] }], "victoriei", "Sectorul 1", 8, true), ["Calea Victoriei"]);
  assert.deepEqual(filtreazaStrazi(brut, "  ", "Iași"), []);
});
