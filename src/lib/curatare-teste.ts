import "server-only";
import { db } from "./db";

// Plățile de test NETOPIA (sandbox, 22–23.10.2026) se șterg singure la pornirea aplicației, cerut de Rudy pe 25.10.
// Aceeași regulă ca butonul din /admin/plati: doar plățile fără factură emisă, făcute înainte de 24.10.2026.
// Prima plată reală (7 lei, factura CHM0001) rămâne mereu.
const PLATA_REALA = "CMMVL3DHFL34FE54";
const PANA_LA = new Date("2026-10-24T00:00:00+03:00");

type Rezultat = { cand: string; sterse: number; pastrateCuFactura: number } | { cand: string; eroare: string };
// Pe globalThis: instrumentarea și rutele au module separate, iar /stare trebuie să vadă rezultatul.
const g = globalThis as { __curatarePlati?: Rezultat };
export const ultimaCuratare = () => g.__curatarePlati ?? null;

/**
 * Factura CHM0001 s-a legat în baza de date de plata de test din 23.10 (17:26), nu de plata reală (17:55), deși cele
 * două sunt identice (aceeași sumă, același produs, același client). O mutăm pe plata reală (aprobat de Rudy pe 25.10);
 * în Oblio nu se schimbă nimic. Apoi plata de test rămâne fără factură și se șterge mai jos.
 */
async function leagaFacturaDePlataReala() {
  const reala = await db.comanda.findUnique({ where: { id: PLATA_REALA } });
  if (!reala || (await db.factura.findFirst({ where: { plataRef: PLATA_REALA } }))) return;
  const f = await db.factura.findFirst({ where: { seria: "CHM", numar: { in: ["0001", "1"] }, tip: "factura" } });
  if (!f?.plataRef || f.plataRef === PLATA_REALA) return;
  const test = await db.comanda.findUnique({ where: { id: f.plataRef } });
  if (!test || test.creatLa >= PANA_LA || test.sumaBani !== reala.sumaBani || test.produs !== reala.produs || test.utilizatorId !== reala.utilizatorId) return;
  await db.factura.update({ where: { id: f.id }, data: { plataRef: PLATA_REALA } });
  console.log(`Factura CHM0001 legată de plata reală (era pe ${test.id}).`);
}

export async function curataPlatiTest() {
  try {
    await leagaFacturaDePlataReala();
    const vechi = await db.comanda.findMany({ where: { creatLa: { lt: PANA_LA }, id: { not: PLATA_REALA } }, select: { id: true } });
    const ids = vechi.map((c) => c.id);
    const facturate = await db.factura.findMany({
      where: { plataRef: { in: ids }, OR: [{ seria: { not: null } }, { stare: { in: ["emisa", "stornata"] } }] },
      select: { plataRef: true },
    });
    const deSters = ids.filter((id) => !facturate.some((f) => f.plataRef === id));
    if (deSters.length)
      await db.$transaction([
        db.factura.deleteMany({ where: { plataRef: { in: deSters }, seria: null } }),
        db.comanda.deleteMany({ where: { id: { in: deSters } } }),
      ]);
    g.__curatarePlati = { cand: new Date().toISOString(), sterse: deSters.length, pastrateCuFactura: facturate.length };
    if (deSters.length) console.log(`Plăți de test șterse: ${deSters.length}`);
  } catch (e) {
    g.__curatarePlati = { cand: new Date().toISOString(), eroare: e instanceof Error ? e.message.trim().slice(0, 200) : String(e) };
    console.error("Curățarea plăților de test:", e);
  }
}
