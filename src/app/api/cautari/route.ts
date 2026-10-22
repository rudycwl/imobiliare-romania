import { NextResponse } from "next/server";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { curataFiltre, descriereCautare } from "@/lib/cautari";

const MAX_CAUTARI = 20;
const privat = { "Cache-Control": "private, no-store" };

/** Salvează căutarea curentă (filtrele din pagină) în contul utilizatorului. */
export async function POST(req: Request) {
  const u = await utilizatorCurent();
  if (!u) return NextResponse.json({ eroare: "autentificare" }, { status: 401, headers: privat });
  const filtre = curataFiltre((await req.json().catch(() => ({}))) as Record<string, unknown>);
  const existente = await db.cautareSalvata.findMany({ where: { utilizatorId: u.id }, select: { filtre: true } });
  const cheie = JSON.stringify(filtre);
  if (existente.some((c) => JSON.stringify(curataFiltre(c.filtre as Record<string, unknown>)) === cheie)) return NextResponse.json({ salvata: true }, { headers: privat });
  if (existente.length >= MAX_CAUTARI)
    return NextResponse.json({ eroare: `Poți avea cel mult ${MAX_CAUTARI} căutări salvate. Șterge una din cont.` }, { status: 400, headers: privat });
  await db.cautareSalvata.create({ data: { utilizatorId: u.id, filtre, nume: descriereCautare(filtre) } });
  return NextResponse.json({ salvata: true }, { headers: privat });
}
