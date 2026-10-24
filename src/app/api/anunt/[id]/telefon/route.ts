import { NextResponse } from "next/server";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { ipClient, noteaza, permis } from "@/lib/limita";

const ROBOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

/**
 * Telefonul vânzătorului, dat doar la clic pe „Arată telefonul”: nu mai stă în pagină, unde l-ar putea strânge roboții.
 * Numără și afișarea (statistica proprietarului).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || ROBOT.test(req.headers.get("user-agent") ?? "")) return NextResponse.json({ eroare: "Nu există." }, { status: 404 });
  const ip = await ipClient();
  if (!permis(`telefon:${ip}`, 40, 60 * 60_000))
    return NextResponse.json({ eroare: "Ai văzut prea multe telefoane într-o oră. Încearcă mai târziu." }, { status: 429 });
  const a = await db.anunt.findFirst({
    where: { id, moderare: "ok" },
    select: { proprietarId: true, proprietar: { select: { telefon: true } } },
  });
  if (!a) return NextResponse.json({ eroare: "Nu există." }, { status: 404 });
  noteaza(`telefon:${ip}`);
  // Proprietarul care își verifică anunțul nu se numără.
  const u = await utilizatorCurent();
  if (u?.id !== a.proprietarId) await db.anunt.update({ where: { id }, data: { afisariTelefon: { increment: 1 } } });
  return NextResponse.json({ telefon: a.proprietar.telefon }, { headers: { "Cache-Control": "no-store" } });
}
