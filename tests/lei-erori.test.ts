import { test } from "node:test";
import assert from "node:assert/strict";
import { formatLei } from "@/lib/etichete";
import { citesteCurs } from "@/lib/curs";
import { deTrimis, eroareIgnorata } from "@/lib/raport-erori";

test("formatLei rotunjește la mie la vânzare și la zece lei la chirie", () => {
  assert.equal(formatLei({ pret: 90000, tranzactie: "vanzare" }, 5.0912), "≈ 458.000 lei");
  assert.equal(formatLei({ pret: 450, tranzactie: "inchiriere" }, 5.0912), "≈ 2.290 lei / lună");
  assert.equal(formatLei({ pret: 90000, tranzactie: "vanzare" }, null), "");
});

test("citesteCurs citește cursul din XML-ul BNR și BCE și refuză valori absurde", () => {
  assert.equal(citesteCurs('<Rate currency="USD">4.5</Rate><Rate currency="EUR">5.0912</Rate>', /<Rate currency="EUR">([\d.]+)<\/Rate>/), 5.0912);
  assert.equal(citesteCurs("<Cube currency='RON' rate='5.3492'/>", /currency=['"]RON['"]\s+rate=['"]([\d.]+)['"]/), 5.3492);
  assert.equal(citesteCurs('<Rate currency="EUR">0.2</Rate>', /<Rate currency="EUR">([\d.]+)<\/Rate>/), null);
  assert.equal(citesteCurs("pagină de eroare", /<Rate currency="EUR">([\d.]+)<\/Rate>/), null);
});

test("aceeași eroare pleacă pe email cel mult o dată pe oră", () => {
  const t = Date.parse("2026-10-25T10:00:00Z");
  assert.equal(deTrimis("server|/x|boom", t), true);
  assert.equal(deTrimis("server|/x|boom", t + 10 * 60_000), false);
  assert.equal(deTrimis("server|/x|boom", t + 61 * 60_000), true);
  assert.equal(deTrimis("server|/y|alta", t + 61 * 60_000), true);
});

test("erorile de tip „Failed to find Server Action” nu se trimit pe email", () => {
  assert.equal(eroareIgnorata("Failed to find Server Action. This request might be from an older or newer deployment."), true);
  assert.equal(eroareIgnorata("Cannot read properties of undefined"), false);
});
