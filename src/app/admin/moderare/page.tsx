import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin, formatData } from "@/lib/fondatori";
import { deModerat, MOTIVE_RAPORTARE, type MotivRaportare } from "@/lib/moderare";
import { formatPret } from "@/lib/etichete";
import { aprobaAnunt, respingeAnunt } from "./actiuni";

export const metadata: Metadata = { title: "Moderare anunțuri", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ModerarePage() {
  const u = await utilizatorCurent();
  if (!esteAdmin(u?.email)) notFound();
  const anunturi = await deModerat();
  return (
    <>
      <h1>Moderare anunțuri</h1>
      <p className="muted">
        Aici apar anunțurile oprite de filtrul automat sau raportate de vizitatori. Cele „în verificare” nu sunt vizibile pe site
        până nu le aprobi. · <Link href="/admin/invitatii">Invitații</Link> · <Link href="/admin/facturi">Facturi</Link> · <Link href="/admin/plati">Plăți</Link> · <Link href="/admin/retrageri">Retrageri</Link> · <Link href="/admin/conturi">Ștergere cont</Link> · <Link href="/admin/email">Emailuri</Link>
      </p>
      {anunturi.length === 0 && <p className="succes">Nimic de verificat acum. 👍</p>}
      {anunturi.map((a) => (
        <div key={a.id} className="moderare-item">
          <div>
            <strong>#{a.id} {a.titlu}</strong> <span className="muted small">· {formatPret(a as Parameters<typeof formatPret>[0])} · publicat {formatData(a.publicatLa)}</span>
          </div>
          <div className="small">
            {a.moderare === "verificare" ? (
              <span className="stare-verificare">În verificare (ascuns de pe site): {a.motivModerare}</span>
            ) : (
              <span className="muted">Vizibil pe site</span>
            )}
            {" · "}Proprietar: {a.proprietar.nume}, {a.proprietar.email}, {a.proprietar.telefon}
          </div>
          <p className="small" style={{ whiteSpace: "pre-wrap" }}>{a.descriere.slice(0, 600)}{a.descriere.length > 600 && "…"}</p>
          {a.raportari.length > 0 && (
            <ul className="small">
              {a.raportari.map((r) => (
                <li key={r.id}>
                  ⚑ {MOTIVE_RAPORTARE[r.motiv as MotivRaportare] ?? r.motiv}
                  {r.detalii && <>: „{r.detalii}”</>} <span className="muted">({formatData(r.creatLa)})</span>
                </li>
              ))}
            </ul>
          )}
          <form className="butoane-anunt">
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" formAction={aprobaAnunt}>Aprobă</button>
            <input name="motiv" placeholder="Motivul respingerii (îl vede proprietarul)" maxLength={300} style={{ flex: "1 1 240px" }} />
            <button type="submit" formAction={respingeAnunt} className="secundar">Respinge</button>
          </form>
        </div>
      ))}
    </>
  );
}
