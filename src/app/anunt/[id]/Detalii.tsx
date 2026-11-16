import Link from "next/link";
import { blocuriDescriere, type Localizare } from "@/lib/anunt-format";

/** Blocul „Caracteristici”: grilă cu etichetă deasupra valorii (2 coloane pe mobil). */
export function Caracteristici({ randuri }: { randuri: { eticheta: string; valoare: string }[] }) {
  return (
    <section className="caracteristici" aria-labelledby="titlu-caracteristici">
      <h2 id="titlu-caracteristici">Caracteristici</h2>
      <dl>
        {randuri.map((r) => (
          <div key={r.eticheta}>
            <dt>{r.eticheta}</dt>
            <dd>{r.valoare}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** „Zona, Oraș (jud. Județ)”, cu orașul ca link spre lista lui. București: „Zona, Sector X, București”. */
export function TextLocalizare({ l, href, bucuresti }: { l: Localizare; href: string; bucuresti: boolean }) {
  return (
    <>
      {l.zona && `${l.zona}, `}
      <Link href={href}>{l.oras}</Link>
      {l.judet && (bucuresti ? `, ${l.judet}` : ` (jud. ${l.judet})`)}
    </>
  );
}

/** Descrierea împărțită în paragrafe și liste; textul din baza de date rămâne neschimbat. */
export function Descriere({ text }: { text: string }) {
  return (
    <div className="descriere-anunt">
      {blocuriDescriere(text).map((b, i) =>
        b.tip === "lista" ? (
          <ul key={i}>
            {b.elemente.map((e, k) => (
              <li key={k}>{e}</li>
            ))}
          </ul>
        ) : b.tip === "titlu" ? (
          <p key={i} className="titlu-descriere">{b.text}</p>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </div>
  );
}
