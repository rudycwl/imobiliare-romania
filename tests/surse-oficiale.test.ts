import { test } from "node:test";
import assert from "node:assert/strict";
import { JUDETE as judete } from "@/modules/judete";
import { PUBLICURI, STIRE_TVA, STIRI, STIRI_PIATA } from "@/lib/continut";
import { ORASE_IMPOZITE, REGULI_NATIONALE, caleImpozite, impoziteOras } from "@/lib/impozite-locale";

// Regula casei: legislația vine doar din surse oficiale, nu din presă.
const OFICIALE = ["legislatie.just.ro", "static.anaf.ro", "monitoruloficial.ro", "mfinante.gov.ro", "primaria-iasi.ro", "primariaclujnapoca.ro", "doc.pmb.ro", "mol.oradea.ro", "ploiesti.ro", "sibiu.ro", "spit-ct.ro", "dfbv.ro", "primariatm.ro", "primariacraiova.ro", "municipiulbacau.ro", "primariapn.ro", "primariaslatina.ro", "pmtgv.ro", "primariacalarasi.ro", "primariabistrita.ro", "miercureaciuc.ro", "primariasv.ro", "tirgumures.ro", "primariagalati.ro"];
const oficial = (url: string) => OFICIALE.some((d) => new URL(url).hostname.endsWith(d));

test("toate linkurile din legislație duc la surse oficiale", () => {
  const linkuri = [
    ...STIRI.map((s) => s.sursa.url),
    STIRE_TVA.url,
    ...PUBLICURI.flatMap((p) => p.reguli.flatMap((r) => (r.sursa ? [r.sursa.url] : []))),
    ...REGULI_NATIONALE.map((r) => r.sursa.url),
    ...ORASE_IMPOZITE.flatMap((o) => o.surse.map((s) => s.url)),
  ];
  for (const u of linkuri) assert.ok(oficial(u), `sursă neoficială: ${u}`);
});

test("orașele cu impozite există în lista de județe și au căi unice", () => {
  const cai = new Set<string>();
  for (const o of ORASE_IMPOZITE) {
    const j = judete.find((x) => x.slug === o.judet);
    assert.ok(j, o.judet);
    if (o.oras) assert.ok(j.orase.some((x) => x.slug === o.oras), `${o.judet}/${o.oras}`);
    assert.ok(o.surse.length > 0 && o.cote.length > 0);
    cai.add(caleImpozite(o));
  }
  assert.equal(cai.size, ORASE_IMPOZITE.length);
  assert.equal(impoziteOras("bucuresti", "sector-3")?.nume, "București");
  assert.equal(impoziteOras("iasi", "pascani"), undefined);
});

// Știrile de piață: doar presa aprobată de Rudy (25.10.2026). BZI și Antena 3 sunt excluse.
const PRESA = ["agerpres.ro", "g4media.ro", "hotnews.ro", "biziday.ro", "profit.ro", "revistabiz.ro"];

test("știrile de piață vin doar din presa aprobată și au dată", () => {
  for (const s of STIRI_PIATA) {
    assert.ok(PRESA.some((d) => new URL(s.url).hostname.endsWith(d)), `sursă neaprobată: ${s.url}`);
    assert.match(s.data, /^\d{2}\.\d{2}\.\d{4}$/);
  }
});
