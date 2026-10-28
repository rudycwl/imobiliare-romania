import { test } from "node:test";
import assert from "node:assert/strict";
import { anuntIndisponibil, numeSite } from "@/lib/import-anunt";

const cerut = new URL("https://www.olx.ro/d/292354072/");

test("anunț OLX inactiv: redirect pe prima pagină sau titlul generic", () => {
  assert.equal(anuntIndisponibil("<title>x</title>", cerut, new URL("https://www.olx.ro/")), true);
  assert.equal(anuntIndisponibil("<title>Anunturi Gratuite - Peste 4 milioane anunturi - OLX.ro</title>", cerut, cerut), true);
  assert.equal(anuntIndisponibil("", cerut, cerut, 404), true);
  assert.equal(anuntIndisponibil("<p>Acest anunț nu mai este disponibil</p>", cerut, cerut), true);
});

test("anunț activ: nu e marcat inactiv", () => {
  const html = `<title>Apartament 2 camere Copou - OLX.ro</title><script type="application/ld+json">{"@type":"Product","name":"Apartament 2 camere","offers":{"price":"89000","priceCurrency":"EUR"}}</script>`;
  const u = new URL("https://www.olx.ro/d/oferta/apartament-2-camere-copou-IDabc.html");
  assert.equal(anuntIndisponibil(html, u, u), false);
  assert.equal(numeSite(u), "OLX");
  assert.equal(numeSite(new URL("https://www.storia.ro/ro/oferta/x")), "Storia");
});
