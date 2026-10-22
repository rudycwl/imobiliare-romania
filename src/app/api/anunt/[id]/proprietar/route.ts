import { NextResponse } from "next/server";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";

/** Spune paginii de anunț (care e cache-uită pentru toți) dacă vizitatorul curent e proprietarul. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const u = await utilizatorCurent();
  const proprietar = !!u && Number.isInteger(id) && (await db.anunt.count({ where: { id, proprietarId: u.id } })) > 0;
  return NextResponse.json({ proprietar }, { headers: { "Cache-Control": "private, no-store" } });
}
