import { test } from "node:test";
import assert from "node:assert/strict";
import { latimiMobil } from "@/lib/caracteristici-liste";

const lat = (tip: string) => [...latimiMobil(tip)].sort();

test("telefon: „Regim de înălțime” și listele lungi pe tot rândul; niciun câmp scurt singur pe jumătate de rând", () => {
  // Apartament: [Sup. utilă, Sup. totală] [Camere, Etaj] [Regim] [An, Băi] [Încălzire] [Mobilare] [AC] [Clasă]
  assert.deepEqual(lat("apartament"), ["aerConditionat", "clasaEnergetica", "etajeTotal", "incalzire", "mobilare"]);
  // Casă (fără etaj): Camere ar rămâne singur înaintea „Regim de înălțime” → tot rândul; An și Băi rămân pereche.
  assert.deepEqual(lat("casa"), ["aerConditionat", "camere", "clasaEnergetica", "etajeTotal", "incalzire", "mobilare"]);
  // Spațiu comercial: [Sup., Sup. totală] [Etaj] [Regim] [An] …
  assert.deepEqual(lat("spatiu-comercial"), ["aerConditionat", "anConstructie", "clasaEnergetica", "etaj", "etajeTotal", "incalzire"]);
  assert.deepEqual(lat("teren"), ["suprafata"]);
});
