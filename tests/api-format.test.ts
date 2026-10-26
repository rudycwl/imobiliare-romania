import { test } from "node:test";
import assert from "node:assert/strict";
import { randDinJson } from "@/lib/api-format";

test("randDinJson aduce anunțul din API la forma unui rând de import", () => {
  const r = randDinJson({ titlu: "Apartament 2 camere", pret: 89000, suprafata: 54.4, poze: ["https://a.ro/1.jpg", 3, "https://a.ro/2.jpg"], rau: "x" });
  assert.deepEqual(r, { titlu: "Apartament 2 camere", pret: "89000", suprafata: "54", poze: "https://a.ro/1.jpg https://a.ro/2.jpg" });
});

test("randDinJson rotunjește prețurile cu zecimale (punctul nu e citit ca separator de mii)", () => {
  assert.equal(randDinJson({ pret: 85000.6 }).pret, "85001");
});

test("randDinJson ignoră valorile care nu sunt obiecte", () => {
  assert.deepEqual(randDinJson(null), {});
  assert.deepEqual(randDinJson([1, 2]), {});
  assert.deepEqual(randDinJson("text"), {});
});
