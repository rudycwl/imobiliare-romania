import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utilizatorCurent } from "@/lib/auth";
import { db } from "@/lib/db";
import { numarPotriviri } from "@/lib/anunturi";
import { curataFiltre } from "@/lib/cautari";
import { formatData } from "@/lib/fondatori";
import { CadruCont } from "../CadruCont";
import { stergeCautarea } from "./actiuni";

export const metadata: Metadata = { title: "Căutări salvate", robots: { index: false } };

export default async function CautariPage() {
  const u = await utilizatorCurent();
  if (!u) redirect("/cont/autentificare?inapoi=/cont/cautari");
  const cautari = await db.cautareSalvata.findMany({ where: { utilizatorId: u.id }, orderBy: { creatLa: "desc" } });
  const numere = await Promise.all(
    cautari.map(async (c) => {
      const f = curataFiltre(c.filtre as Record<string, unknown>);
      return { total: await numarPotriviri(f), noi: await numarPotriviri(f, c.vazutLa) };
    }),
  );
  return (
    <CadruCont u={u}>
      <h1>🔔 Căutări salvate</h1>
      {cautari.length ? (
        <ul className="anunturile-mele">
          {cautari.map((c, i) => (
            <li key={c.id}>
              <div>
                {/* <a>, nu <Link>: adresa e o rută de server care marchează căutarea ca văzută și redirecționează. */}
                <a href={`/cont/cautari/${c.id}`}><strong>{c.nume}</strong></a>
                {numere[i].noi > 0 && <span className="eticheta-noi">{numere[i].noi === 1 ? "1 anunț nou" : `${numere[i].noi} anunțuri noi`}</span>}
                <div className="small muted">
                  {numere[i].total === 1 ? "1 anunț" : `${numere[i].total} anunțuri`} acum · salvată pe {formatData(c.creatLa)}
                </div>
              </div>
              <form className="butoane-anunt" action={stergeCautarea}>
                <input type="hidden" name="id" value={c.id} />
                <a href={`/cont/cautari/${c.id}`} className="buton">Vezi anunțurile</a>
                <button type="submit" className="secundar">Șterge</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          Nu ai căutări salvate. Fă o căutare (de exemplu apartamente de vânzare în orașul tău), apoi apasă „🔔 Salvează căutarea” de sub filtre.
          Aici vei vedea câte anunțuri noi au apărut de la ultima ta vizită. <Link href="/cautare">Începe o căutare</Link>
        </p>
      )}
    </CadruCont>
  );
}
