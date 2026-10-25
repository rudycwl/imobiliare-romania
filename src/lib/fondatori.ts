import "server-only";
import { randomInt } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { adresaSite, trimiteEmail } from "./email";

/** Oferta „Agenție Fondatoare”: primele 100 de agenții înscrise până la 31.12.2026. */
export const LOCURI_FONDATOARE = 100;
export const TERMEN_FONDATOARE = new Date("2026-12-31T23:59:59+02:00");
export const LUNI_GRATUITE = 6;
export const ZILE_INVITATIE = 14;

const acum = () => new Date();
const invitatieActiva = (): Prisma.InvitatieAgentieWhereInput => ({ folositaDe: null, expiraLa: { gt: acum() } });

/** Locurile încă libere: cele 100 minus fondatorii deja înscriși și invitațiile încă valabile (rezervate). */
export async function locuriRamase() {
  if (acum() > TERMEN_FONDATOARE) return 0;
  const [fondatori, rezervate] = await Promise.all([
    db.utilizator.count({ where: { fondator: true } }),
    db.invitatieAgentie.count({ where: invitatieActiva() }),
  ]);
  return Math.max(0, LOCURI_FONDATOARE - fondatori - rezervate);
}

export function normalizeazaCod(cod: string | undefined | null) {
  return (cod ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export async function getInvitatieValabila(cod: string | undefined | null) {
  const c = normalizeazaCod(cod);
  if (!c) return null;
  return db.invitatieAgentie.findFirst({ where: { cod: c, ...invitatieActiva() } });
}

// Fără caractere ușor de confundat (0/O, 1/I/L).
const ALFABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export async function creeazaInvitatie(nota: string | null) {
  const cod = Array.from({ length: 8 }, () => ALFABET[randomInt(ALFABET.length)]).join("");
  const expiraLa = new Date(Date.now() + ZILE_INVITATIE * 86_400_000);
  return db.invitatieAgentie.create({ data: { cod, nota, expiraLa } });
}

export async function listaInvitatii() {
  return db.invitatieAgentie.findMany({ orderBy: { creatLa: "desc" }, take: 200, include: { agentie: { select: { nume: true } } } });
}

/**
 * După înscrierea unei agenții: devine fondatoare dacă are o invitație valabilă (locul ei e deja rezervat)
 * sau dacă mai sunt locuri libere. Primește 6 luni gratuite.
 */
export async function aplicaOfertaFondator(utilizatorId: string, cod: string | undefined | null) {
  const invitatie = await getInvitatieValabila(cod);
  if (!invitatie && (await locuriRamase()) <= 0) return false;
  const gratuitPanaLa = new Date();
  gratuitPanaLa.setMonth(gratuitPanaLa.getMonth() + LUNI_GRATUITE);
  await db.$transaction([
    db.utilizator.update({ where: { id: utilizatorId }, data: { fondator: true, gratuitPanaLa } }),
    ...(invitatie
      ? [db.invitatieAgentie.update({ where: { cod: invitatie.cod }, data: { folositaDe: utilizatorId, folositaLa: new Date() } })]
      : []),
  ]);
  return true;
}

/** Adresele din ADMIN_EMAILS (pagina /configurare). */
export const emailuriAdmin = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export function esteAdmin(email: string | null | undefined) {
  return !!email && emailuriAdmin().includes(email.toLowerCase());
}

export const formatData = (d: Date) => new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(d);

/** Fiecare agenție nouă e un client posibil: adminii află imediat cine s-a înscris și dacă a prins oferta. */
export async function anuntaAgentieNoua(a: { nume: string; contact: string | null; email: string; telefon: string; slug: string }, fondator: boolean) {
  for (const catre of emailuriAdmin())
    await trimiteEmail({
      catre,
      subiect: `Agenție nouă înscrisă: ${a.nume}`,
      paragrafe: [
        `Agenția „${a.nume}” și-a făcut cont pe CheiaMea.`,
        `Persoană de contact: ${a.contact ?? "-"} · ${a.email} · ${a.telefon}`,
        fondator ? `A primit oferta „Agenție Fondatoare” (${LUNI_GRATUITE} luni gratuit, apoi 50% reducere).` : "Nu a primit oferta „Agenție Fondatoare” (locurile s-au terminat sau termenul a trecut).",
      ],
      buton: { text: "Vezi pagina agenției", link: `${adresaSite()}/agentii/${a.slug}` },
    }).catch((e) => console.error("Email agenție nouă:", e));
}
