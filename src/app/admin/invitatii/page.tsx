import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { formatData, listaInvitatii, locuriRamase } from "@/lib/fondatori";
import { genereazaInvitatie } from "./actiuni";

export const metadata: Metadata = { title: "Invitații agenții", robots: { index: false } };
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export default async function InvitatiiPage() {
  const u = await cerePanou();
  const [invitatii, ramase] = await Promise.all([listaInvitatii(), locuriRamase()]);
  const acum = new Date();
  return (
    <>
      <h1>Invitații pentru agenții</h1>
      <p className="muted">Locuri de Agenție Fondatoare libere: {ramase}. O invitație rezervă un loc 14 zile. · <a href="/admin/statistici">Statistici pe surse</a></p>
      <form action={genereazaInvitatie} className="filtre">
        <input name="nota" placeholder="Pentru cine (ex. numele agenției)" maxLength={120} style={{ flex: "1 1 260px" }} />
        <button type="submit">Generează invitație</button>
      </form>
      <table className="tabel">
        <thead>
          <tr><th>Pentru</th><th>Link de trimis</th><th>Stare</th></tr>
        </thead>
        <tbody>
          {invitatii.map((i) => (
            <tr key={i.cod}>
              <td>{i.nota ?? "—"}</td>
              <td><code>{`${SITE}/pentru-agentii?cod=${i.cod}`}</code></td>
              <td>
                {i.agentie ? `✅ Folosită de ${i.agentie.nume}` : i.expiraLa < acum ? "Expirată" : `Valabilă până la ${formatData(i.expiraLa)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
