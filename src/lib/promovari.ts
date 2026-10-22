import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { credite } from "./abonamente";
import type { CodPromovare } from "./tarife";

const ZI = 864e5;

/** Prelungește o promovare: de la data ei de sfârșit dacă e încă activă, altfel de acum. */
const extinde = (panaLa: Date | null, zile: number, acum: Date) =>
  new Date(Math.max(panaLa?.getTime() ?? 0, acum.getTime()) + zile * ZI);

/** Aplică o promovare plătită (sau dintr-un credit) pe un anunț. */
export async function aplicaPromovare(anuntId: number, cod: CodPromovare) {
  const a = await db.anunt.findUniqueOrThrow({ where: { id: anuntId } });
  const acum = new Date();
  const data: Prisma.AnuntUpdateInput = {};
  switch (cod) {
    case "reactualizare":
      data.ordine = acum;
      break;
    case "evidentiat":
      data.evidentiatPanaLa = extinde(a.evidentiatPanaLa, 14, acum);
      break;
    case "top-oras-7":
    case "top-oras-30":
      data.topPanaLa = extinde(a.topPanaLa, cod === "top-oras-7" ? 7 : 30, acum);
      break;
    case "prima-pagina-judet":
      data.primaPaginaPanaLa = extinde(a.primaPaginaPanaLa, 7, acum);
      break;
    case "vanzare-rapida":
      // Top și Evidențiat 30 de zile, o reactualizare acum și încă 3, una pe săptămână.
      data.topPanaLa = extinde(a.topPanaLa, 30, acum);
      data.evidentiatPanaLa = extinde(a.evidentiatPanaLa, 30, acum);
      data.ordine = acum;
      data.reactualizariRamase = a.reactualizariRamase + 3;
      data.urmReactualizare = a.urmReactualizare ?? new Date(acum.getTime() + 7 * ZI);
      break;
  }
  // Un anunț promovat trebuie să fie vizibil cât ține promovarea.
  const sfarsit = [data.evidentiatPanaLa, data.topPanaLa, data.primaPaginaPanaLa].filter((d): d is Date => d instanceof Date);
  const maxim = Math.max(a.expiraLa.getTime(), acum.getTime(), ...sfarsit.map((d) => d.getTime()));
  if (maxim > a.expiraLa.getTime()) data.expiraLa = new Date(maxim);
  await db.anunt.update({ where: { id: anuntId }, data });
}

/** Folosește un credit din abonament: reactualizare sau Top în oraș 7 zile. */
export async function folosesteCredit(utilizatorId: string, anuntId: number, tip: "reactualizare" | "top-oras-7") {
  const c = await credite(utilizatorId);
  const camp = tip === "reactualizare" ? "creditReactualizari" : "creditTop";
  if ((tip === "reactualizare" ? c.reactualizari : c.top) < 1) return false;
  // Scăderea e condiționată, ca două clicuri simultane să nu folosească același credit de două ori.
  const r = await db.utilizator.updateMany({ where: { id: utilizatorId, [camp]: { gt: 0 } }, data: { [camp]: { decrement: 1 } } });
  if (!r.count) return false;
  await aplicaPromovare(anuntId, tip);
  return true;
}

let ultimaRulare = 0;

/** Reactualizările săptămânale din „Vânzare rapidă”. Rulează la citirea listelor, cel mult o dată la 10 minute. */
export async function ruleazaReactualizari() {
  const acum = Date.now();
  if (acum - ultimaRulare < 10 * 60e3) return;
  ultimaRulare = acum;
  await db.$executeRaw`
    UPDATE "Anunt"
    SET "ordine" = "urmReactualizare",
        "reactualizariRamase" = "reactualizariRamase" - 1,
        "urmReactualizare" = CASE WHEN "reactualizariRamase" > 1 THEN "urmReactualizare" + interval '7 days' ELSE NULL END
    WHERE "reactualizariRamase" > 0 AND "urmReactualizare" <= now()`;
}
