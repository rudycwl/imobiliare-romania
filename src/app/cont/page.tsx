import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Vanzator } from "@/components/Vanzator";
import { utilizatorCurent } from "@/lib/auth";
import { cautaAnunturi } from "@/lib/anunturi";
import { getJudet, getOras } from "@/lib/geo";
import { formatData } from "@/lib/fondatori";
import { db } from "@/lib/db";
import { Distribuie } from "@/components/Distribuie";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";
import { deconectare, prelungeste, retrage } from "./actiuni";
import { formatPret } from "@/lib/etichete";
import { credite } from "@/lib/abonamente";
import { ANUNTURI_GRATUITE, ZILE_VALABILITATE } from "@/lib/tarife";

/** Butonul „Prelungește” apare cu atâtea zile înainte de expirare. */
const ZILE_AVERTIZARE = 10;


export const metadata: Metadata = { title: "Contul meu" };

function EtichetePromovare({ a, acum }: { a: { evidentiatPanaLa: Date | null; topPanaLa: Date | null; primaPaginaPanaLa: Date | null }; acum: Date }) {
  const e = [
    a.topPanaLa && a.topPanaLa > acum && `Top în oraș până la ${formatData(a.topPanaLa)}`,
    a.evidentiatPanaLa && a.evidentiatPanaLa > acum && `Evidențiat până la ${formatData(a.evidentiatPanaLa)}`,
    a.primaPaginaPanaLa && a.primaPaginaPanaLa > acum && `Prima pagină a județului până la ${formatData(a.primaPaginaPanaLa)}`,
  ].filter(Boolean);
  return e.length ? <span className="promo-activa"> · {e.join(" · ")}</span> : null;
}

export default async function ContPage({ searchParams }: { searchParams: Promise<{ eroare?: string }> }) {
  const { eroare } = await searchParams;
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const [{ anunturi, total }, rec, cr] = await Promise.all([
    cautaAnunturi({ proprietar: u.id, toate: true }, 200),
    db.utilizator.findUnique({ where: { id: u.id }, select: { zilePromovare: true, luniBonus: true, abonamentPanaLa: true, _count: { select: { recomandari: true } } } }),
    credite(u.id),
  ]);
  const plan = cr.abonament;
  const limita = plan ? plan.anunturi : ANUNTURI_GRATUITE;
  const acum = new Date();
  const active = anunturi.filter((a) => a.expiraLa > acum).length;
  const linkRecomandare = `${SITE}/?ref=${u.slug}`;
  const recomandari = rec?._count.recomandari ?? 0;
  return (
    <>
      <h1>Contul meu</h1>
      <Vanzator u={u} />
      <p className="muted">
        {u.email} · {u.telefon} · {getOras(u.judet, u.oras)?.nume}, {getJudet(u.judet)?.nume}
        {u.contact && ` · contact: ${u.contact}`}
      </p>
      {u.tip === "agentie" && u.gratuitPanaLa && u.gratuitPanaLa > new Date() && (
        <p className="succes">
          {u.fondator ? "⭐ Ești Agenție Fondatoare. " : ""}Abonamentul tău e gratuit până la {formatData(u.gratuitPanaLa)}
          {u.fondator ? ", apoi ai 50% reducere permanent cât rămâi abonat." : "."}
        </p>
      )}
      <div className="actiuni">
        <Link href="/cont/anunt-nou" className="buton">+ Adaugă anunț</Link>
        {u.tip === "agentie" && <Link href={`/agentii/${u.slug}`}>Vezi profilul public al agenției</Link>}
        <form action={deconectare}>
          <button type="submit" className="secundar">Ieși din cont</button>
        </form>
      </div>
      <section className="recomandare">
        <h2>🎁 Recomandă CheiaMea</h2>
        <p>
          Trimite linkul tău. La fiecare <strong>3 conturi</strong> create prin el primești <strong>7 zile de promovare gratuită</strong>
          {u.tip === "agentie" && <>, iar pentru fiecare <strong>agenție</strong> adusă, <strong>+1 lună gratuită</strong> (maximum 6)</>}.
        </p>
        <input className="link-recomandare" readOnly value={linkRecomandare} aria-label="Linkul tău de recomandare" />
        <Distribuie url={linkRecomandare} text="Uite CheiaMea, anunțuri imobiliare din toată țara, publicare gratuită pentru proprietari:" />
        <p className="muted small">
          Conturi aduse: {recomandari} · Zile de promovare câștigate: {rec?.zilePromovare ?? 0}
          {u.tip === "agentie" && ` · Luni gratuite primite: ${rec?.luniBonus ?? 0} din 6`}
        </p>
      </section>

      <h2 id="anunturile-mele">Anunțurile mele</h2>
      {u.tip === "agentie" && (
        <p className="abonament-stare">
          {plan ? (
            <>
              Abonament <strong>{plan.nume}</strong>
              {rec?.abonamentPanaLa && rec.abonamentPanaLa > acum ? <> până la {formatData(rec.abonamentPanaLa)}</> : <> (perioada gratuită)</>}
              {" · "}Credite luna aceasta: {cr.reactualizari} reactualizări, {cr.top} × Top în oraș 7 zile
            </>
          ) : (
            <>Nu ai un abonament activ. Vezi <Link href="/pentru-agentii#abonamente">abonamentele pentru agenții</Link>.</>
          )}
        </p>
      )}
      <p className="muted">
        Ai <strong>{active}</strong> {limita === null ? "anunțuri active" : <>din {limita} anunțuri active{plan ? "" : " gratuite"}</>}. Fiecare e valabil {ZILE_VALABILITATE} de zile și îl poți prelungi gratuit.
      </p>
      {eroare === "limita" && <p className="eroare">Ai atins limita de {limita} anunțuri active. Retrage unul înainte să reactivezi altul.</p>}
      {total ? (
        <ul className="anunturile-mele">
          {anunturi.map((a) => {
            const expirat = a.expiraLa <= acum;
            const zile = Math.ceil((a.expiraLa.getTime() - acum.getTime()) / 864e5);
            return (
              <li key={a.id} className={expirat ? "expirat" : undefined}>
                <div>
                  <Link href={`/anunt/${a.id}`}><strong>{a.titlu}</strong></Link>
                  <span className="muted small"> · {formatPret(a)}</span>
                  <div className="small">
                    {expirat ? <span className="stare-expirat">Expirat sau retras</span> : <span className="muted">Activ până la {formatData(a.expiraLa)}</span>}
                    {!expirat && <EtichetePromovare a={a} acum={acum} />}
                  </div>
                </div>
                <form className="butoane-anunt">
                  <input type="hidden" name="id" value={a.id} />
                  {(expirat || zile <= ZILE_AVERTIZARE) && (
                    <button type="submit" formAction={prelungeste}>{expirat ? "Reactivează" : `Prelungește ${ZILE_VALABILITATE} de zile`}</button>
                  )}
                  <Link href={`/cont/anunt/${a.id}/poze`} className="buton buton-contur-inchis">Poze</Link>
                  {!expirat && <Link href={`/cont/promoveaza/${a.id}`} className="buton">Promovează</Link>}
                  {!expirat && <button type="submit" formAction={retrage} className="secundar">Retrage</button>}
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">Nu ai publicat încă niciun anunț.</p>
      )}
    </>
  );
}
