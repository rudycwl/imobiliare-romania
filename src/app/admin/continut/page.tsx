import type { Metadata } from "next";
import { cerePanou } from "@/lib/panou";
import { ACTUALIZAT, STIRI, STIRI_PIATA } from "@/lib/continut";
import { caleImpozite, ORASE_IMPOZITE } from "@/lib/impozite-locale";
import { cheieStire, citesteAscunse } from "@/lib/continut-db";
import { comuta } from "./actiuni";

export const metadata: Metadata = { title: "Știri și impozite", robots: { index: false } };
export const dynamic = "force-dynamic";

function Buton({ cheie, ascuns }: { cheie: string; ascuns: boolean }) {
  return (
    <form action={comuta}>
      <input type="hidden" name="cheie" value={cheie} />
      <input type="hidden" name="ascunde" value={ascuns ? "0" : "1"} />
      <button type="submit" className="small">{ascuns ? "Arată din nou" : "Ascunde"}</button>
    </form>
  );
}

const Stare = ({ ascuns }: { ascuns: boolean }) => (ascuns ? <strong className="eroare small">ascuns</strong> : <span className="muted small">pe site</span>);

export default async function ContinutPage() {
  await cerePanou();
  const ascunse = new Set(await citesteAscunse());
  return (
    <>
      <h1>Știri și impozite locale</h1>
      <p className="muted">
        Le adaugă motorul automat, doar după ce le verifică în sursa oficială (legi, ANAF, hotărârile primăriilor) sau în presa aprobată (știri de piață).
        Ultima actualizare: {ACTUALIZAT}. Dacă ceva nu e bine, apasă „Ascunde” și dispare de pe site imediat.
      </p>

      <h2>Noutăți legislative ({STIRI.length})</h2>
      <div className="tabel-wrap">
        <table className="tabel">
          <thead><tr><th>Data</th><th>Titlu</th><th>Sursa</th><th>Stare</th><th></th></tr></thead>
          <tbody>
            {STIRI.map((s) => {
              const a = ascunse.has(cheieStire(s));
              return (
                <tr key={s.sursa.url + s.titlu}>
                  <td>{s.data}</td><td>{s.titlu}</td>
                  <td><a href={s.sursa.url} target="_blank" rel="noopener noreferrer">{s.sursa.nume}</a></td>
                  <td><Stare ascuns={a} /></td><td><Buton cheie={cheieStire(s)} ascuns={a} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>Știri de piață ({STIRI_PIATA.length})</h2>
      <div className="tabel-wrap">
        <table className="tabel">
          <thead><tr><th>Data</th><th>Titlu</th><th>Sursa</th><th>Stare</th><th></th></tr></thead>
          <tbody>
            {STIRI_PIATA.map((s) => {
              const a = ascunse.has(cheieStire(s));
              return (
                <tr key={s.url}>
                  <td>{s.data}</td><td>{s.titlu}</td>
                  <td><a href={s.url} target="_blank" rel="noopener noreferrer">{s.sursa}</a></td>
                  <td><Stare ascuns={a} /></td><td><Buton cheie={cheieStire(s)} ascuns={a} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>Impozite locale ({ORASE_IMPOZITE.length} orașe)</h2>
      <div className="tabel-wrap">
        <table className="tabel">
          <thead><tr><th>Oraș</th><th>Cota la locuințe</th><th>Hotărârea</th><th>Verificat</th><th>Stare</th><th></th></tr></thead>
          <tbody>
            {ORASE_IMPOZITE.map((o) => {
              const cale = caleImpozite(o);
              const a = ascunse.has(cale);
              return (
                <tr key={cale}>
                  <td><a href={cale} target="_blank" rel="noopener noreferrer">{o.nume}</a></td>
                  <td>{o.cote[0]?.valoare}</td>
                  <td>{o.surse[0] ? <a href={o.surse[0].url} target="_blank" rel="noopener noreferrer">{o.hotarare}</a> : o.hotarare}</td>
                  <td>{o.verificat}</td>
                  <td><Stare ascuns={a} /></td><td><Buton cheie={cale} ascuns={a} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
