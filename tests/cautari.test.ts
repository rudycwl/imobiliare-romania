import { test } from "node:test";
import assert from "node:assert/strict";
import { curataFiltre, descriereCautare, linkCautare } from "@/lib/cautari";

test("curataFiltre păstrează doar filtrele cunoscute și valide", () => {
  const f = curataFiltre({ judet: "iasi", oras: "iasi", tip: "apartament", sort: "pret-asc", rau: "x", poze: "da", supMin: " 50 " });
  assert.deepEqual(f, { judet: "iasi", oras: "iasi", tip: "apartament", supMin: "50" });
});

test("curataFiltre scoate orașul fără județ și județele inexistente", () => {
  assert.deepEqual(curataFiltre({ oras: "iasi" }), {});
  assert.deepEqual(curataFiltre({ judet: "atlantida" }), {});
});

test("descrierea căutării salvate include suprafața și pozele", () => {
  const d = descriereCautare({ tip: "apartament", judet: "iasi", supMin: "50", supMax: "80", poze: "1" });
  assert.match(d, /50–80 m²/);
  assert.match(d, /cu poze/);
});

test("linkCautare duce la pagina orașului, cu restul filtrelor în adresă", () => {
  assert.equal(linkCautare({ judet: "iasi", oras: "iasi", camere: "2" }), "/iasi/iasi?camere=2");
  assert.equal(linkCautare({ q: "centru" }), "/cautare?q=centru");
});
