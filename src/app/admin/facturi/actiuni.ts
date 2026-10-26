"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cerePanou } from "@/lib/panou";
import { reemiteFactura, storneazaFactura, verificaEFactura } from "@/lib/facturare";

async function doarAdmin() {
  const u = await cerePanou();
}

const id = (f: FormData) => Number(f.get("id"));

export async function reemite(f: FormData) {
  await doarAdmin();
  await reemiteFactura(id(f));
  revalidatePath("/admin/facturi");
}

export async function storneaza(f: FormData) {
  await doarAdmin();
  if (f.get("confirm") !== "da") return;
  await storneazaFactura(id(f));
  revalidatePath("/admin/facturi");
}

export async function eFactura(f: FormData) {
  await doarAdmin();
  await verificaEFactura(id(f));
  revalidatePath("/admin/facturi");
}
