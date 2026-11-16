import { test } from "node:test";
import assert from "node:assert/strict";
import { blocuriDescriere, extrageCaracteristici, localizare, numar, randuriCaracteristici, textLocalizare } from "@/lib/anunt-format";

// Textul anunțului 6 de pe cheiamea.ro (16.11.2026).
const ANUNT_6 =
  "Apartament cu 3 camere, decomandat, situat în zona Tudor Vladimirescu, la doar un minut de Iulius Mall, într-un complex rezidențial modern, construit în 2019, cu acces securizat, supraveghere video și două lifturi Schindler.\n\nSituat la etajul 2 din 11 , apartamentul are o suprafață totală de 79,69 mp, din care 73,65 mp utili și balcon de 6,04 mp.\n\nLocuința beneficiază de o compartimentare practică, cu living spațios și luminos, două dormitoare, bucătărie separată, două băi și balcon.\n\nAvantajele proprietății:\n\nOrientare sud-vestică, cu lumină naturală\n\nDouă aparate de aer condiționat\n\nÎncălzire centralizată, cu contorizare individuală\n\nClasă energetică A\n\nMobilat și utilat conform fotografiilor\n\nBloc modern, cu acces securizat și monitorizare video\n\nLocalizarea este unul dintre principalele avantaje: Iulius Mall, Kaufland, Lidl, universitățile și mijloacele de transport sunt în imediata apropiere, oferind acces rapid la facilitățile orașului.\n\nO proprietate potrivită atât pentru o familie care își dorește confort și accesibilitate, cât și pentru investiție, într-o zonă cu cerere constantă pentru închiriere.\n\nPreț: 245.000 euro. Se acceptă credit bancar.\n\nApartamentul este liber și disponibil imediat.\n\nPentru detalii suplimentare și programarea unei vizionări, contactați Stil Imobil Iași.";

const ACUM = new Date("2026-11-16");

test("localizare: zonă, oraș, județ fără dublură", () => {
  const t = (z: string | null, o: string, j: string, s?: string) => textLocalizare(localizare(z, o, j, s), s);
  assert.equal(t("Tudor Vladimirescu", "Iași", "Iași", "iasi"), "Tudor Vladimirescu, Iași (jud. Iași)");
  assert.equal(t("", "Iași", "Iași", "iasi"), "Iași (jud. Iași)");
  assert.equal(t(null, "Iași", "Iași"), "Iași (jud. Iași)");
  assert.equal(t("Iasi", "Iași", "Iași"), "Iași (jud. Iași)");
  assert.equal(t("Mănăștur", "Cluj-Napoca", "Cluj", "cluj"), "Mănăștur, Cluj-Napoca (jud. Cluj)");
  assert.equal(t("Titan", "Sector 3", "București", "bucuresti"), "Titan, Sector 3, București");
  assert.equal(t(null, "Sector 1", "București", "bucuresti"), "Sector 1, București");
});

test("numar: virgulă zecimală și punct de mii", () => {
  assert.equal(numar("79,69"), 79.69);
  assert.equal(numar("1.200"), 1200);
  assert.equal(numar("79.69"), 79.69);
});

test("caracteristici din anunțul 6", () => {
  assert.deepEqual(extrageCaracteristici(ANUNT_6, ACUM), {
    etaj: "2/11",
    anConstructie: 2019,
    clasaEnergetica: "A",
    bai: 2,
    balcon: "Da, 6 m²",
    incalzire: "Centralizată",
    mobilare: "Mobilat și utilat",
    suprafataUtila: 74,
    suprafataTotala: 80,
  });
});

test("caracteristici: variante și formulări", () => {
  assert.equal(extrageCaracteristici("Etaj 3/4, bloc reabilitat.").etaj, "3/4");
  assert.equal(extrageCaracteristici("Apartament la parter din 4.").etaj, "Parter/4");
  assert.equal(extrageCaracteristici("Situat la etajul 5.").etaj, "5");
  assert.equal(extrageCaracteristici("Are o baie și balcon închis.").bai, 1);
  assert.equal(extrageCaracteristici("3 băi, 2 balcoane.").bai, 3);
  assert.equal(extrageCaracteristici("3 băi, 2 balcoane.").balcon, "2 balcoane");
  assert.equal(extrageCaracteristici("Centrală termică proprie și încălzire în pardoseală.").incalzire, "Centrală proprie, În pardoseală");
  assert.equal(extrageCaracteristici("Încălzire pe gaz.").incalzire, "Pe gaz");
  assert.equal(extrageCaracteristici("Se predă nemobilat.").mobilare, "Nemobilat");
  assert.equal(extrageCaracteristici("Garsonieră mobilată.").mobilare, "Mobilat");
  assert.equal(extrageCaracteristici("Clasa energetica B.").clasaEnergetica, "B");
  assert.equal(extrageCaracteristici("Suprafața utilă: 52 mp.").suprafataUtila, 52);
  assert.equal(extrageCaracteristici("Bloc finalizat în 2024.", ACUM).anConstructie, 2024);
});

test("caracteristici: nu ghicește", () => {
  const c = extrageCaracteristici(
    "Zonă centrală, aproape de mall. Clasa energetică a fost evaluată. Fără balcon. Prețul din 2019 a crescut. Etajul 7 din 4.",
    ACUM,
  );
  assert.equal(c.incalzire, undefined);
  assert.equal(c.clasaEnergetica, undefined);
  assert.equal(c.balcon, undefined);
  assert.equal(c.anConstructie, undefined);
  assert.equal(c.etaj, undefined);
  assert.equal(extrageCaracteristici("Construit în 2099.", ACUM).anConstructie, undefined);
  assert.deepEqual(extrageCaracteristici("Apartament frumos, luminos, aproape de școală."), {});
});

test("rânduri caracteristici: câmpurile rămân, extragerea se adaugă", () => {
  const r = randuriCaracteristici(
    { tranzactie: "vanzare", tip: "apartament", suprafata: 74, camere: 3 },
    extrageCaracteristici(ANUNT_6, ACUM),
    { tranzactie: "Vânzare", tip: "Apartament" },
  );
  assert.deepEqual(
    r.map((x) => `${x.eticheta}: ${x.valoare}`),
    [
      "Tranzacție: Vânzare",
      "Tip: Apartament",
      "Suprafață utilă: 74 m²",
      "Suprafață totală: 80 m²",
      "Camere: 3",
      "Băi: 2",
      "Etaj: 2/11",
      "An construcție: 2019",
      "Balcon: Da, 6 m²",
      "Încălzire: Centralizată",
      "Mobilare: Mobilat și utilat",
      "Clasă energetică: A",
    ],
  );
});

test("descrierea anunțului 6: lista de după „Avantajele proprietății:”", () => {
  const b = blocuriDescriere(ANUNT_6);
  const i = b.findIndex((x) => x.tip === "titlu");
  assert.deepEqual(b[i], { tip: "titlu", text: "Avantajele proprietății:" });
  assert.deepEqual(b[i + 1], {
    tip: "lista",
    elemente: [
      "Orientare sud-vestică, cu lumină naturală",
      "Două aparate de aer condiționat",
      "Încălzire centralizată, cu contorizare individuală",
      "Clasă energetică A",
      "Mobilat și utilat conform fotografiilor",
      "Bloc modern, cu acces securizat și monitorizare video",
    ],
  });
  assert.equal(b[i + 2].tip, "p");
  assert.equal(b.filter((x) => x.tip === "p").length, 8);
  assert.equal(b.filter((x) => x.tip === "lista").length, 1);
});

test("descriere: rânduri goale multiple, marcaje, rânduri scurte", () => {
  assert.deepEqual(blocuriDescriere("Primul.\n\n\n\nAl doilea.\nContinuare."), [
    { tip: "p", text: "Primul." },
    { tip: "p", text: "Al doilea.\nContinuare." },
  ]);
  assert.deepEqual(blocuriDescriere("Dotări:\n- aer condiționat\n- parchet\nVă așteptăm."), [
    { tip: "titlu", text: "Dotări:" },
    { tip: "lista", elemente: ["aer condiționat", "parchet"] },
    { tip: "p", text: "Vă așteptăm." },
  ]);
  assert.deepEqual(blocuriDescriere("Text.\n• unu\n• doi"), [
    { tip: "p", text: "Text." },
    { tip: "lista", elemente: ["unu", "doi"] },
  ]);
  assert.deepEqual(blocuriDescriere("Gresie\nFaianță\nUși noi\n\nDetalii la telefon."), [
    { tip: "lista", elemente: ["Gresie", "Faianță", "Uși noi"] },
    { tip: "p", text: "Detalii la telefon." },
  ]);
  // Două rânduri scurte nu fac o listă; nici un titlu fără elemente.
  assert.deepEqual(blocuriDescriere("Str. Lungă 5\nIași"), [{ tip: "p", text: "Str. Lungă 5\nIași" }]);
  assert.deepEqual(blocuriDescriere("Preț:\nNegociabil la vizionare."), [{ tip: "p", text: "Preț:\nNegociabil la vizionare." }]);
});
