import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Vanzator } from "@/components/Vanzator";
import { utilizatorCurent } from "@/lib/auth";
import { cautaAnunturi } from "@/lib/anunturi";
import { getJudet, getOras } from "@/lib/geo";
import { formatData } from "@/lib/fondatori";
import { db } from "@/lib/db";
import { prelungeste, retrage } from "./actiuni";
import { CadruCont } from "./CadruCont";
import { formatPret } from "@/lib/etichete";
import { credite } from "@/lib/abonamente";
import { ANUNTURI_GRATUITE, ZILE_VALABILITATE } from "@/lib/tarife";

/** Butonul „Prelungește” apare cu atâtea zile înainte de expirare. */
const ZILE_AVERTIZARE = 10;

const FILE = [
  { cod: "active", nume: "Active" },
  { cod: "verificare", nume: "În verificare" },
  { cod: "expirate", nume: "Expirate sau retrase" },
  { cod: "respinse", nume: "Respinse" },
] as const;
type Fila = (typeof FILE)[number]["cod"];

/** „1 vizualizare”, „5 vizualizări”, „20 de vizualizări”. */
function cate(n: number, unu: string, multe: string) {
  if (n === 1) return `1 ${unu}`;
  const r = n % 100;
  return `${n}${n && (r === 0 || r >= 20) ? " de" : ""} ${multe}`;
}

function filaAnunt(a: { moderare: string; expiraLa: Date }, acum: Date): Fila {
  if (a.moderare === "respins") return "respinse";
  if (a.expiraLa <= acum) return "expirate";
  return a.moderare === "verificare" ? "verificare" : "active";
}


export const metadata: Metadata = { title: "Contul meu" };

function EtichetePromovare({ a, acum }: { a: { evidentiatPanaLa: Date | null; topPanaLa: Date | null; primaPaginaPanaLa: Date | null }; acum: Date }) {
  const e = [
    a.topPanaLa && a.topPanaLa > acum && `Top în oraș până la ${formatData(a.topPanaLa)}`,
    a.evidentiatPanaLa && a.evidentiatPanaLa > acum && `Evidențiat până la ${formatData(a.evidentiatPanaLa)}`,
    a.primaPaginaPanaLa && a.primaPaginaPanaLa > acum && `Prima pagină a județului până la ${formatData(a.primaPaginaPanaLa)}`,
  ].filter(Boolean);
  return e.length ? <span className="promo-activa"> · {e.join(" · ")}</span> : null;
}

export default async function ContPage({ searchParams }: { searchParams: Promise<{ eroare?: string; fila?: string }> }) {
  const { eroare, fila: filaCeruta } = await searchParams;
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare");
  const [{ anunturi }, rec, cr] = await Promise.all([
    cautaAnunturi({ proprietar: u.id, toate: true }, 200),
    db.utilizator.findUnique({ where: { id: u.id }, select: { abonamentPanaLa: true } }),
    credite(u.id),
  ]);
  const plan = cr.abonament;
  const limita = plan ? plan.anunturi : ANUNTURI_GRATUITE;
  const acum = new Date();
  const numar = Object.fromEntries(FILE.map((f) => [f.cod, 0])) as Record<Fila, number>;
  for (const a of anunturi) numar[filaAnunt(a, acum)]++;
  // Fără fila cerută în link: prima filă care are anunțuri (de obicei „Active”).
  const fila: Fila = FILE.some((f) => f.cod === filaCeruta) ? (filaCeruta as Fila) : (FILE.find((f) => numar[f.cod])?.cod ?? "active");
  const lista = anunturi.filter((a) => filaAnunt(a, acum) === fila);
  const active = numar.active + numar.verificare;
  const curand = anunturi.filter((a) => a.expiraLa > acum && a.expiraLa.getTime() - acum.getTime() <= ZILE_AVERTIZARE * 864e5).length;
  const deActive = anunturi.filter((a) => a.expiraLa > acum);
  const vizualizari = deActive.reduce((s, a) => s + a.vizualizari, 0);
  const telefon = deActive.reduce((s, a) => s + a.afisariTelefon, 0);
  return (
    <CadruCont u={u}>
      <h1 id="anunturile-mele">Anunțurile mele</h1>
      <Vanzator u={u} />
      <p className="muted small">
        {u.email} · {u.telefon} · {getOras(u.judet, u.oras)?.nume}, {getJudet(u.judet)?.nume}
        {u.contact && ` · contact: ${u.contact}`} · <Link href="/cont/setari">Modifică</Link>
        {u.tip === "agentie" && <> · <Link href={`/agentii/${u.slug}`}>Profilul public al agenției</Link></>}
      </p>
      {u.tip === "agentie" && u.gratuitPanaLa && u.gratuitPanaLa > acum && (
        <p className="succes">
          {u.fondator ? "⭐ Ești Agenție Fondatoare. " : ""}Abonamentul tău e gratuit până la {formatData(u.gratuitPanaLa)}
          {u.fondator ? ", apoi ai 50% reducere permanent cât rămâi abonat." : "."}
        </p>
      )}

      <div className="cifre-cont">
        <div><strong>{active}{limita !== null && <span className="muted small"> din {limita}</span>}</strong><span className="muted small">anunțuri active</span></div>
        <div><strong>{vizualizari}</strong><span className="muted small">vizualizări la anunțurile active</span></div>
        <div><strong>{telefon}</strong><span className="muted small">apăsări pe „Sună”</span></div>
        <div><strong>{curand}</strong><span className="muted small">expiră în {ZILE_AVERTIZARE} zile</span></div>
      </div>

      {u.tip === "agentie" && (
        <p className="abonament-stare">
          {plan ? (
            <>
              Abonament <strong>{plan.nume}</strong>
              {rec?.abonamentPanaLa && rec.abonamentPanaLa > acum ? <> până la {formatData(rec.abonamentPanaLa)}</> : <> (perioada gratuită)</>}
              {" · "}Credite luna aceasta: {cr.reactualizari} reactualizări, {cr.top} × Top în oraș 7 zile · <Link href="/cont/abonament">Gestionează</Link>
            </>
          ) : (
            <>Nu ai un abonament activ. <Link href="/cont/abonament">Alege un abonament</Link>.</>
          )}
        </p>
      )}
      <p className="muted small">
        Fiecare anunț e valabil {ZILE_VALABILITATE} de zile{plan ? "" : `, iar gratuit poți avea ${ANUNTURI_GRATUITE} anunțuri active`}. Îl poți prelungi gratuit.
      </p>
      {eroare === "limita" && <p className="eroare">Ai atins limita de {limita} anunțuri active. Retrage unul înainte să reactivezi altul.</p>}

      {anunturi.length ? (
        <>
          <nav className="file-cont" aria-label="Filtrează anunțurile">
            {FILE.filter((f) => f.cod === "active" || numar[f.cod]).map((f) => (
              <Link key={f.cod} href={`/cont?fila=${f.cod}`} aria-current={f.cod === fila ? "page" : undefined}>
                {f.nume}<span className="numar">{numar[f.cod]}</span>
              </Link>
            ))}
          </nav>
          {lista.length ? (
            <ul className="anunturile-mele">
              {lista.map((a) => {
                const expirat = a.expiraLa <= acum;
                const zile = Math.ceil((a.expiraLa.getTime() - acum.getTime()) / 864e5);
                return (
                  <li key={a.id} className={expirat ? "expirat" : undefined}>
                    <div className="info-anunt">
                      <span className="mini" style={{ background: a.imagine }} aria-hidden />
                      <div>
                        <Link href={`/anunt/${a.id}`}><strong>{a.titlu}</strong></Link>
                        <span className="muted small"> · {formatPret(a)}</span>
                        <div className="small">
                          {a.moderare === "respins" ? (
                            <span className="stare-expirat">Respins de moderare: {a.motivModerare}</span>
                          ) : a.moderare === "verificare" && !expirat ? (
                            <span className="stare-verificare">În verificare: nu apare încă pe site. De obicei durează câteva ore.</span>
                          ) : expirat ? (
                            <span className="stare-expirat">Expirat sau retras</span>
                          ) : (
                            <span className="muted">Activ până la {formatData(a.expiraLa)}</span>
                          )}
                          {!expirat && <EtichetePromovare a={a} acum={acum} />}
                        </div>
                        <div className="small statistici-anunt">👁 {cate(a.vizualizari, "vizualizare", "vizualizări")} · 📞 {cate(a.afisariTelefon, "apăsare", "apăsări")} pe „Sună”</div>
                      </div>
                    </div>
                    <form className="butoane-anunt">
                      <input type="hidden" name="id" value={a.id} />
                      {a.moderare !== "respins" && (expirat || zile <= ZILE_AVERTIZARE) && (
                        <button type="submit" formAction={prelungeste}>{expirat ? "Reactivează" : `Prelungește ${ZILE_VALABILITATE} de zile`}</button>
                      )}
                      {a.moderare !== "respins" && <Link href={`/cont/anunt/${a.id}/editeaza`} className="buton secundar">Editează</Link>}
                      <Link href={`/cont/anunt/${a.id}/poze`} className="buton buton-contur-inchis">Poze</Link>
                      {!expirat && <Link href={`/cont/promoveaza/${a.id}`} className="buton">Promovează</Link>}
                      {!expirat && <button type="submit" formAction={retrage} className="secundar">Retrage</button>}
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">Nu ai anunțuri aici.</p>
          )}
        </>
      ) : (
        <p className="muted">
          Nu ai publicat încă niciun anunț. <Link href="/cont/anunt-nou">Adaugă primul anunț</Link>, e gratuit.
        </p>
      )}

      <div className="recomandare-mica">
        <span>🎁 Recomandă CheiaMea prietenilor și primești zile de promovare gratuită.</span>
        <Link href="/cont/recomanda">Vezi linkul tău</Link>
      </div>
    </CadruCont>
  );
}
