import "server-only";
import { db } from "./db";

// Plățile de test NETOPIA (sandbox, 22–23.10.2026) se șterg singure la pornirea aplicației, cerut de Rudy pe 25.10.
// Aceeași regulă ca butonul din /admin/plati: doar plățile fără factură emisă, făcute înainte de 24.10.2026.
// Prima plată reală (7 lei, factura CHM0001) rămâne mereu.
const PLATA_REALA = "CMMVL3DHFL34FE54";
const PANA_LA = new Date("2026-10-24T00:00:00+03:00");

type Rezultat = { cand: string; legare?: string; sterse: number; neemiseSterse?: number; pastrateCuFactura: number } | { cand: string; eroare: string };
// Pe globalThis: instrumentarea și rutele au module separate, iar /stare trebuie să vadă rezultatul.
const g = globalThis as { __curatarePlati?: Rezultat };
export const ultimaCuratare = () => g.__curatarePlati ?? null;

/**
 * Factura CHM0001 s-a legat în baza de date de plata de test din 23.10 (17:26), nu de plata reală (17:55), deși cele
 * două sunt identice (aceeași sumă, același produs, același client). O mutăm pe plata reală (aprobat de Rudy pe 25.10);
 * în Oblio nu se schimbă nimic. Apoi plata de test rămâne fără factură și se șterge mai jos.
 */
async function leagaFacturaDePlataReala(): Promise<string> {
  const reala = await db.comanda.findUnique({ where: { id: PLATA_REALA } });
  if (!reala) return "fara-plata-reala";
  // Pe plata reală a rămas o factură neemisă (fără serie, „în așteptare”); o ștergem când mutăm CHM0001 pe ea.
  const peReala = await db.factura.findFirst({ where: { plataRef: PLATA_REALA } });
  if (peReala?.seria) return "deja-legata";
  // Factura emisă (are serie de la Oblio) care stă pe o altă plată din 23.10, cu aceeași sumă.
  const emise = await db.factura.findMany({ where: { tip: "factura", seria: { not: null }, plataRef: { not: null, notIn: [PLATA_REALA] } } });
  const candidate = [];
  for (const f of emise) {
    const test = await db.comanda.findUnique({ where: { id: f.plataRef! } });
    if (test && test.creatLa < PANA_LA && test.sumaBani === reala.sumaBani && f.totalBani === reala.sumaBani) candidate.push({ f, test });
  }
  if (candidate.length !== 1) return `candidate-${candidate.length}-din-${emise.length}`;
  const { f, test } = candidate[0];
  await db.$transaction([
    ...(peReala ? [db.factura.delete({ where: { id: peReala.id } })] : []),
    db.factura.update({ where: { id: f.id }, data: { plataRef: PLATA_REALA } }),
  ]);
  console.log(`Factura ${f.seria} ${f.numar} legată de plata reală (era pe ${test.id}).`);
  return peReala ? "legata-neemisa-stearsa" : "legata";
}

export async function curataPlatiTest() {
  try {
    const legare = await leagaFacturaDePlataReala();
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
    // Facturi neemise (fără serie) din perioada de test care nu mai stau pe nicio plată existentă.
    const comenzi = (await db.comanda.findMany({ select: { id: true } })).map((c) => c.id);
    const { count: neemiseSterse } = await db.factura.deleteMany({
      where: { tip: "factura", seria: null, stare: { in: ["in-asteptare", "eroare"] }, creatLa: { lt: PANA_LA }, OR: [{ plataRef: null }, { plataRef: { notIn: comenzi } }] },
    });
    g.__curatarePlati = { cand: new Date().toISOString(), legare, sterse: deSters.length, neemiseSterse, pastrateCuFactura: facturate.length };
    if (deSters.length) console.log(`Plăți de test șterse: ${deSters.length}`);
  } catch (e) {
    g.__curatarePlati = { cand: new Date().toISOString(), eroare: e instanceof Error ? e.message.trim().slice(0, 200) : String(e) };
    console.error("Curățarea plăților de test:", e);
  }
}
