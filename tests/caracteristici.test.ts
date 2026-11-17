import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { extrageCaracteristici, randuriCaracteristici } from "@/lib/anunt-format";
import {
  actualizareCaracteristici,
  caracteristiciAfisate,
  caracteristiciDinDescriere,
  caracteristiciDinRand,
  citesteCaracteristici,
  valoriCaracteristici,
  type CampuriCaracteristici,
} from "@/lib/caracteristici";
import { campuriTip, CAMPURI_TIP, DOTARI, DOTARI_TIP, ORDINE_CAMPURI } from "@/lib/caracteristici-liste";
import { citesteFeed } from "@/lib/feed-xml";
import { anuntDinPagina, valoriFormular } from "@/lib/import-site-softimobiliar";
import { extrageAnunt } from "@/lib/import-anunt";
import { distantaM, punctPublic, RAZA_APROXIMATIVA_M } from "@/lib/locatie";
import { TIPURI, TRANZACTII } from "@/lib/etichete";

const ACUM = new Date("2026-11-17");
// Textele anunțurilor 3–6 de pe cheiamea.ro, copiate de pe site la 17.11.2026.
const text = (n: number) => readFileSync(join(__dirname, "date", "anunturi", `anunt-${n}.txt`), "utf8");

const randuri = (a: { tip: string; tranzactie: string; suprafata: number; camere: number | null; descriere: string } & Partial<CampuriCaracteristici>) =>
  randuriCaracteristici(a, caracteristiciAfisate(a, ACUM), { tranzactie: TRANZACTII[a.tranzactie as "vanzare"], tip: TIPURI[a.tip as "apartament"] }).map(
    (r) => `${r.eticheta}: ${r.valoare}`,
  );

test("anunțul 3 (apartament Podu Roș): semidecomandat, centrală termică proprie, AC", () => {
  assert.deepEqual(randuri({ tip: "apartament", tranzactie: "vanzare", suprafata: 50, camere: 2, descriere: text(3) }), [
    "Tranzacție: Vânzare",
    "Tip: Apartament",
    "Suprafață utilă: 50 m²",
    "Camere: 2",
    "Compartimentare: Semidecomandat",
    "Etaj: 1/4",
    "Încălzire: Centrală proprie",
    "Mobilare: Mobilat și utilat",
    "Aer condiționat: Da",
  ]);
});

test("anunțul 4 (spațiu birouri): suprafață utilă, dotări ca etichete", () => {
  const r = randuriCaracteristici(
    { tip: "birouri", tranzactie: "inchiriere", suprafata: 80, camere: null },
    caracteristiciAfisate({ tip: "birouri", descriere: text(4) }, ACUM),
    { tranzactie: "Închiriere", tip: "Spații birouri" },
  );
  assert.deepEqual(
    r.map((x) => `${x.eticheta}: ${x.valoare}`),
    [
      "Tranzacție: Închiriere",
      "Tip: Spații birouri",
      "Suprafață utilă: 80 m²",
      "Încălzire: Centrală proprie",
      "Aer condiționat: Da",
      "Dotări: Amenajat pentru birouri, Grup sanitar propriu, Chicinetă / bucătărie, Frigider",
    ],
  );
  assert.deepEqual(r.at(-1)?.lista, ["Amenajat pentru birouri", "Grup sanitar propriu", "Chicinetă / bucătărie", "Frigider"]);
});

test("anunțul 5 (English Park): AC nou, centrala nouă, balcon închis, nerenovat, nimic din „direct de la proprietar”", () => {
  const c = extrageCaracteristici(text(5), ACUM);
  assert.equal(c.aerConditionat, "Da");
  assert.equal(c.incalzire, "Centrală proprie");
  assert.equal(c.balcon, "Da, închis");
  assert.equal(c.stare, "Necesită renovare");
  assert.deepEqual(randuri({ tip: "apartament", tranzactie: "vanzare", suprafata: 57, camere: 3, descriere: text(5) }), [
    "Tranzacție: Vânzare",
    "Tip: Apartament",
    "Suprafață utilă: 57 m²",
    "Camere: 3",
    "Etaj: 3/4",
    "An construcție: 1967",
    "Stare: Necesită renovare",
    "Balcon: Da, închis",
    "Încălzire: Centrală proprie",
    "Aer condiționat: Da",
    "Dotări: Termopane",
  ]);
});

test("anunțul 6 (Tudor): decomandat, lift, rândurile complete", () => {
  assert.deepEqual(randuri({ tip: "apartament", tranzactie: "vanzare", suprafata: 74, camere: 3, descriere: text(6) }), [
    "Tranzacție: Vânzare",
    "Tip: Apartament",
    "Suprafață utilă: 74 m²",
    "Suprafață totală: 80 m²",
    "Camere: 3",
    "Compartimentare: Decomandat",
    "Băi: 2",
    "Etaj: 2/11",
    "An construcție: 2019",
    "Balcon: Da, 6 m²",
    "Încălzire: Centralizată",
    "Mobilare: Mobilat și utilat",
    "Aer condiționat: Da, 2 aparate",
    "Clasă energetică: A",
    "Dotări: Lift, Acces securizat, Supraveghere video",
  ]);
});

test("extragere: nu ghicește din cuvinte apropiate", () => {
  const c = extrageCaracteristici("Zonă centrală, ACTE la zi, renovare în curs la bloc vecin. Fără aer condiționat. Vânzare direct de la proprietar.", ACUM);
  assert.equal(c.incalzire, undefined);
  assert.equal(c.aerConditionat, undefined);
  assert.equal(c.stare, undefined);
  assert.equal(c.compartimentare, undefined);
  assert.equal(extrageCaracteristici("Apartament renovat complet, bloc nou.").stare, "Nou");
  assert.equal(extrageCaracteristici("Proaspăt renovat, finisaje noi.").stare, "Renovat");
  assert.equal(extrageCaracteristici("Garsonieră nedecomandată.").compartimentare, "Nedecomandat");
  assert.equal(extrageCaracteristici("Open space luminos.").compartimentare, "Open space");
  assert.equal(extrageCaracteristici("Balcon închis de 4 mp.").balcon, "Da, închis, 4 m²");
});

test("lista câmpurilor pe tip: un singur loc, teren fără etaj și băi, casă fără etaj", () => {
  for (const tip of Object.keys(TIPURI)) {
    assert.ok(CAMPURI_TIP[tip as keyof typeof CAMPURI_TIP], tip);
    for (const d of DOTARI_TIP[tip as keyof typeof DOTARI_TIP]) assert.ok(d in DOTARI, d);
    assert.ok(campuriTip(tip).every((c) => ORDINE_CAMPURI.includes(c.camp)));
  }
  const teren = campuriTip("teren").map((c) => c.camp);
  assert.ok(!teren.includes("etaj") && !teren.includes("bai") && teren.includes("suprafata"));
  const casa = campuriTip("casa").map((c) => c.camp);
  assert.ok(!casa.includes("etaj") && casa.includes("etajeTotal"));
  assert.ok(campuriTip("apartament").find((c) => c.camp === "compartimentare")?.obligatoriu);
  assert.ok(campuriTip("apartament").find((c) => c.camp === "stare")?.obligatoriu);
  assert.equal(campuriTip("apartament").find((c) => c.camp === "dotari")?.obligatoriu, false);
});

const din = (o: Record<string, string | string[]>) => ({
  get: (k: string) => {
    const v = o[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  },
  getAll: (k: string) => {
    const v = o[k];
    return Array.isArray(v) ? v : v ? [v] : [];
  },
});

const APARTAMENT_COMPLET = {
  suprafata: "74", suprafataTotala: "80", camere: "3", compartimentare: "decomandat", etaj: "2", etajeTotal: "11",
  anConstructie: "2019", stare: "bun", bai: "2", balcon: "da", balconInchis: "da", balconMp: "6", incalzire: "centralizata",
  mobilare: "mobilat-utilat", aerConditionat: "2", clasaEnergetica: "A", dotari: ["lift", "parcare", "piscina"], strada: "Strada Palat",
};

test("validare: apartament complet → date curate (dotări doar din lista tipului)", () => {
  const f = din(APARTAMENT_COMPLET);
  const r = citesteCaracteristici(f.get, f.getAll, "apartament", { acum: ACUM });
  assert.deepEqual(r.erori, []);
  assert.deepEqual(r.date, {
    etaj: 2, etajeTotal: 11, anConstructie: 2019, clasaEnergetica: "A", bai: 2, balcon: true, balconInchis: true, balconMp: 6,
    incalzire: "centralizata", mobilare: "mobilat-utilat", aerConditionat: 2, suprafataTotala: 80, compartimentare: "decomandat",
    stare: "bun", dotari: ["lift", "parcare"],
  });
});

test("validare: câmpurile obligatorii lipsă, în ordinea din formular", () => {
  const f = din({ suprafata: "50" });
  const r = citesteCaracteristici(f.get, f.getAll, "apartament", { acum: ACUM });
  assert.deepEqual(
    r.erori.map((e) => e.camp),
    ["camere", "suprafataTotala", "compartimentare", "etaj", "etajeTotal", "anConstructie", "stare", "bai", "balcon", "incalzire", "mobilare", "aerConditionat", "clasaEnergetica", "strada"],
  );
  assert.equal(r.erori.find((e) => e.camp === "etaj")?.mesaj, "Completează „Etaj”.");
  // Feed / CSV: nu se cer.
  assert.deepEqual(citesteCaracteristici(f.get, f.getAll, "apartament", { cuObligatorii: false }).erori, []);
});

test("validare: valori greșite și reguli între câmpuri", () => {
  const e = (o: Record<string, string>, tip = "apartament") => {
    const f = din({ ...APARTAMENT_COMPLET, ...o });
    return citesteCaracteristici(f.get, f.getAll, tip, { acum: ACUM }).erori.map((x) => x.camp);
  };
  assert.deepEqual(e({ etaj: "12", etajeTotal: "4" }), ["etaj"]);
  assert.deepEqual(e({ suprafataTotala: "60" }), ["suprafataTotala"]);
  assert.deepEqual(e({ anConstructie: "1500" }), ["anConstructie"]);
  assert.deepEqual(e({ anConstructie: "0" }), []); // „Nu știu”
  assert.deepEqual(e({ clasaEnergetica: "in-curs" }), []);
  assert.deepEqual(e({ clasaEnergetica: "Z" }), ["clasaEnergetica"]);
  assert.deepEqual(e({ incalzire: "lemne" }), ["incalzire"]);
  assert.deepEqual(e({ balcon: "nu", balconMp: "abc" }), []); // fără balcon, suprafața lui nu contează
  assert.deepEqual(e({ strada: "" }), ["strada"]);
  // Teren: doar suprafața, plus strada sau zona.
  const teren = (o: Record<string, string>) => {
    const f = din(o);
    return citesteCaracteristici(f.get, f.getAll, "teren").erori.map((x) => x.camp);
  };
  assert.deepEqual(teren({ suprafata: "500" }), ["strada"]);
  assert.deepEqual(teren({ suprafata: "500", zona: "Bucium" }), []);
  const f = din({ suprafata: "500", etaj: "3", bai: "2", zona: "Bucium" });
  const r = citesteCaracteristici(f.get, f.getAll, "teren");
  assert.equal(r.date.etaj, null);
  assert.equal(r.date.bai, null);
});

test("importuri: valori scrise liber în feed / CSV", () => {
  assert.deepEqual(
    caracteristiciDinRand(
      { etaj: "Parter", "Etaje total": "P+4", an_constructie: "1985", clasaEnergetica: "clasa B", nrBai: "1", balcon: "da, inchis", incalzire: "Centrala proprie pe gaz", mobilat: "semimobilat", aer_conditionat: "2", suprafata_totala: "62,5 mp", compartimentare: "Semidecomandat" },
      "apartament",
      ACUM,
    ),
    {
      etaj: 0, etajeTotal: 4, anConstructie: 1985, clasaEnergetica: "B", bai: 1, balcon: true, balconInchis: true, incalzire: "centrala-proprie",
      mobilare: "semimobilat", aerConditionat: 2, suprafataTotala: 63, compartimentare: "semidecomandat",
    },
  );
  assert.deepEqual(caracteristiciDinRand({ etaj: "3/8", aerConditionat: "nu", incalzire: "termoficare" }, "apartament"), { etaj: 3, etajeTotal: 8, aerConditionat: 0, incalzire: "centralizata" });
  // Casă: „P+1+M” = 3 niveluri; etajul nu se aplică.
  assert.deepEqual(caracteristiciDinRand({ etaj: "2", regim_inaltime: "P+1+M" }, "casa"), { etajeTotal: 3 });
  // Teren: nimic din acestea.
  assert.deepEqual(caracteristiciDinRand({ etaj: "2", bai: "1" }, "teren"), {});
});

test("feed XML: câmpurile de caracteristici ajung în rând", () => {
  const xml = `<anunturi><anunt><id>A1</id><titlu>Apartament 2 camere Copou</titlu><tip>apartament</tip><tranzactie>vanzare</tranzactie>
    <pret>90000</pret><suprafata>50</suprafata><judet>Iași</judet><oras>Iași</oras><etaj>3</etaj><nr_etaje>4</nr_etaje>
    <an_constructie>1980</an_constructie><bathrooms>1</bathrooms><heating>central heating</heating><furnished>yes</furnished></anunt></anunturi>`;
  const a = citesteFeed(xml, null).anunturi[0];
  assert.ok(!("eroare" in a));
  if ("eroare" in a) return;
  assert.equal(a.rand.etaj, "3");
  assert.equal(a.rand.etajeTotal, "4");
  assert.deepEqual(caracteristiciDinRand(a.rand, "apartament", ACUM), { etaj: 3, etajeTotal: 4, anConstructie: 1980, bai: 1, incalzire: "centrala-proprie", mobilare: "mobilat" });
});

test("pagina agenției (Soft Imobiliar): detaliile și descrierea precompletează formularul", () => {
  const html = `<html><h1>Apartament 3 camere Tudor</h1><div class="single-property"></div>
    <ul class="info-box"><li><span class="label">ID:</span><span>902</span></li><li><span class="label">Tip:</span><span>Apartament</span></li>
    <li><span class="label">Etaj:</span><span>2</span></li><li><span class="label">Nr. etaje:</span><span>P+10</span></li>
    <li><span class="label">An constructie:</span><span>2019</span></li><li><span class="label">Bai:</span><span>2</span></li></ul>
    <div class="box-price">245,000 EUR</div><div class="box"><div id="summary-description">Decomandat, centrală termică proprie, lift.</div></div></html>`;
  const r = anuntDinPagina(html, "https://www.agentie.ro/apartament-3-camere-de-vanzare-tudor-902.html", { judet: "Iași", oras: "Iași" });
  assert.ok(!("eroare" in r));
  if ("eroare" in r) return;
  const v = valoriFormular(r.rand);
  assert.equal(v.etaj, "2");
  assert.equal(v.etajeTotal, "10");
  assert.equal(v.anConstructie, "2019");
  assert.equal(v.bai, "2");
  assert.equal(v.compartimentare, "decomandat");
  assert.equal(v.incalzire, "centrala-proprie");
  assert.equal(v.dotari, "lift");
});

test("import din link (OLX): descrierea precompletează caracteristicile", () => {
  const html = `<html><head><meta property="og:title" content="Apartament 2 camere Copou - OLX"><meta property="og:description" content="Etajul 3 din 4, construit în 1985, centrală proprie, semidecomandat, balcon închis."></head></html>`;
  const v = extrageAnunt(html, new URL("https://www.olx.ro/d/oferta/apartament-2-camere-copou-IDabc.html"));
  assert.equal(v.etaj, "3");
  assert.equal(v.etajeTotal, "4");
  assert.equal(v.anConstructie, "1985");
  assert.equal(v.incalzire, "centrala-proprie");
  assert.equal(v.compartimentare, "semidecomandat");
  assert.equal(v.balcon, "da");
  assert.equal(v.balconInchis, "da");
});

test("actualizarea automată nu șterge ce s-a completat de mână", () => {
  const vechi: Partial<CampuriCaracteristici> = { etaj: 2, bai: 2, incalzire: "centralizata", dotari: ["lift"], stare: null };
  const r = actualizareCaracteristici(vechi, { etaj: 3 }, { bai: 1, stare: "renovat", dotari: ["parcare"], incalzire: "gaz" });
  // Sursa structurată înlocuiește etajul; din descriere doar starea (era goală); băile, încălzirea și dotările rămân.
  assert.deepEqual(r, { stare: "renovat", etaj: 3 });
  assert.deepEqual(actualizareCaracteristici({}, {}, {}), {});
});

test("pagina anunțului: câmpurile salvate au întâietate, descrierea completează golurile", () => {
  const c = caracteristiciAfisate(
    { tip: "apartament", descriere: text(6), etaj: 0, etajeTotal: 4, bai: null, aerConditionat: 0, balcon: false, anConstructie: 0, clasaEnergetica: "in-curs", dotari: [] },
    ACUM,
  );
  assert.equal(c.etaj, "Parter/4");
  assert.equal(c.bai, 2); // din descriere
  assert.equal(c.aerConditionat, "Nu");
  assert.equal(c.balcon, "Nu");
  assert.equal(c.anConstructie, undefined); // „Nu știu”: nu se afișează, nici din descriere
  assert.equal(c.clasaEnergetica, "În curs de obținere");
  assert.deepEqual(c.dotari, ["lift", "acces-securizat", "video"]);
  // Casă: niveluri în loc de etaj.
  const casa = caracteristiciAfisate({ tip: "casa", descriere: "Casă la parter.", etajeTotal: 2 }, ACUM);
  assert.equal(casa.etaj, undefined);
  assert.equal(casa.niveluri, 2);
});

test("formular: valorile salvate ca text și înapoi", () => {
  const v = valoriCaracteristici({ etaj: -1, balcon: true, balconInchis: false, dotari: ["lift", "boxa"], aerConditionat: 0 });
  assert.deepEqual(v, { etaj: "-1", balcon: "da", dotari: "lift,boxa", aerConditionat: "0" });
  assert.deepEqual(valoriCaracteristici(caracteristiciDinDescriere(text(5), "apartament", ACUM)), {
    etaj: "3", etajeTotal: "4", anConstructie: "1967", balcon: "da", balconInchis: "da", incalzire: "centrala-proprie", aerConditionat: "1",
    stare: "necesita-renovare", dotari: "termopan",
  });
});

test("locația pe site: exactă doar cu bifă; altfel un punct stabil, la 80–200 m, în cercul de 300 m", () => {
  const loc = { lat: 47.1530435, lng: 27.5880609 };
  assert.deepEqual(punctPublic({ id: 7, ...loc, punctProprietar: true, locatieExacta: true }), { ...loc, aproximativ: false });
  for (const id of [1, 2, 3, 50, 999, 123456]) {
    const p = punctPublic({ id, ...loc, punctProprietar: true, locatieExacta: false })!;
    assert.equal(p.aproximativ, true);
    const d = distantaM(loc, p);
    assert.ok(d > 60 && d < RAZA_APROXIMATIVA_M - 50, `id ${id}: ${d} m`);
    assert.deepEqual(punctPublic({ id, ...loc, punctProprietar: true, locatieExacta: false }), p); // același la fiecare afișare
  }
  assert.equal(punctPublic({ id: 1, lat: null, lng: null, punctProprietar: false, locatieExacta: false }), null);
  assert.deepEqual(punctPublic({ id: 1, ...loc, punctProprietar: false, locatieExacta: false }), { ...loc, aproximativ: true });
});
