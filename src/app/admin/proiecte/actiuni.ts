"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { slugify } from "@/lib/etichete";
import { getOras } from "@/lib/geo";
import { cerePanou } from "@/lib/panou";
import { cheieNouaProiect, MAX_MARIME, TIPURI_POZE } from "@/lib/poze";
import { MAX_POZE_PROIECT, stergePozaProiect } from "@/lib/proiecte";
import { finalGratuit, parseazaUnitati } from "@/lib/proiecte-unitati";
import { asiguraCors, exista, stocareConfigurata, urlIncarcare } from "@/lib/stocare";
import { LUNI_GRATUITE_PROIECT } from "@/lib/tarife";

export type StareProiect = { eroare?: string; ok?: string } | undefined;

const camp = (f: FormData, nume: string, max: number) => String(f.get(nume) ?? "").trim().slice(0, max);
const optional = (f: FormData, nume: string, max: number) => camp(f, nume, max) || null;

function coordonata(f: FormData, nume: string, min: number, max: number) {
  const t = camp(f, nume, 30).replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
}

/** Paginile publice în care apare proiectul: lista, pagina lui, județul și sitemap-ul. */
function reimprospateaza(p: { slug: string; judet: string }, slugVechi?: string) {
  revalidatePath("/proiecte");
  revalidatePath(`/proiecte/${p.slug}`);
  if (slugVechi && slugVechi !== p.slug) revalidatePath(`/proiecte/${slugVechi}`);
  revalidatePath(`/${p.judet}`);
  revalidatePath("/sitemap.xml");
}

/** Creează sau modifică un proiect (câmpul ascuns „id” lipsește la creare). */
export async function salveazaProiect(_: StareProiect, f: FormData): Promise<StareProiect> {
  await cerePanou();
  const id = Number(f.get("id")) || null;
  const nume = camp(f, "nume", 120);
  const dezvoltator = camp(f, "dezvoltator", 120);
  const descriere = camp(f, "descriere", 8000);
  const [judet = "", oras = ""] = camp(f, "loc", 120).split("/");
  const telefon = camp(f, "telefon", 30);
  const email = camp(f, "email", 120).toLowerCase();
  const website = optional(f, "website", 300);
  const slug = slugify(camp(f, "slug", 100) || nume).slice(0, 80);
  if (!nume || !dezvoltator || !descriere || !telefon) return { eroare: "Completează numele proiectului, dezvoltatorul, descrierea și telefonul." };
  if (!slug) return { eroare: "Adresa paginii (slug) nu e validă." };
  if (!getOras(judet, oras)) return { eroare: "Alege localitatea proiectului." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { eroare: "Emailul dezvoltatorului nu e valid (aici ajung cererile clienților)." };
  if (website && !/^https?:\/\/\S+$/.test(website)) return { eroare: "Site-ul trebuie să înceapă cu https://" };
  const lat = coordonata(f, "lat", 43, 49);
  const lng = coordonata(f, "lng", 20, 30);
  if (Number.isNaN(lat) || Number.isNaN(lng) || (lat === null) !== (lng === null))
    return { eroare: "Coordonatele trebuie completate amândouă, în România (ex. 47.1585 și 27.6014), sau lăsate goale." };
  const { unitati, eroare } = parseazaUnitati(String(f.get("unitati") ?? ""));
  if (eroare) return { eroare };
  const gratuitText = camp(f, "gratuitPanaLa", 10);
  const gratuitPanaLa = gratuitText ? new Date(`${gratuitText}T23:59:59+02:00`) : finalGratuit(new Date(), LUNI_GRATUITE_PROIECT);
  if (Number.isNaN(gratuitPanaLa.getTime())) return { eroare: "Data de final a perioadei gratuite nu e validă." };

  const altul = await db.proiect.findUnique({ where: { slug }, select: { id: true } });
  if (altul && altul.id !== id) return { eroare: `Adresa /proiecte/${slug} e deja folosită de alt proiect. Alege alt slug.` };

  const date = {
    slug,
    nume,
    dezvoltator,
    descriere,
    judet,
    oras,
    zona: optional(f, "zona", 120),
    adresa: optional(f, "adresa", 200),
    lat,
    lng,
    website,
    telefon,
    email,
    unitati,
    termenFinalizare: optional(f, "termenFinalizare", 80),
    activ: f.get("activ") === "on",
    gratuitPanaLa,
  };
  if (id) {
    const vechi = await db.proiect.findUnique({ where: { id }, select: { slug: true, judet: true } });
    if (!vechi) return { eroare: "Proiectul nu mai există." };
    await db.proiect.update({ where: { id }, data: date });
    reimprospateaza(date, vechi.slug);
    if (vechi.judet !== judet) revalidatePath(`/${vechi.judet}`);
    revalidatePath("/admin/proiecte");
    revalidatePath(`/admin/proiecte/${id}`);
    return { ok: "Salvat. Schimbările se văd pe site imediat." };
  }
  const nou = await db.proiect.create({ data: date });
  reimprospateaza(date);
  redirect(`/admin/proiecte/${nou.id}?nou=1`);
}

/** Pasul 1 la poze: URL semnat pentru încărcarea directă în stocare (ca la anunțuri). */
export async function cerereIncarcareProiect(id: number, tip: string, marime: number) {
  await cerePanou();
  if (!stocareConfigurata()) return { eroare: "Încărcarea pozelor nu e încă activă." };
  const p = Number.isInteger(id) ? await db.proiect.findUnique({ where: { id }, select: { poze: true } }) : null;
  if (!p) return { eroare: "Proiectul nu există." };
  if (!TIPURI_POZE.includes(tip) || !(marime > 0) || marime > MAX_MARIME) return { eroare: "Poza trebuie să fie JPG sau WebP, de cel mult 2 MB." };
  if (p.poze.length >= MAX_POZE_PROIECT) return { eroare: `Cel mult ${MAX_POZE_PROIECT} de poze pe proiect.` };
  const cheie = cheieNouaProiect(id, tip);
  await asiguraCors();
  return { url: urlIncarcare(cheie, tip, marime), cheie };
}

/** Pasul 2: după încărcare, poza se adaugă la proiect. */
export async function confirmaPozaProiect(id: number, cheie: string) {
  await cerePanou();
  const p = Number.isInteger(id) ? await db.proiect.findUnique({ where: { id } }) : null;
  if (!p || !cheie.replace(/^local\//, "").startsWith(`proiecte/${id}/`)) return { eroare: "Poza nu e validă." };
  if (p.poze.length >= MAX_POZE_PROIECT) return { eroare: `Cel mult ${MAX_POZE_PROIECT} de poze pe proiect.` };
  if (!(await exista(cheie))) return { eroare: "Poza nu a ajuns în stocare. Încearcă din nou." };
  await db.proiect.update({ where: { id }, data: { poze: [...p.poze, cheie] } });
  reimprospateaza(p);
  revalidatePath(`/admin/proiecte/${id}`);
  return {};
}

export async function stergePozaActiune(f: FormData) {
  await cerePanou();
  const id = Number(f.get("proiect"));
  const p = Number.isInteger(id) ? await db.proiect.findUnique({ where: { id }, select: { slug: true, judet: true } }) : null;
  if (!p) return;
  await stergePozaProiect(id, String(f.get("cheie") ?? ""));
  reimprospateaza(p);
  revalidatePath(`/admin/proiecte/${id}`);
}

/** Mută poza aleasă pe primul loc (copertă). */
export async function facePrimaActiune(f: FormData) {
  await cerePanou();
  const id = Number(f.get("proiect"));
  const cheie = String(f.get("cheie") ?? "");
  const p = Number.isInteger(id) ? await db.proiect.findUnique({ where: { id } }) : null;
  if (!p?.poze.includes(cheie)) return;
  await db.proiect.update({ where: { id }, data: { poze: [cheie, ...p.poze.filter((c) => c !== cheie)] } });
  reimprospateaza(p);
  revalidatePath(`/admin/proiecte/${id}`);
}
