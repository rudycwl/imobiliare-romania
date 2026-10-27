import { test } from "node:test";
import assert from "node:assert/strict";
import { calculeazaImpozit, coeficient, cotaDinText, rangImplicit } from "../src/lib/calcul-impozit";

const baza = { utila: false, material: "beton", instalatii: true, zona: "A", rang: "I", reducereVechime: 0, cota: 0.1, bonificatie: 0 } as const;

test("exemplul oficial Bacău: 70 m², beton, zona A rang I, 0,1% = 468 lei", () => {
  const r = calculeazaImpozit({ ...baza, suprafata: 70 });
  assert.equal(Math.round(r.valoare), 468_475);
  assert.equal(Math.round(r.impozit), 468);
});

test("suprafața utilă se înmulțește cu 1,4", () => {
  const r = calculeazaImpozit({ ...baza, suprafata: 50, utila: true });
  assert.equal(r.construita, 70);
});

test("reducerea de vechime, bonificația și pragul de 2.500.000 lei", () => {
  assert.equal(Math.round(calculeazaImpozit({ ...baza, suprafata: 70, reducereVechime: 25 }).valoare), Math.round(468_475 * 0.75));
  assert.equal(Math.round(calculeazaImpozit({ ...baza, suprafata: 70, bonificatie: 10 }).cuBonificatie), Math.round(468.475 * 0.9));
  const mare = calculeazaImpozit({ ...baza, suprafata: 500 });
  assert.ok(mare.valoare > 2_500_000);
  assert.equal(mare.lux, (mare.valoare - 2_500_000) * 0.009);
});

test("coeficienți, rang și cotă din text", () => {
  assert.equal(coeficient("A", "0"), 2.6);
  assert.equal(coeficient("D", "V"), 0.9);
  assert.equal(rangImplicit("bucuresti"), "0");
  assert.equal(rangImplicit("iasi", "iasi"), "I");
  assert.equal(rangImplicit("covasna", "sfantu-gheorghe"), "II");
  assert.equal(cotaDinText("0,107%"), 0.107);
  assert.equal(cotaDinText("10% pentru plata integrală"), 10);
  assert.equal(cotaDinText("fără"), undefined);
});
