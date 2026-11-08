"use server";

import { revalidatePath } from "next/cache";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_FEEDURI_PE_AGENTIE, ruleazaFeed, verificaAdresa, type RaportFeed } from "@/lib/feeduri";
import { noteaza, permis } from "@/lib/limita";

export type StareFeed = { eroare?: string; raport?: RaportFeed; mesaj?: string } | undefined;

async function agentie() {
  const u = await utilizatorCurent();
  if (!u || u.tip !== "agentie") return { eroare: "Feed-ul de anunțuri e disponibil doar pentru conturile de agenție." } as const;
  if (!u.emailConfirmat) return { eroare: "Confirmă întâi adresa de email a contului (linkul din emailul primit la înscriere)." } as const;
  return { u } as const;
}

/** Adaugă feed-ul și îl citește imediat, ca agenția să vadă pe loc ce s-a importat. */
export async function adaugaFeed(_: StareFeed, f: FormData): Promise<StareFeed> {
  const a = await agentie();
  if ("eroare" in a) return { eroare: a.eroare };
  const url = String(f.get("url") ?? "").trim().slice(0, 1000);
  if (f.get("acord") !== "da") return { eroare: "Bifează acordul pentru feed (pozele și datele din anunțuri sunt ale agenției și au acordul clienților)." };
  const gresit = await verificaAdresa(url);
  if (gresit) return { eroare: gresit };
  const cheie = `feed|${a.u.id}`;
  if (!permis(cheie, 10, 3600_000)) return { eroare: "Ai încercat de prea multe ori. Mai încearcă peste o oră." };
  noteaza(cheie);
  if ((await db.feedAgentie.count({ where: { utilizatorId: a.u.id } })) >= MAX_FEEDURI_PE_AGENTIE)
    return { eroare: `Poți avea cel mult ${MAX_FEEDURI_PE_AGENTIE} feed-uri. Șterge unul înainte să adaugi altul.` };
  const feed = await db.feedAgentie.upsert({
    where: { utilizatorId_url: { utilizatorId: a.u.id, url } },
    create: { utilizatorId: a.u.id, url, acordLa: new Date() },
    update: { activ: true, acordLa: new Date(), eroriLaRand: 0 },
  });
  const raport = await ruleazaFeed(feed.id);
  revalidatePath("/cont/import");
  return { raport };
}

export async function actiuneFeed(f: FormData) {
  const a = await agentie();
  if ("eroare" in a) return;
  const id = Number(f.get("id"));
  const feed = await db.feedAgentie.findFirst({ where: { id, utilizatorId: a.u.id } });
  if (!feed) return;
  const ce = f.get("actiune");
  if (ce === "sterge") {
    // Anunțurile rămân publicate; doar nu se mai actualizează din feed.
    await db.feedAgentie.delete({ where: { id } });
  } else if (ce === "opreste") {
    await db.feedAgentie.update({ where: { id }, data: { activ: false } });
  } else if (ce === "porneste" || ce === "acum") {
    const cheie = `feed|${a.u.id}`;
    if (!permis(cheie, 10, 3600_000)) return;
    noteaza(cheie);
    await db.feedAgentie.update({ where: { id }, data: { activ: true, eroriLaRand: 0 } });
    await ruleazaFeed(id);
  }
  revalidatePath("/cont/import");
}
