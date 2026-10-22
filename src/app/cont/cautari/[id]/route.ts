import { NextResponse } from "next/server";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { curataFiltre, linkCautare } from "@/lib/cautari";

/** Deschide o căutare salvată: anunțurile de până acum nu mai sunt „noi”, apoi duce la pagina cu rezultate. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await utilizatorCurent();
  const id = Number((await params).id);
  const c = u && Number.isInteger(id) ? await db.cautareSalvata.findFirst({ where: { id, utilizatorId: u.id } }) : null;
  if (!c) return NextResponse.redirect(new URL("/cont/cautari", req.url));
  await db.cautareSalvata.update({ where: { id }, data: { vazutLa: new Date() } });
  return NextResponse.redirect(new URL(linkCautare(curataFiltre(c.filtre as Record<string, unknown>)), req.url));
}
