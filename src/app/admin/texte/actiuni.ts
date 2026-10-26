"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cerePanou } from "@/lib/panou";
import { linkSigur, NR_BANDA, revinoLaImplicit, salveazaTexte, type ElementBanda } from "@/lib/setari";

export type StareTexte = { ok?: string; eroare?: string } | undefined;

async function admin() {
  const u = await cerePanou();
}

const camp = (f: FormData, nume: string, max: number) => String(f.get(nume) ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Bara de anunț e pe toate paginile: după salvare se refac toate, nu doar pagina de start. */
const reface = () => revalidatePath("/", "layout");

export async function salveaza(_: StareTexte, f: FormData): Promise<StareTexte> {
  await admin();
  const anuntLink = camp(f, "anuntLink", 300);
  if (anuntLink && !linkSigur(anuntLink)) return { eroare: "Linkul barei de anunț trebuie să înceapă cu „/” (o pagină din site) sau cu „https://”." };
  const banda: ElementBanda[] = [];
  for (let i = 0; i < NR_BANDA; i++) {
    const el = { eticheta: camp(f, `eticheta${i}`, 30), text: camp(f, `text${i}`, 200), href: camp(f, `href${i}`, 300) };
    if (!el.eticheta && !el.text) continue;
    if (!el.text) return { eroare: `Rândul ${i + 1} din bandă are eticheta, dar nu are text.` };
    if (!linkSigur(el.href)) return { eroare: `Rândul ${i + 1} din bandă: linkul trebuie să înceapă cu „/” sau cu „https://”.` };
    banda.push(el);
  }
  const erouSupratitlu = camp(f, "erouSupratitlu", 80);
  const erouDescriere = camp(f, "erouDescriere", 250);
  if (!erouSupratitlu || !erouDescriere) return { eroare: "Textele de pe pagina de start nu pot rămâne goale." };
  await salveazaTexte({ anuntText: camp(f, "anuntText", 200), anuntLink, erouSupratitlu, erouDescriere, banda });
  reface();
  return { ok: "Salvat. Schimbările se văd pe site imediat (reîncarcă pagina)." };
}

export async function implicit(): Promise<StareTexte> {
  await admin();
  await revinoLaImplicit();
  reface();
  return { ok: "Am pus înapoi textele inițiale." };
}
