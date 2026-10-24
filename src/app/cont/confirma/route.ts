import { NextResponse, type NextRequest } from "next/server";
import { confirmaEmail } from "@/lib/confirmare";
import { adresaSite } from "@/lib/email";

/** Linkul din emailul de confirmare. */
export async function GET(req: NextRequest) {
  const ok = await confirmaEmail(req.nextUrl.searchParams.get("t") ?? "");
  return NextResponse.redirect(`${adresaSite()}/cont?confirmare=${ok ? "ok" : "expirat"}`, { headers: { "Referrer-Policy": "no-referrer" } });
}
