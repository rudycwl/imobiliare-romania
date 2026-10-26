import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { retrageAnunt } from "@/lib/anunturi";
import { agentieDinCerere } from "@/lib/api-agentii";

/** Retrage un anunț de pe site (de ex. proprietatea s-a vândut în programul agenției). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await agentieDinCerere(req);
  if (!u) return NextResponse.json({ eroare: "Cheie API lipsă sau greșită." }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0 || !(await retrageAnunt(id, u.id))) {
    return NextResponse.json({ eroare: "Anunțul nu există sau nu e al agenției." }, { status: 404 });
  }
  revalidatePath("/");
  revalidatePath(`/agentii/${u.slug}`);
  revalidatePath(`/anunt/${id}`);
  return NextResponse.json({ retras: id });
}
