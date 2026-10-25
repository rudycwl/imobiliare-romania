import "server-only";
import type { Factura, Utilizator } from "@prisma/client";
import { db } from "../db";
import { getJudet, getOras } from "../geo";
import { emiteFacturaOblio, eFacturaOblio, oblioConfigurat, stareEFacturaOblio, stornoOblio, type ClientOblio, type ProdusOblio } from "./oblio";

// Facturarea plăților de pe site (promovări, abonamente agenții).
// Fluxul: plata confirmată de Netopia → emiteFactura() → Oblio dă seria/numărul,
// trimite PDF-ul pe email clientului și factura în e-Factura (SPV).
// Dacă Oblio nu e configurat sau nu răspunde, factura rămâne „în așteptare” și se reemite din /admin/facturi.

export type LinieFactura = { denumire: string; pretBani: number; cantitate?: number };

export type Cumparator = {
  nume: string;
  /** CUI pentru firme/agenții; gol pentru persoane fizice. */
  cui?: string | null;
  regCom?: string | null;
  adresa?: string | null;
  judet?: string | null;
  oras?: string | null;
  email?: string | null;
};

const ERORI_DE_PASTRAT = 500;

/** Cota de TVA: 0 dacă Hugetech nu e plătitoare de TVA (FACTURARE_PLATITOR_TVA nesetat). */
export function cotaTva() {
  if (process.env.FACTURARE_PLATITOR_TVA !== "da") return 0;
  return Number(process.env.FACTURARE_COTA_TVA ?? 21);
}

export function cumparatorDin(u: Pick<Utilizator, "tip" | "nume" | "cui" | "regCom" | "adresa" | "judet" | "oras" | "email">): Cumparator {
  const firma = u.tip !== "persoana-fizica";
  return {
    nume: u.nume,
    cui: firma ? u.cui : null,
    regCom: firma ? u.regCom : null,
    adresa: u.adresa,
    judet: getJudet(u.judet)?.nume ?? u.judet,
    oras: getOras(u.judet, u.oras)?.nume ?? u.oras,
    email: u.email,
  };
}

function laClientOblio(c: Cumparator): ClientOblio {
  return {
    name: c.nume,
    cif: c.cui || undefined,
    rc: c.regCom || undefined,
    address: c.adresa || c.oras || undefined,
    state: c.judet || undefined,
    city: c.oras || undefined,
    country: "România",
    email: c.email || undefined,
  };
}

function laProduseOblio(linii: LinieFactura[], cota: number): ProdusOblio[] {
  return linii.map((l) => ({
    name: l.denumire,
    price: l.pretBani / 100,
    quantity: l.cantitate ?? 1,
    measuringUnit: "buc",
    productType: "Serviciu",
    vatIncluded: 1,
    ...(cota > 0 && { vatName: "Normala", vatPercentage: cota }),
  }));
}

const mesaj = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, ERORI_DE_PASTRAT);

async function trimiteLaOblio(f: Factura) {
  if (!oblioConfigurat()) return f;
  try {
    const doc = await emiteFacturaOblio({
      client: laClientOblio(f.cumparator as Cumparator),
      products: laProduseOblio(f.produse as LinieFactura[], f.cotaTva),
      plataRef: f.plataRef ?? undefined,
      mentions: f.plataRef ? `Plată online, comanda ${f.plataRef}` : undefined,
    });
    return db.factura.update({
      where: { id: f.id },
      data: { stare: "emisa", seria: doc.seriesName, numar: doc.number, linkPdf: doc.link, emisaLa: new Date(), eroare: null, eFactura: "netrimisa" },
    });
  } catch (e) {
    return db.factura.update({ where: { id: f.id }, data: { stare: "eroare", eroare: mesaj(e) } });
  }
}

/**
 * Emite factura pentru o plată confirmată (de apelat din notificarea Netopia). Sigur de apelat
 * de mai multe ori pentru aceeași plată: o plată are o singură factură.
 */
export async function emiteFactura(p: { plataRef: string; utilizatorId: string; linii: LinieFactura[] }) {
  const existenta = await db.factura.findUnique({ where: { plataRef: p.plataRef } });
  // Neemisă încă sau cu eroare: se reemite doar din /admin/facturi, ca să nu iasă două facturi
  // dacă notificarea se repetă cât timp prima cerere către Oblio e în curs.
  if (existenta) return existenta;

  const u = await db.utilizator.findUniqueOrThrow({ where: { id: p.utilizatorId } });
  const f = await db.factura.create({
    data: {
      plataRef: p.plataRef,
      utilizatorId: u.id,
      cumparator: cumparatorDin(u),
      produse: p.linii,
      totalBani: p.linii.reduce((s, l) => s + l.pretBani * (l.cantitate ?? 1), 0),
      cotaTva: cotaTva(),
    },
  }).catch(async (e) => {
    // Două notificări simultane pentru aceeași plată: a doua o folosește pe prima.
    if ((e as { code?: string }).code === "P2002") return null;
    throw e;
  });
  return f ? trimiteLaOblio(f) : db.factura.findUniqueOrThrow({ where: { plataRef: p.plataRef } });
}

/** Reîncearcă emiterea unei facturi rămase în așteptare sau cu eroare. */
export async function reemiteFactura(id: number) {
  const f = await db.factura.findUniqueOrThrow({ where: { id } });
  if (f.tip !== "factura" || f.stare === "emisa" || f.stare === "stornata") return f;
  return trimiteLaOblio(f);
}

/** Storno total: se emite o factură cu minus, legată de cea inițială (ex. la rambursare). */
export async function storneazaFactura(id: number) {
  const f = await db.factura.findUniqueOrThrow({ where: { id } });
  if (f.tip !== "factura" || f.stare !== "emisa" || !f.seria || !f.numar) throw new Error("Se pot storna doar facturi emise.");
  if (!oblioConfigurat()) throw new Error("Programul de facturare nu e configurat.");
  const doc = await stornoOblio({ client: laClientOblio(f.cumparator as Cumparator), seriesName: f.seria, number: f.numar });
  const produse = (f.produse as LinieFactura[]).map((l) => ({ ...l, cantitate: -(l.cantitate ?? 1) }));
  return db.$transaction([
    db.factura.create({
      data: {
        tip: "storno",
        stare: "emisa",
        utilizatorId: f.utilizatorId,
        cumparator: f.cumparator as Cumparator,
        produse,
        totalBani: -f.totalBani,
        cotaTva: f.cotaTva,
        seria: doc.seriesName,
        numar: doc.number,
        linkPdf: doc.link,
        emisaLa: new Date(),
        eFactura: "netrimisa",
        referintaId: f.id,
      },
    }),
    db.factura.update({ where: { id: f.id }, data: { stare: "stornata" } }),
  ]);
}

const STARI_EFACTURA: Record<number, string> = { [-1]: "netrimisa", 0: "in-prelucrare", 1: "trimisa", 2: "eroare" };

/** Trimite factura în SPV (dacă nu s-a trimis automat) și salvează starea primită. */
export async function verificaEFactura(id: number) {
  const f = await db.factura.findUniqueOrThrow({ where: { id } });
  if (!f.seria || !f.numar) return f;
  try {
    // Întâi citim starea reală; trimitem doar dacă Oblio spune că nu e în SPV.
    const stare = await stareEFacturaOblio(f.seria, f.numar);
    const cod = stare === null || stare === -1 ? await eFacturaOblio(f.seria, f.numar) : stare;
    return db.factura.update({ where: { id }, data: { eFactura: STARI_EFACTURA[cod] ?? "in-prelucrare", eroare: null } });
  } catch (e) {
    return db.factura.update({ where: { id }, data: { eroare: mesaj(e) } });
  }
}

/** Doar citește din Oblio starea facturilor rămase „în prelucrare” (nu trimite nimic în SPV). */
export async function actualizeazaStariEFactura() {
  if (!oblioConfigurat()) return;
  const facturi = await db.factura.findMany({ where: { seria: { not: null }, eFactura: "in-prelucrare" } });
  for (const f of facturi) {
    const cod = await stareEFacturaOblio(f.seria!, f.numar!).catch(() => null);
    if (cod !== null && STARI_EFACTURA[cod] && STARI_EFACTURA[cod] !== f.eFactura)
      await db.factura.update({ where: { id: f.id }, data: { eFactura: STARI_EFACTURA[cod] } });
  }
}

/** Miezul nopții (ora României) din prima zi a lunii date. */
function inceputLuna(an: number, luna: number) {
  const utc = new Date(Date.UTC(an, luna - 1, 1));
  const ora = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Bucharest" }).format(utc));
  return new Date(utc.getTime() - ora * 3_600_000);
}

/** Intervalul [început, sfârșit) al unei luni „AAAA-LL”, după ora României. */
export function intervalLuna(luna: string) {
  const [a, l] = luna.split("-").map(Number);
  return { gte: inceputLuna(a, l), lt: inceputLuna(a, l + 1) };
}

export const lunaCurenta = () => new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", timeZone: "Europe/Bucharest" }).format(new Date());

export function listaFacturi(luna: string) {
  return db.factura.findMany({ where: { creatLa: intervalLuna(luna) }, orderBy: { id: "desc" } });
}

const ziua = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bucharest" }).format(d);
const lei = (bani: number) => (bani / 100).toFixed(2);
const celula = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;

/** Export CSV (Excel, separator „;”) cu facturile unei luni, pentru contabil. */
export async function exportCsv(luna: string) {
  const facturi = await db.factura.findMany({ where: { creatLa: intervalLuna(luna), seria: { not: null } }, orderBy: [{ seria: "asc" }, { numar: "asc" }] });
  const cap = ["Data", "Serie", "Număr", "Tip", "Cumpărător", "CUI", "Nr. Reg. Com.", "Județ", "Oraș", "Total cu TVA (lei)", "Cota TVA %", "TVA (lei)", "Stare", "e-Factura", "Plată", "PDF"];
  const randuri = facturi.map((f) => {
    const c = f.cumparator as Cumparator;
    const tva = f.cotaTva ? Math.round((f.totalBani * f.cotaTva) / (100 + f.cotaTva)) : 0;
    return [
      ziua(f.emisaLa ?? f.creatLa),
      f.seria, f.numar, f.tip, c.nume, c.cui, c.regCom, c.judet, c.oras,
      lei(f.totalBani), f.cotaTva, lei(tva), f.stare, f.eFactura, f.plataRef, f.linkPdf,
    ];
  });
  // BOM, ca Excel să afișeze corect diacriticele.
  return "﻿" + [cap, ...randuri].map((r) => r.map(celula).join(";")).join("\r\n");
}
