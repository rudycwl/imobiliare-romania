import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPret, slugify, textAnunturi } from "@/lib/etichete";
import { LUNGIME, preaLung } from "@/lib/lungimi";

test("textAnunturi acordă corect în română", () => {
  assert.equal(textAnunturi(1), "1 anunț");
  assert.equal(textAnunturi(2), "2 anunțuri");
  assert.equal(textAnunturi(19), "19 anunțuri");
  assert.equal(textAnunturi(20), "20 de anunțuri");
  assert.equal(textAnunturi(101), "101 anunțuri");
  assert.equal(textAnunturi(119), "119 anunțuri");
  assert.equal(textAnunturi(120), "120 de anunțuri");
});

test("slugify scoate diacriticele și spațiile", () => {
  assert.equal(slugify("Agenția Ștefan & Fiii"), "agentia-stefan-fiii");
});

test("formatPret arată „/lună” doar la închiriere", () => {
  assert.match(formatPret({ pret: 450, tranzactie: "inchiriere" }), /lun/);
  assert.doesNotMatch(formatPret({ pret: 90000, tranzactie: "vanzare" }), /lun/);
});

test("preaLung oprește textele prea lungi și le lasă pe cele normale", () => {
  assert.equal(preaLung([["Titlul", "Apartament 2 camere", LUNGIME.titlu]]), null);
  assert.equal(preaLung([["Zona", null, LUNGIME.zona]]), null);
  assert.equal(preaLung([["Titlul", "x".repeat(LUNGIME.titlu + 1), LUNGIME.titlu]]), `Titlul poate avea cel mult ${LUNGIME.titlu} de caractere.`);
});
