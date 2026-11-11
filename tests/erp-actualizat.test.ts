import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// P1.2 (ERP CheiaMea, 11.11.2026): ERP-ul trebuie să vadă și modificările ulterioare (storno, e-Factura, plăți respinse, conturi).
const ruta = readFileSync("src/app/api/erp/route.ts", "utf8");
const schema = readFileSync("prisma/schema.prisma", "utf8");

test("modelele Comanda, Factura și Utilizator au actualizatLa (@updatedAt)", () => {
  for (const model of ["Comanda", "Factura", "Utilizator"]) {
    const bloc = schema.slice(schema.indexOf(`model ${model} {`), schema.indexOf("\n}", schema.indexOf(`model ${model} {`)));
    assert.match(bloc, /actualizatLa\s+DateTime\s+@default\(now\(\)\)\s+@updatedAt/, model);
  }
});

test("există migrarea care adaugă coloanele", () => {
  const dir = readdirSync("prisma/migrations").find((d) => d.endsWith("_actualizat_la_erp"));
  assert.ok(dir, "lipsește migrarea *_actualizat_la_erp");
  const sql = readFileSync(`prisma/migrations/${dir}/migration.sql`, "utf8");
  for (const t of ["Comanda", "Factura", "Utilizator"]) assert.match(sql, new RegExp(`ALTER TABLE "${t}" ADD COLUMN\\s+"actualizatLa"`), t);
});

test("/api/erp filtrează plățile, facturile și conturile și după actualizatLa", () => {
  assert.equal((ruta.match(/\{ actualizatLa: \{ gte: de \} \}/g) || []).length, 3);
  assert.match(ruta, /referintaId: f\.referintaId/);
});
