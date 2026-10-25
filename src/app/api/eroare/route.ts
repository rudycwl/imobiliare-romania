import { NextResponse } from "next/server";
import { ipClient, noteaza, permis } from "@/lib/limita";
import { raporteazaEroare } from "@/lib/raport-erori";

/** Erorile din browser (pagina „Ceva n-a mers”) ajung aici și pleacă pe email la admini. Cel mult 5 pe oră de la o conexiune. */
export async function POST(req: Request) {
  const ip = await ipClient();
  if (!permis(`eroare:${ip}`, 5, 60 * 60_000)) return new NextResponse(null, { status: 429 });
  noteaza(`eroare:${ip}`);
  const c = (await req.json().catch(() => ({}))) as { mesaj?: unknown; unde?: unknown };
  const mesaj = String(c.mesaj ?? "").slice(0, 500);
  if (!mesaj) return new NextResponse(null, { status: 400 });
  await raporteazaEroare({
    sursa: "browser",
    mesaj,
    unde: String(c.unde ?? "/").slice(0, 300),
    detalii: `browser: ${(req.headers.get("user-agent") ?? "").slice(0, 200)}`,
  });
  return new NextResponse(null, { status: 204 });
}
