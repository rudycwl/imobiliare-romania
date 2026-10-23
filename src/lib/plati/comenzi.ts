import "server-only";
import { randomBytes } from "crypto";
import { db } from "../db";
import { abonamentActiv, activeazaAbonament } from "../abonamente";
import { aplicaPromovare } from "../promovari";
import { emiteFactura } from "../facturare";
import { STARI_PLATITE, modTest, stareaPlatii } from "./netopia";
import { getAbonament, getPromovare, pretAnual, pretLunar, pretPromovare, type CodPromovare } from "../tarife";

export type CerereComanda = { tip: "promovare"; produs: string; anuntId: number } | { tip: "abonament"; produs: string; anual: boolean };

/** Parametrii din link: ?promovare=cod&anunt=id sau ?abonament=cod&anual=1 */
export type CererePlata = { promovare?: string; anunt?: string; abonament?: string; anual?: string };

export function citesteCerere(q: CererePlata): CerereComanda | null {
  if (q.promovare && Number.isInteger(Number(q.anunt))) return { tip: "promovare", produs: q.promovare, anuntId: Number(q.anunt) };
  if (q.abonament) return { tip: "abonament", produs: q.abonament, anual: q.anual === "1" };
  return null;
}

type Cont = { id: string; tip: string; fondator: boolean; gratuitPanaLa: Date | null; abonament: string | null; abonamentPanaLa: Date | null };

/** Prețul și descrierea se calculează doar aici, pe server, din src/lib/tarife.ts. */
export function detaliiComanda(u: Cont, c: CerereComanda) {
  if (c.tip === "promovare") {
    const p = getPromovare(c.produs);
    if (!p) return null;
    const lei = pretPromovare(p, !!abonamentActiv(u));
    return { descriere: `Promovare „${p.nume}” pentru anunțul #${c.anuntId}`, sumaBani: lei * 100 };
  }
  const a = getAbonament(c.produs);
  if (!a || u.tip !== "agentie") return null;
  const lei = c.anual ? pretAnual(a, u.fondator) : pretLunar(a, u.fondator);
  return { descriere: `Abonament ${a.nume} CheiaMea, ${c.anual ? "12 luni" : "30 de zile"}${u.fondator ? " (Agenție Fondatoare)" : ""}`, sumaBani: lei * 100 };
}

const idComanda = () => `CM${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;

export async function creeazaComanda(u: Cont, c: CerereComanda) {
  const d = detaliiComanda(u, c);
  if (!d) return null;
  return db.comanda.create({
    data: {
      id: idComanda(),
      utilizatorId: u.id,
      tip: c.tip,
      produs: c.produs,
      anuntId: c.tip === "promovare" ? c.anuntId : null,
      anual: c.tip === "abonament" && c.anual,
      ...d,
    },
  });
}

/**
 * Punctul de legătură plată → serviciu → factură. Îl cheamă notificarea NETOPIA (IPN) la plata confirmată.
 * Idempotent: NETOPIA poate trimite aceeași notificare de mai multe ori; doar prima activează serviciul.
 */
export async function plataReusita(comandaId: string, ntpID: string | null, stare: number) {
  const r = await db.comanda.updateMany({
    where: { id: comandaId, stare: { not: "platita" } },
    data: { stare: "platita", platitaLa: new Date(), ntpID, stareNetopia: stare },
  });
  const c = await db.comanda.findUnique({ where: { id: comandaId } });
  if (!c) return null;
  if (r.count) {
    if (c.tip === "promovare" && c.anuntId) await aplicaPromovare(c.anuntId, c.produs as CodPromovare);
    if (c.tip === "abonament") await activeazaAbonament(c.utilizatorId, c.produs, c.anual);
  }
  // Plățile de test (sandbox NETOPIA) nu încasează bani, deci nu primesc factură fiscală în Oblio.
  if (modTest()) return c;
  // Factura e idempotentă după plataRef, deci se poate cere și la notificările repetate (ex. dacă prima dată a eșuat).
  await emiteFactura({ plataRef: c.id, utilizatorId: c.utilizatorId, linii: [{ denumire: c.descriere, pretBani: c.sumaBani }] });
  return c;
}

export async function plataRespinsa(comandaId: string, ntpID: string | null, stare: number) {
  await db.comanda.updateMany({ where: { id: comandaId, stare: "noua" }, data: { stare: "respinsa", ntpID, stareNetopia: stare } });
}

/** Verifică la NETOPIA o comandă încă neconfirmată și aplică rezultatul. Întoarce starea comenzii după verificare. */
export async function confirmaDinNetopia(c: { id: string; sumaBani: number; ntpID: string | null; stare: string }) {
  if (c.stare !== "noua") return c.stare;
  const s = await stareaPlatii(c.id, c.ntpID);
  if (!s) return c.stare;
  if (STARI_PLATITE.includes(s.status)) {
    if (s.sumaBani !== c.sumaBani) {
      console.error("NETOPIA: suma diferită la comanda", c.id);
      return c.stare;
    }
    await plataReusita(c.id, s.ntpID, s.status);
    return "platita";
  }
  if (s.status === 12) {
    await plataRespinsa(c.id, s.ntpID, s.status);
    return "respinsa";
  }
  await db.comanda.update({ where: { id: c.id }, data: { stareNetopia: s.status } });
  return c.stare;
}
