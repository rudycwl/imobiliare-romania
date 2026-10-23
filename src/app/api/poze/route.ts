import { NextRequest, NextResponse } from "next/server";
import { MAX_MARIME, TIPURI_POZE } from "@/lib/poze";
import { caleLocala, salveazaLocal, verificaIncarcareLocala } from "@/lib/stocare";

/** Încărcarea unei poze pe disc (stocare locală), cu URL-ul semnat dat de cerereIncarcare. */
export async function PUT(req: NextRequest) {
  const v = verificaIncarcareLocala(req.nextUrl.searchParams);
  if (!v || !caleLocala(v.cheie) || !TIPURI_POZE.includes(v.tip) || v.marime > MAX_MARIME) {
    return NextResponse.json({ eroare: "Link de încărcare invalid sau expirat." }, { status: 403 });
  }
  if (req.headers.get("content-type") !== v.tip) return NextResponse.json({ eroare: "Tip greșit." }, { status: 400 });
  const date = Buffer.from(await req.arrayBuffer());
  if (date.length !== v.marime) return NextResponse.json({ eroare: "Mărime greșită." }, { status: 400 });
  await salveazaLocal(v.cheie, date);
  return new NextResponse(null, { status: 200 });
}
