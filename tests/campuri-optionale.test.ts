// Strada, starea și clasa energetică sunt opționale pentru toate conturile (agenții și persoane fizice);
// fără stradă și fără zonă rămâne cerința „Stradă sau zonă”. Formularul le cere la „Publică” într-o fereastră.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { campuriLipsaPublicare, citesteCaracteristici, stareDedusa } from "@/lib/caracteristici";
import { anuntDinPagina, esteLinkAnuntAgentie, valoriFormular } from "@/lib/import-site-softimobiliar";

const ACUM = new Date("2026-11-19T12:00:00Z");

const din = (o: Record<string, string | string[]>) => ({
  get: (k: string) => {
    const v = o[k];
    return Array.isArray(v) ? v.join(",") : v ?? "";
  },
  getAll: (k: string) => {
    const v = o[k];
    return Array.isArray(v) ? v : v ? [v] : [];
  },
});

// Ce completează de obicei o agenție sau un proprietar: fără stradă, stare și clasă energetică.
const FARA_CELE_TREI = {
  suprafata: "74", suprafataTotala: "80", camere: "3", compartimentare: "decomandat", etaj: "2", etajeTotal: "11",
  anConstructie: "2019", bai: "2", balcon: "da", incalzire: "centralizata", mobilare: "mobilat-utilat", aerConditionat: "2",
  zona: "Tudor Vladimirescu",
};

const erori = (o: Record<string, string | string[]>, tip = "apartament") => {
  const f = din(o);
  return citesteCaracteristici(f.get, f.getAll, tip, { acum: ACUM }).erori;
};

test("agenție: fără stradă, stare și clasă energetică (cu zonă) → fără erori de validare", () => {
  assert.deepEqual(erori(FARA_CELE_TREI), []);
  const { etaj: _e, ...casa } = FARA_CELE_TREI;
  assert.deepEqual(erori({ ...casa, etajeTotal: "2" }, "casa"), []);
});

test("persoană fizică: fără stradă, stare și clasă energetică (cu zonă) → fără erori de validare", () => {
  // Aceeași validare pentru toate conturile (server: citesteAnunt → citesteCaracteristici).
  assert.deepEqual(erori({ ...FARA_CELE_TREI, zona: "Copou" }), []);
});

test("fără stradă și fără zonă → „Stradă sau zonă”", () => {
  const e = erori({ ...FARA_CELE_TREI, zona: "" });
  assert.deepEqual(e, [{ camp: "strada", mesaj: "Completează „Stradă sau zonă”." }]);
  assert.deepEqual(erori({ ...FARA_CELE_TREI, zona: "", strada: "Strada Palat" }), []);
});

test("valorile greșite la stare și clasă energetică tot se resping", () => {
  assert.deepEqual(erori({ ...FARA_CELE_TREI, stare: "xyz" }).map((x) => x.camp), ["stare"]);
  assert.deepEqual(erori({ ...FARA_CELE_TREI, clasaEnergetica: "Z" }).map((x) => x.camp), ["clasaEnergetica"]);
});

test("fereastra de la „Publică”: doar câmpurile goale care apar pentru tip", () => {
  const get = (o: Record<string, string>) => (k: string) => o[k] ?? "";
  assert.deepEqual(campuriLipsaPublicare(get(FARA_CELE_TREI), "apartament"), ["strada", "stare", "clasaEnergetica"]);
  assert.deepEqual(campuriLipsaPublicare(get({ strada: "Palat", stare: "bun", clasaEnergetica: "A" }), "apartament"), []);
  assert.deepEqual(campuriLipsaPublicare(get({ strada: "Palat", clasaEnergetica: "in-curs" }), "casa"), ["stare"]);
  // Terenul nu are stare și clasă energetică.
  assert.deepEqual(campuriLipsaPublicare(get({ zona: "Bucium" }), "teren"), ["strada"]);
});

test("starea dedusă la import: doar clădire nouă după an, altfel goală", () => {
  assert.equal(stareDedusa({ anConstructie: 2026 }, ACUM), "nou");
  assert.equal(stareDedusa({ anConstructie: 2025 }, ACUM), "nou");
  assert.equal(stareDedusa({ anConstructie: 2027 }, ACUM), "nou");
  assert.equal(stareDedusa({ anConstructie: 2019 }, ACUM), undefined);
  assert.equal(stareDedusa({ anConstructie: 0 }, ACUM), undefined);
  assert.equal(stareDedusa({}, ACUM), undefined);
});

test("pagina Stil Imobil (35590): importul și validarea pentru agenție trec", () => {
  const url = "https://www.stilimobil.ro/apartament-3-camere-de-vanzare-tudor-vladimirescu-iasi-35590.html";
  assert.ok(esteLinkAnuntAgentie(url));
  const html = readFileSync(join(__dirname, "date", "stilimobil-35590.html"), "utf8");
  const r = anuntDinPagina(html, url, { cursEuro: 5, judet: "iasi", oras: "iasi" });
  assert.ok(!("eroare" in r), JSON.stringify(r));
  if ("eroare" in r) return;
  const v = valoriFormular(r.rand, ACUM);
  assert.equal(v.tip, "apartament");
  assert.equal(v.pret, "245000");
  assert.equal(v.zona, "Tudor Vladimirescu");
  assert.equal(v.anConstructie, "2019");
  assert.equal(v.clasaEnergetica, "A");
  // Construit în 2019: starea nu reiese sigur, rămâne goală; strada lipsește din pagină.
  assert.equal(v.stare, undefined);
  assert.equal(v.strada, undefined);
  assert.deepEqual(erori(v, v.tip), []);
  assert.deepEqual(campuriLipsaPublicare((k) => v[k] ?? "", v.tip), ["strada", "stare"]);
});
