import { test } from "node:test";
import assert from "node:assert/strict";
import { anuntDinPagina, decodeaza, esteLinkAnuntAgentie, paginaDisparuta, pozeDinSite, valoriFormular, judetPentruOras, listaAnunturi, paginiDeListaDinSitemap, robotsPermite } from "@/lib/import-site-softimobiliar";

// Pagină sintetică după șablonul Soft Imobiliar (aceleași clase și structură, date inventate).
const PAGINA = `<!doctype html><html><head><base href="https://agentie.test/" />
<script type="application/ld+json">{"@context":"https://schema.org","@type":"RealEstateListing","name":"Ap 3 camere Tudor","offers":{"@type":"Offer","priceCurrency":"EUR","price":"245000"}}</script>
<meta property="og:image" content="https://agentie.test/images/propertiessite/img_900_1.jpg"></head><body>
<ul itemscope itemtype="http://schema.org/BreadcrumbList" class="breadcrumb"><li><a href="apartamente-de-vanzare/iasi-8449/1"><span>Apartamente de vanzare Iasi</span></a></li></ul>
<h1 class="title link fw-8">Tudor – Iulius Mall 3 camere decomandat, Etaj 2</h1>
<div class="box-price d-flex align-items-end"><h3 class="fw-8"> 245,000 EUR</h3></div>
<div class="info-box"><div class="label">Locatie</div><p class="meta-item"><span class="icon"></span><span class="text-variant-1">Tudor Vladimirescu, Iasi</span></p></div>
<a href="https://agentie.test/images/propertiessite/img_900_1.jpg" class="d-block gallery" data-fancybox="gallery"><img src="x"></a>
<a href="images/propertiessite/img_900_2.jpg" title="" class="item box-img" data-fancybox="gallery"></a>
<div class="text-variant-1" id="summary-description"><p data-pm-slice=&quot;1 1 []&quot;>Situat &amp;icirc;n zon&amp;#259;,\r\n<strong>etaj 2</strong>.</p><p>Liber.</p></div>
<a href="javascript://" id="see-more-btn" class="btn-view"></a>
<ul class="info-box"><li class="item"><div class="content"><span class="label">ID:</span><span>902</span></div></li>
<li class="item"><div class="content"><span class="label">Tip:</span><span>Apartament</span></div></li>
<li class="item"><div class="content"><span class="label">Camere:</span><span>3</span></div></li>
<li class="item"><div class="content"><span class="label">Zona:</span><span>Tudor Vladimirescu</span></div></li></ul>
<div class="inner-box"><span class="label text-black-3">Suprafață utilă: </span><div class="content text-black-3"> 73.65 mp </div></div>
</body></html>`;

test("anunț Soft Imobiliar → rând de import", () => {
  const r = anuntDinPagina(PAGINA, "https://agentie.test/apartament-3-camere-de-vanzare-tudor-vladimirescu-iasi-900.html");
  assert.ok("rand" in r, "eroare" in r ? r.eroare : "");
  assert.equal(r.externId, "902");
  assert.deepEqual(
    { ...r.rand, descriere: undefined },
    {
      titlu: "Tudor – Iulius Mall 3 camere decomandat, Etaj 2",
      descriere: undefined,
      tip: "apartament",
      tranzactie: "vanzare",
      pret: "245000",
      suprafata: "74",
      camere: "3",
      judet: "Iași",
      oras: "Iasi",
      zona: "Tudor Vladimirescu",
      poze: "https://agentie.test/images/propertiessite/img_900_1.jpg https://agentie.test/images/propertiessite/img_900_2.jpg",
      moneda: "EUR",
    },
  );
  assert.equal(r.rand.descriere, "Situat în zonă,\netaj 2 .\nLiber.");
});

test("închiriere, sat din jur și pagină care nu e anunț", () => {
  const html = PAGINA.replace("Tudor Vladimirescu, Iasi", "Horpaz").replace(/<span class="label">Zona:<\/span><span>[^<]*<\/span>/, "");
  const r = anuntDinPagina(html, "https://agentie.test/casa-vila-4-camere-de-inchiriat-horpaz-5387.html", { judet: "Iași", oras: "Iași" });
  assert.ok("rand" in r);
  assert.equal(r.rand.tranzactie, "inchiriere");
  assert.equal(r.rand.oras, "Iași");
  assert.equal(r.rand.zona, "Horpaz");
  assert.ok("eroare" in anuntDinPagina("<html><body>404</body></html>", "https://agentie.test/x-12.html"));
});

test("listă: anunțuri și paginare, fără paginile de agent", () => {
  const html = `<base href="https://agentie.test/" /><a href="garsoniera-de-vanzare-copou-iasi-31629.html">a</a>
    <a href="garsoniera-de-vanzare-copou-iasi-31629.html">a</a><a href="https://agentie.test/oferte-agent-ion-pop-8-1.html">agent</a>
    <a href="/apartamente-de-vanzare/iasi-8449/2">2</a><a href="/case-de-vanzare/iasi-8449/1">alta listă</a>`;
  const l = listaAnunturi(html, "https://agentie.test/apartamente-de-vanzare/iasi-8449/1");
  assert.deepEqual(l.anunturi, ["https://agentie.test/garsoniera-de-vanzare-copou-iasi-31629.html"]);
  assert.deepEqual(l.pagini, ["https://agentie.test/apartamente-de-vanzare/iasi-8449/2"]);
  const sm = `<urlset><url><loc>https://agentie.test/case-de-vanzare/iasi-8449/1</loc></url><url><loc>https://agentie.test/case-de-vanzare/iasi-8449/copou-1/1</loc></url><url><loc>https://agentie.test/a-1.html</loc></url></urlset>`;
  assert.deepEqual(paginiDeListaDinSitemap(sm), ["https://agentie.test/case-de-vanzare/iasi-8449/1"]);
});

test("robots.txt, entități, județ din oraș", () => {
  const robots = "User-agent: *\nDisallow: /crm/\nAllow: /\nsitemap: https://agentie.test/sitemap.xml";
  assert.equal(robotsPermite(robots, "/crm/login"), false);
  assert.equal(robotsPermite(robots, "/apartament-1.html"), true);
  assert.equal(robotsPermite("User-agent: CheiaMeaBot\nDisallow: /\n\nUser-agent: *\nAllow: /", "/x"), false);
  assert.equal(decodeaza("&amp;icirc;n &amp;#539;ar&amp;#259;"), "în țară");
  assert.equal(judetPentruOras("Iasi"), "Iași");
});

test("import din link (ca la OLX): linkul, pagina dispărută și valorile formularului", () => {
  const link = "https://agentie.test/apartament-3-camere-de-vanzare-tudor-vladimirescu-iasi-900.html";
  assert.equal(esteLinkAnuntAgentie(link), true);
  assert.equal(esteLinkAnuntAgentie("https://agentie.test/apartamente-de-vanzare/iasi-8449/1"), false);
  assert.equal(esteLinkAnuntAgentie("https://agentie.test/oferte-agent-ion-11-1.html"), false);
  assert.equal(esteLinkAnuntAgentie("ftp://agentie.test/a-1.html"), false);

  const u = new URL(link);
  assert.equal(paginaDisparuta(u, u, 200), false);
  assert.equal(paginaDisparuta(u, u, 404), true);
  assert.equal(paginaDisparuta(u, new URL("https://agentie.test/apartamente-de-vanzare/iasi-8449/1"), 200), true);

  const r = anuntDinPagina(PAGINA, link);
  assert.ok("rand" in r);
  const v = valoriFormular(r.rand);
  assert.equal(v.judet, "iasi");
  assert.equal(v.oras, "iasi");
  assert.equal(v.zona, "Tudor Vladimirescu");
  assert.equal(v.pret, "245000");
  assert.equal(v.tip, "apartament");
  assert.equal(v.tranzactie, "vanzare");
  assert.equal(v.camere, "3");
  assert.ok(!("poze" in v));
});

test("pozele din import: doar galeria de pe același site, JPG/WebP, fără dubluri, cel mult max", () => {
  const link = "https://agentie.test/apartament-3-camere-de-vanzare-tudor-vladimirescu-iasi-900.html";
  const r = anuntDinPagina(PAGINA, link);
  assert.ok("rand" in r);
  assert.deepEqual(pozeDinSite(r.rand.poze.split(" "), link, 10), [
    "https://agentie.test/images/propertiessite/img_900_1.jpg",
    "https://agentie.test/images/propertiessite/img_900_2.jpg",
  ]);
  const lista = [
    "https://www.agentie.test/a/1.jpeg",
    "https://agentie.test/a/1.jpeg",
    "https://agentie.test/a/1.jpeg",
    "http://agentie.test/a/2.jpg",
    "https://alt-site.test/a/3.jpg",
    "https://agentie.test/a/4.png",
    "https://user:p@agentie.test/a/5.jpg",
    "https://agentie.test/a/6.webp",
    "https://agentie.test/a/7.jpg",
  ];
  assert.deepEqual(pozeDinSite(lista, link, 10), ["https://www.agentie.test/a/1.jpeg", "https://agentie.test/a/1.jpeg", "https://agentie.test/a/6.webp", "https://agentie.test/a/7.jpg"]);
  assert.equal(pozeDinSite(lista, link, 2).length, 2);
  assert.deepEqual(pozeDinSite(lista, "nu e link", 10), []);
});
