import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cerePanou } from "@/lib/panou";
import { brevo, emailConfigurat, expeditor } from "@/lib/email";
import { adaugaDomeniul, emailDeTest, leagaDomeniile, puneImprovmx, puneInNetlify, puneZoho, verificaDomeniul } from "./actiuni";
import { netlifyConfigurat } from "@/lib/netlify-dns";

export const metadata: Metadata = { title: "Emailurile site-ului", robots: { index: false } };
export const dynamic = "force-dynamic";

type RandDns = { type?: string; host_name?: string; value?: string; status?: boolean };

/** Numele rândului, așa cum se scrie în Netlify DNS (fără „.cheiamea.ro” la final; „@” pentru domeniul gol). */
function numeRand(host: string | undefined, domeniu: string) {
  const h = (host ?? "").replace(/\.$/, "");
  if (!h || h === "@" || h === domeniu) return "@";
  return h.endsWith("." + domeniu) ? h.slice(0, -domeniu.length - 1) : h;
}

export default async function EmailPage({ searchParams }: { searchParams: Promise<{ m?: string; ok?: string }> }) {
  const { m, ok } = await searchParams;
  const u = await cerePanou();
  const domeniu = expeditor().split("@")[1];

  if (!emailConfigurat())
    return (
      <>
        <h1>Emailurile site-ului</h1>
        <p className="eroare">
          Lipsește cheia Brevo. Deschide app.brevo.com/settings/keys/api → Generate a new API key → pune-o în /configurare la BREVO_API_KEY.
        </p>
      </>
    );

  const d = await brevo("GET", `/senders/domains/${domeniu}`);
  const exista = d.ok;
  // Orice alt răspuns decât „domeniul nu există” (ex. cheie greșită, IP neautorizat) trebuie arătat, nu ascuns.
  const eroare = !d.ok && !/not.?found|does not exist/i.test(`${d.date?.code ?? ""} ${d.date?.message ?? ""}`) ? d.date?.message ?? JSON.stringify(d.date) : null;
  const gata = exista && d.date?.authenticated && d.date?.verified;
  const randuri = Object.entries((d.date?.dns_records ?? {}) as Record<string, RandDns>).filter(([, r]) => r?.value);

  return (
    <>
      <h1>Emailurile site-ului (Brevo)</h1>
      <p className="muted">
        Expeditor: {expeditor()}. De aici pleacă „Am uitat parola” și alertele pentru căutări. · <Link href="/admin/moderare">Moderare</Link>
      </p>
      {m && <p className={ok === "1" ? "succes" : "eroare"}>{m}</p>}
      {eroare && <p className="eroare">Brevo a refuzat cheia: {eroare}</p>}

      {!exista ? (
        <form action={adaugaDomeniul}>
          <p>Domeniul {domeniu} nu e încă în Brevo.</p>
          <button type="submit">Adaugă {domeniu} în Brevo</button>
        </form>
      ) : gata ? (
        <p className="succes">✅ Domeniul {domeniu} e verificat în Brevo. Emailurile pleacă de la {expeditor()}.</p>
      ) : (
        <>
          <p>
            Pune rândurile de mai jos în <strong>Netlify → Domains → {domeniu} → DNS settings → Add new record</strong>, apoi apasă „Verifică”.
            Netlify adaugă singur „.{domeniu}” la nume.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>Tip</th><th>Nume</th><th>Valoare</th><th>Stare</th></tr>
              </thead>
              <tbody>
                {randuri.map(([k, r]) => (
                  <tr key={k}>
                    <td>{r.type}</td>
                    <td><code>{numeRand(r.host_name, domeniu)}</code></td>
                    <td><code style={{ wordBreak: "break-all" }}>{r.value}</code></td>
                    <td>{r.status ? "✅ găsit" : "⏳ lipsește"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!randuri.length && <pre className="small">{JSON.stringify(d.date, null, 2)}</pre>}
        </>
      )}

      {exista && !gata && netlifyConfigurat() && (
        <form action={puneInNetlify} style={{ marginTop: 16 }}>
          <button type="submit">Pune rândurile în Netlify DNS și verifică</button>
        </form>
      )}
      {netlifyConfigurat() && (
        <form action={leagaDomeniile} style={{ marginTop: 16 }}>
          <button type="submit" className="secundar">Leagă www.cheiamea.ro și cheiamea.com de server</button>
        </form>
      )}
      {exista && (
        <form action={verificaDomeniul} style={{ marginTop: 16 }}>
          <button type="submit">Verifică din nou la Brevo</button>
        </form>
      )}
      <form action={emailDeTest} style={{ marginTop: 16 }}>
        <button type="submit" className="secundar">Trimite-mi un email de test</button>
      </form>

      {netlifyConfigurat() && (
        <>
          <h2 style={{ marginTop: 32 }}>Mailurile pentru contact@ și agentii@ (redirecționate în Gmail-ul firmei)</h2>
          <form action={puneImprovmx}>
            <p className="muted small">
              ImprovMX primește mailurile trimise la contact@ și agentii@ și le trimite în Gmail-ul firmei. Butonul pune rândurile MX și SPF.
            </p>
            <button type="submit">Pune rândurile ImprovMX în Netlify DNS</button>
          </form>

          <h2 style={{ marginTop: 32 }}>Sau: căsuțe Zoho pentru contact@ și agentii@</h2>
          <form action={puneZoho}>
            <p className="muted small">
              Lipește aici ce îți arată Zoho: întâi rândul cu „zoho-verification=…”, iar mai târziu cheia DKIM („v=DKIM1; …”).
              MX-urile și SPF-ul le pun singur.
            </p>
            <textarea name="zoho" rows={4} style={{ width: "100%" }} placeholder="zoho-verification=zb…" />
            <p className="small">
              Contul Zoho e pe{" "}
              <select name="dc" defaultValue="eu">
                <option value="eu">zoho.eu (Europa)</option>
                <option value="com">zoho.com</option>
              </select>{" "}
              · Selector DKIM (doar pentru cheia DKIM): <input name="selector" defaultValue="zmail" style={{ width: 120 }} />
            </p>
            <button type="submit">Pune rândurile Zoho în Netlify DNS</button>
          </form>
        </>
      )}
    </>
  );
}
