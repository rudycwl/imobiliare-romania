import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { credite } from "@/lib/abonamente";
import { formatData } from "@/lib/fondatori";
import { PROMOVARI, REDUCERE_PROMOVARI_ABONATI, lei, pretPromovare } from "@/lib/tarife";
import { creditReactualizare, creditTop } from "./actiuni";

export const metadata: Metadata = { title: "Promovează anunțul" };

export default async function PromoveazaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; eroare?: string }> }) {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const id = Number((await params).id);
  const a = Number.isInteger(id) ? await db.anunt.findFirst({ where: { id, proprietarId: u.id } }) : null;
  if (!a) notFound();
  const { ok, eroare } = await searchParams;
  const cr = await credite(u.id);
  const abonat = !!cr.abonament;
  const acum = new Date();
  return (
    <div className="ingust">
      <h1>Promovează anunțul</h1>
      <p>
        <Link href={`/anunt/${a.id}`}><strong>{a.titlu}</strong></Link>
      </p>
      {a.expiraLa <= acum && <p className="eroare">Anunțul nu e activ. Reactivează-l din <Link href="/cont#anunturile-mele">contul tău</Link> înainte să-l promovezi.</p>}
      {ok && <p className="succes">Gata, promovarea a fost aplicată.</p>}
      {eroare && <p className="eroare">Nu mai ai credite de acest tip luna aceasta.</p>}
      <p className="muted small">
        {[
          a.topPanaLa && a.topPanaLa > acum && `Top în oraș până la ${formatData(a.topPanaLa)}`,
          a.evidentiatPanaLa && a.evidentiatPanaLa > acum && `Evidențiat până la ${formatData(a.evidentiatPanaLa)}`,
          a.primaPaginaPanaLa && a.primaPaginaPanaLa > acum && `Prima pagină a județului până la ${formatData(a.primaPaginaPanaLa)}`,
        ]
          .filter(Boolean)
          .join(" · ") || "Anunțul nu are promovări active."}
      </p>

      {abonat && (
        <section>
          <h2>Credite din abonament</h2>
          <form className="butoane-anunt">
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" formAction={creditReactualizare} disabled={cr.reactualizari < 1}>
              Reactualizare ({cr.reactualizari} rămase)
            </button>
            <button type="submit" formAction={creditTop} disabled={cr.top < 1}>
              Top în oraș 7 zile ({cr.top} rămase)
            </button>
          </form>
        </section>
      )}

      <h2>Cumpără o promovare</h2>
      {abonat && <p className="muted small">Ca agenție abonată ai {Math.round(REDUCERE_PROMOVARI_ABONATI * 100)}% reducere.</p>}
      <ul className="lista-promovari">
        {PROMOVARI.map((p) => (
          <li key={p.cod}>
            <div>
              <strong>{p.nume}</strong>
              <div className="muted small">{p.descriere}</div>
            </div>
            <div className="butoane-anunt">
              <strong className="pret">
                {abonat && <span className="pret-vechi">{lei(p.pret)}</span>}
                {lei(pretPromovare(p, abonat))}
              </strong>
              {a.expiraLa > acum && <Link href={`/cont/plata?promovare=${p.cod}&anunt=${a.id}`} className="buton">Cumpără</Link>}
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small">Plata se face cu cardul, prin NETOPIA Payments. Prețuri finale, fără TVA (Hugetech SRL nu este plătitoare de TVA).</p>
    </div>
  );
}
