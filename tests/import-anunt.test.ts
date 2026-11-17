import { test } from "node:test";
import assert from "node:assert/strict";
import { anuntIndisponibil, extrageAnunt, numeSite } from "@/lib/import-anunt";

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

const ld = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

test("tipul și tranzacția vin din titlu și link, nu din descriere (Storia: apartament de vânzare cu „spații de depozitare”)", () => {
  const html = `<title>x</title>${ld({
    "@type": "Product",
    name: "Apartament 3 camere, Independentei-UMF",
    description: "BLITZ va propune spre vanzare un apartament cu 3 camere, hol generos si spatios, spatii depozitare. Se poate locui sau inchiria imediat, fiind renovat. Suprafata 64 mp.",
    offers: { price: "179500", priceCurrency: "EUR" },
  })}`;
  const r = extrageAnunt(html, new URL("https://www.storia.ro/ro/oferta/apartament-3-camere-independentei-umf-IDHXEx"));
  assert.equal(r.tip, "apartament");
  assert.equal(r.tranzactie, "vanzare");
  assert.equal(r.pret, "179500");
});

test("descrierea decide doar când titlul și linkul nu spun nimic", () => {
  const html = ld({ "@type": "Product", name: "Ocazie in Copou", description: "Ofer spre inchiriere un spatiu comercial de 40 mp." });
  const r = extrageAnunt(html, new URL("https://www.olx.ro/d/oferta/ocazie-IDabc.html"));
  assert.equal(r.tip, "spatiu-comercial");
  assert.equal(r.tranzactie, "inchiriere");
});

test("titlul: primul cuvânt cheie câștigă (casă cu teren / teren cu casă)", () => {
  const u = new URL("https://www.olx.ro/d/oferta/x-IDabc.html");
  assert.equal(extrageAnunt(ld({ "@type": "Product", name: "Casa cu teren 500 mp" }), u).tip, "casa");
  assert.equal(extrageAnunt(ld({ "@type": "Product", name: "Teren intravilan cu casa veche" }), u).tip, "teren");
});

test("OLX: preț în lei transformat în euro, localitatea din areaServed, suprafața din caracteristici", () => {
  const html = `${ld({
    "@type": "Product",
    name: "Apartament 2 Camere intabulat , Mutare imediata",
    description: "Apartament 2 camere finalizat si intabulat in Lunca Cetatuii. Cu loc de parcare inclus in pret.",
    category: "https://www.olx.ro/imobiliare/apartamente-garsoniere-de-vanzare/2-camere/",
    offers: { "@type": "Offer", areaServed: { "@type": "City", name: "Iasi" }, priceCurrency: "RON", price: 320366 },
  })}<ul><li><p>Compartimentare: Decomandat</p></li><li><p>Suprafata utila: 40 m²</p></li></ul>`;
  const u = new URL("https://www.olx.ro/d/oferta/apartament-2-camere-intabulat-mutare-imediata-IDkYjAR.html");
  const r = extrageAnunt(html, u, 5);
  assert.equal(r.pret, "64073");
  assert.equal(r.suprafata, "40");
  assert.equal(r.judet, "iasi");
  assert.equal(r.oras, "iasi");
  assert.equal(r.tranzactie, "vanzare");
  // Fără curs: prețul în lei nu se pune ca euro.
  assert.equal(extrageAnunt(html, u).pret, undefined);
});
