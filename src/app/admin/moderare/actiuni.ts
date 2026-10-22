"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { aproba, respinge } from "@/lib/moderare";

async function admin(f: FormData) {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) notFound();
  const id = Number(f.get("id"));
  if (!Number.isInteger(id)) notFound();
  return id;
}

function dupa(id: number) {
  revalidatePath("/admin/moderare");
  revalidatePath(`/anunt/${id}`);
  revalidatePath("/");
}

export async function aprobaAnunt(f: FormData) {
  const id = await admin(f);
  await aproba(id);
  dupa(id);
}

export async function respingeAnunt(f: FormData) {
  const id = await admin(f);
  await respinge(id, String(f.get("motiv") ?? "").trim().slice(0, 300));
  dupa(id);
}
