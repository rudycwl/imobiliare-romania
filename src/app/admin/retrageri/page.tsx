import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { db } from "@/lib/db";
import { formatData } from "@/lib/fondatori";

export const metadata: Metadata = { title: "Cereri de retragere", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RetrageriPage() {
  const u = await cerePanou();
  const cereri = await db.cerereRetragere.findMany({ orderBy: { creatLa: "desc" }, take: 200 });
  return (
    <>
      <h1>Cereri de retragere</h1>
      <p className="muted">Trimise prin formularul de pe /retragere. Confirmă primirea pe email și răspunde în cel mult 5 zile lucrătoare.</p>
      {cereri.length === 0 && <p className="succes">Nicio cerere.</p>}
      {cereri.map((c) => (
        <div key={c.id} className="moderare-item small">
          <strong>{c.id}</strong> · {formatData(c.creatLa)} · {c.nume}, <a href={`mailto:${c.email}`}>{c.email}</a> · comanda {c.comanda}
          {c.mesaj && <p style={{ whiteSpace: "pre-wrap" }}>{c.mesaj}</p>}
        </div>
      ))}
    </>
  );
}
