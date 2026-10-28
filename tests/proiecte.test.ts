import { test } from "node:test";
import assert from "node:assert/strict";
import { disponibile, finalGratuit, parseazaUnitati, pretMinim, textDisponibile, unitatiDinJson, unitatiInText } from "@/lib/proiecte-unitati";
import { LUNI_GRATUITE_PROIECT, PRET_PROIECT_LUNAR } from "@/lib/tarife";

test("parseazaUnitati citește rândurile din panou", () => {
  const { unitati, eroare } = parseazaUnitati("Apartament; 2; 54,5; 89.000; 3; disponibil\n\nPenthouse; 4; 120; ; P+8; Vândut\nGaraj;;15;7000");
  assert.equal(eroare, undefined);
  assert.deepEqual(unitati, [
    { tip: "Apartament", camere: 2, suprafata: 54.5, pret: 89000, etaj: "3", stare: "disponibil" },
    { tip: "Penthouse", camere: 4, suprafata: 120, pret: null, etaj: "P+8", stare: "vandut" },
    { tip: "Garaj", camere: null, suprafata: 15, pret: 7000, stare: "disponibil" },
  ]);
});

test("parseazaUnitati arată rândul greșit", () => {
  assert.match(parseazaUnitati("Apartament; 2; 54; 89000\nStudio; 1; mic; 50000").eroare ?? "", /Rândul 2.*suprafața/);
  assert.match(parseazaUnitati("Apartament; 2; 54; 89000; 1; închiriat").eroare ?? "", /starea/);
  assert.match(parseazaUnitati("; 2; 54").eroare ?? "", /tipul/);
});

test("unitatiInText și parseazaUnitati sunt inverse", () => {
  const { unitati } = parseazaUnitati("Apartament; 2; 54; 89000; 3; rezervat\nCasă; 5; 160; ; ; disponibil");
  assert.deepEqual(parseazaUnitati(unitatiInText(unitati)).unitati, unitati);
});

test("unitatiDinJson ignoră valorile greșite din baza de date", () => {
  assert.deepEqual(unitatiDinJson(null), []);
  assert.deepEqual(unitatiDinJson([{ tip: "Apartament", suprafata: 50, stare: "rezervat" }, { tip: 3 }, "x"]), [
    { tip: "Apartament", camere: null, suprafata: 50, pret: null, stare: "rezervat" },
  ]);
});

test("disponibile, pretMinim și textul numără doar unitățile libere", () => {
  const { unitati } = parseazaUnitati("A; 2; 50; 90000; ; disponibil\nB; 3; 70; 70000; ; vandut\nC; 1; 35; 60000");
  assert.equal(disponibile(unitati), 2);
  assert.equal(pretMinim(unitati), 60000);
  assert.equal(pretMinim([]), null);
  assert.equal(textDisponibile(1), "1 unitate disponibilă");
  assert.equal(textDisponibile(0), "0 unități disponibile");
  assert.equal(textDisponibile(25), "25 de unități disponibile");
});

test("oferta pentru dezvoltatori: 3 luni gratuit, apoi 500 lei pe lună", () => {
  assert.equal(PRET_PROIECT_LUNAR, 500);
  assert.equal(LUNI_GRATUITE_PROIECT, 3);
  assert.equal(finalGratuit(new Date(2026, 9, 28), LUNI_GRATUITE_PROIECT).toDateString(), new Date(2027, 0, 28).toDateString());
});
