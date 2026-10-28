"use server";

import { db } from "@/lib/db";
import { adresaSite, trimiteEmail } from "@/lib/email";
import { FIRMA } from "@/lib/firma";
import { ipClient, noteaza, permis } from "@/lib/limita";

export type StareCerere = { ok?: boolean; eroare?: string } | undefined;

const ORA = 60 * 60_000;
const camp = (f: FormData, nume: string, max: number) => String(f.get(nume) ?? "").trim().slice(0, max);

/**
 * Cererea unui vizitator către dezvoltator. Nu se salvează nimic în baza de date: mesajul pleacă pe email
 * la dezvoltator (Răspunde = vizitatorul), cu o copie la CheiaMea.
 */
export async function trimiteCerere(_: StareCerere, f: FormData): Promise<StareCerere> {
  // Câmpul ascuns „site” îl completează doar roboții: le spunem că a mers, fără să trimitem nimic.
  if (camp(f, "site", 200)) return { ok: true };
  const nume = camp(f, "nume", 100).replace(/\s+/g, " ");
  const telefon = camp(f, "telefon", 30);
  const email = camp(f, "email", 120).toLowerCase();
  const mesaj = camp(f, "mesaj", 2000);
  if (!nume || !telefon) return { eroare: "Scrie numele și telefonul, ca dezvoltatorul să te poată contacta." };
  if (!/^[+0-9 ()./-]{6,30}$/.test(telefon)) return { eroare: "Numărul de telefon nu e valid." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { eroare: "Adresa de email nu e validă." };
  if (f.get("acord") !== "on") return { eroare: "Bifează acordul ca datele tale să fie trimise dezvoltatorului." };

  const p = await db.proiect.findUnique({ where: { slug: camp(f, "proiect", 100) } });
  if (!p?.activ) return { eroare: "Proiectul nu mai este disponibil." };

  const ip = await ipClient();
  if (!permis(`cerere-proiect:${ip}`, 5, ORA) || !permis(`cerere-proiect:${ip}:${p.id}`, 2, ORA))
    return { eroare: `Ai trimis deja mai multe cereri. Încearcă peste o oră sau sună direct la ${p.telefon}.` };
  noteaza(`cerere-proiect:${ip}`);
  noteaza(`cerere-proiect:${ip}:${p.id}`);

  const trimis = await trimiteEmail({
    catre: p.email,
    copie: FIRMA.email,
    raspunsLa: email,
    subiect: `Cerere nouă pentru ${p.nume} (CheiaMea)`,
    paragrafe: [
      `Ai primit o cerere de pe pagina proiectului „${p.nume}” de pe CheiaMea.`,
      `Nume: ${nume}`,
      `Telefon: ${telefon}`,
      `Email: ${email}`,
      ...(mesaj ? [`Mesaj: ${mesaj}`] : []),
      "Răspunde direct la acest email ca să-i scrii clientului.",
    ],
    buton: { text: "Vezi pagina proiectului", link: `${adresaSite()}/proiecte/${p.slug}` },
    subsol: "Clientul și-a dat acordul ca datele de mai sus să-ți fie trimise pentru a fi contactat despre acest proiect.",
  });
  if (!trimis) return { eroare: `Mesajul nu a putut fi trimis acum. Sună direct la ${p.telefon}.` };
  return { ok: true };
}
