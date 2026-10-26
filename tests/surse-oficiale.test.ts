import { test } from "node:test";
import assert from "node:assert/strict";
import { JUDETE as judete } from "@/modules/judete";
import { PUBLICURI, STIRE_TVA, STIRI, STIRI_PIATA } from "@/lib/continut";
import { ORASE_IMPOZITE, REGULI_NATIONALE, caleImpozite, impoziteOras } from "@/lib/impozite-locale";
import { oficial, presaAprobata } from "@/lib/surse";

// Regula casei: legislația vine doar din surse oficiale, nu din presă.
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
test("știrile de piață vin doar din presa aprobată și au dată", () => {
  for (const s of STIRI_PIATA) {
    assert.ok(presaAprobata(s.url), `sursă neaprobată: ${s.url}`);
    assert.match(s.data, /^\d{2}\.\d{2}\.\d{4}$/);
  }
});

test("panoul refuză sursele neoficiale", () => {
  assert.ok(oficial("https://www.primariaarad.ro/hcl.pdf"));
  assert.ok(oficial("https://legislatie.just.ro/Public/DetaliiDocument/1"));
  for (const u of ["https://www.bzi.ro/x", "https://www.antena3.ro/x", "javascript:alert(1)", "https://primaria.ro.evil.com/x", "nu e link"]) assert.ok(!oficial(u), u);
  assert.ok(!presaAprobata("https://www.bzi.ro/x"));
  assert.ok(presaAprobata("https://www.profit.ro/x"));
});
