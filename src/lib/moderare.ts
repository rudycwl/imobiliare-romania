import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { MotivRaportare } from "@/lib/moderare-etichete";
import { adresaSite, trimiteEmail } from "@/lib/email";
import { emailuriAdmin } from "@/lib/fondatori";

export { MOTIVE_RAPORTARE, type MotivRaportare } from "@/lib/moderare-etichete";

/** Atâtea raportări de la vizitatori diferiți scot anunțul de pe site până îl verifică un administrator. */
export const PRAG_RAPORTARI = 3;

// Rădăcini căutate la începutul cuvintelor, după eliminarea diacriticelor.
const NEPOTRIVITE = [
  "pula", "pule", "pulii", "pizd", "muie", "fut", "futu", "cacat", "curv", "tarf", "bulan", "coaie", "sugi", "labagi",
  "escort", "erotic", "masaj erotic", "sex", "matrimoniale", "droguri", "cocain", "canabis", "marijuana",
];
const INSELATORIE = [
  "western union", "moneygram", "transfer in avans", "plata in avans", "bitcoin", "crypto", "usdt",
  "trimit cheile prin curier", "sunt plecat in strainatate",
];
// Rădăcini scurte care apar și în cuvinte normale (ex. „pulberi”, „sugestie”, „muiere”): se acceptă doar cuvântul exact.
const EXACTE = new Set(["pula", "pule", "pulii", "muie", "sugi", "fut", "sex"]);

const FILTRU = "(filtru automat)";

const normal = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function contine(text: string, radacina: string) {
  const r = radacina.replace(/ /g, "\\s+");
  return new RegExp(EXACTE.has(radacina) ? `\\b${r}\\b` : `\\b${r}`).test(text);
}

/** Filtrul automat: întoarce motivul pentru care anunțul trebuie verificat de om, sau null. */
export function verificaText(...campuri: string[]): string | null {
  const t = normal(campuri.join(" \n "));
  if (NEPOTRIVITE.some((c) => contine(t, c))) return `Limbaj sau conținut nepotrivit ${FILTRU}`;
  if (INSELATORIE.some((c) => contine(t, c))) return `Posibilă înșelătorie ${FILTRU}`;
  if (/https?:\/\/|www\./.test(t)) return `Conține linkuri externe ${FILTRU}`;
  return null;
}

/**
 * Trece anunțul prin filtru și îl pune în verificare dacă e cazul. Un text curat scoate anunțul din verificare
 * doar dacă acolo îl pusese filtrul; raportările și respingerile rămân la decizia administratorului.
 */
export async function aplicaFiltru(id: number, titlu: string, descriere: string) {
  const motiv = verificaText(titlu, descriere);
  if (motiv)
    await db.anunt.updateMany({ where: { id, moderare: { not: "respins" } }, data: { moderare: "verificare", motivModerare: motiv } });
  else
    await db.anunt.updateMany({ where: { id, moderare: "verificare", motivModerare: { endsWith: FILTRU } }, data: { moderare: "ok", motivModerare: null } });
  return motiv;
}

/**
 * Amprenta celui care raportează: doar adresa IP (cea pusă de Caddy, vezi ipClient). Browserul nu intră în calcul,
 * altfel aceeași persoană ar putea raporta de 3 ori schimbând doar browserul și ar scoate singură anunțul.
 */
export const amprenta = (ip: string) => createHash("sha256").update(`raport|${ip}`).digest("hex");

/** Salvează o raportare; la PRAG_RAPORTARI raportări nerezolvate anunțul iese de pe site și adminii primesc email. */
export async function raporteaza(anuntId: number, motiv: MotivRaportare, detalii: string | null, amp: string) {
  const a = await db.anunt.findUnique({ where: { id: anuntId }, select: { moderare: true, titlu: true } });
  if (!a) return false;
  await db.raportare.upsert({
    where: { anuntId_amprenta: { anuntId, amprenta: amp } },
    create: { anuntId, motiv, detalii, amprenta: amp },
    update: {},
  });
  const n = await db.raportare.count({ where: { anuntId, rezolvat: false } });
  if (n >= PRAG_RAPORTARI && a.moderare === "ok") {
    await db.anunt.update({ where: { id: anuntId }, data: { moderare: "verificare", motivModerare: `${n} raportări de la vizitatori` } });
    await anuntaAdminii(anuntId, a.titlu, n);
  }
  return true;
}

/** Un anunț ascuns de raportări trebuie verificat repede: dacă raportările sunt false, proprietarul pierde vizite. */
async function anuntaAdminii(anuntId: number, titlu: string, n: number) {
  for (const catre of emailuriAdmin())
    await trimiteEmail({
      catre,
      subiect: `Anunț ascuns după ${n} raportări: #${anuntId}`,
      paragrafe: [
        `Anunțul #${anuntId} („${titlu}”) a primit ${n} raportări de la vizitatori diferiți și nu mai apare pe site.`,
        "Verifică-l în pagina de moderare: aprobă-l dacă raportările sunt false sau respinge-l dacă încalcă regulile.",
      ],
      buton: { text: "Deschide moderarea", link: `${adresaSite()}/admin/moderare` },
    }).catch((e) => console.error("Email moderare:", e));
}

/** Anunțurile care așteaptă decizia administratorului: în verificare sau cu raportări nerezolvate. */
export function deModerat() {
  return db.anunt.findMany({
    where: { OR: [{ moderare: "verificare" }, { raportari: { some: { rezolvat: false } } }] },
    include: { proprietar: { select: { nume: true, email: true, telefon: true } }, raportari: { where: { rezolvat: false }, orderBy: { creatLa: "desc" } } },
    orderBy: { publicatLa: "desc" },
    take: 100,
  });
}

export async function aproba(id: number) {
  await db.$transaction([
    db.anunt.update({ where: { id }, data: { moderare: "ok", motivModerare: null } }),
    db.raportare.updateMany({ where: { anuntId: id }, data: { rezolvat: true } }),
  ]);
}

/** Respinge anunțul: dispare de pe site și nu mai poate fi reactivat de proprietar. */
export async function respinge(id: number, motiv: string) {
  await db.$transaction([
    db.anunt.update({ where: { id }, data: { moderare: "respins", motivModerare: motiv || "Nu respectă regulile site-ului", expiraLa: new Date() } }),
    db.raportare.updateMany({ where: { anuntId: id }, data: { rezolvat: true } }),
  ]);
}
