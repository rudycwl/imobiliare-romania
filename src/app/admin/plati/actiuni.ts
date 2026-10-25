"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { esteAdmin } from "@/lib/fondatori";

// Șterge plățile bifate (ex. testele NETOPIA). O plată cu factură emisă în Oblio nu se șterge niciodată:
// factura rămâne în contabilitate și se anulează doar prin stornare, din /admin/facturi.
export async function stergePlati(f: FormData) {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) notFound();
  if (f.get("confirm") !== "da") return;
  const ids = f.getAll("id").map(String).filter(Boolean);
  if (!ids.length) return;
  const facturate = await db.factura.findMany({
    where: { plataRef: { in: ids }, OR: [{ seria: { not: null } }, { stare: { in: ["emisa", "stornata"] } }] },
    select: { plataRef: true },
  });
  const deSters = ids.filter((id) => !facturate.some((x) => x.plataRef === id));
  await db.$transaction([
    db.factura.deleteMany({ where: { plataRef: { in: deSters }, seria: null } }),
    db.comanda.deleteMany({ where: { id: { in: deSters } } }),
  ]);
  revalidatePath("/admin/plati");
}
