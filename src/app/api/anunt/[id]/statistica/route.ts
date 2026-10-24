import { NextResponse } from "next/server";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";

const ROBOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

/** Numără o vizualizare. Pagina de anunț e cache-uită, deci browserul trimite evenimentul. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const { tip } = (await req.json().catch(() => ({}))) as { tip?: string };
  // Afișările telefonului le numără /api/anunt/[id]/telefon.
  const camp = tip === "vizualizare" ? "vizualizari" : null;
  if (!camp || !Number.isInteger(id) || ROBOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  // Proprietarul care își verifică anunțul nu se numără.
  const u = await utilizatorCurent();
  await db.anunt.updateMany({ where: { id, moderare: "ok", proprietarId: u ? { not: u.id } : undefined }, data: { [camp]: { increment: 1 } } });
  return new NextResponse(null, { status: 204 });
}
