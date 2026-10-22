"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { folosesteCredit } from "@/lib/promovari";

export async function creditReactualizare(f: FormData) {
  await folosesteCreditActiune(f, "reactualizare");
}

export async function creditTop(f: FormData) {
  await folosesteCreditActiune(f, "top-oras-7");
}

async function folosesteCreditActiune(f: FormData, tip: "reactualizare" | "top-oras-7") {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const id = Number(f.get("id"));
  const a = Number.isInteger(id) ? await db.anunt.findFirst({ where: { id, proprietarId: u.id, expiraLa: { gt: new Date() } } }) : null;
  if (!a) redirect("/cont");
  const ok = await folosesteCredit(u.id, id, tip);
  revalidatePath(`/${a.judet}/${a.oras}`);
  redirect(`/cont/promoveaza/${id}?${ok ? "ok=1" : "eroare=credite"}`);
}
