import Link from "next/link";
import { Distribuie } from "@/components/Distribuie";
import type { Metadata } from "next";
import { TabelAbonamente } from "@/components/TabelAbonamente";
import { LOCURI_FONDATOARE, LUNI_GRATUITE, TERMEN_FONDATOARE, formatData, getInvitatieValabila, locuriRamase } from "@/lib/fondatori";

export const metadata: Metadata = {
  title: "Pentru agenții imobiliare",
  description: "Zona CheiaMea pentru agenții imobiliare: profil public, oferte nelimitate și clienți din toate județele.",
};

const AVANTAJE = [
  { icon: "🏢", titlu: "Profil public de agenție", text: "Pagina agenției tale, cu logo, date de contact și toate ofertele într-un singur loc." },
  { icon: "📥", titlu: "Import rapid", text: "Îți aduci toate ofertele dintr-un fișier Excel (CSV) sau prin API, în orice abonament." },
  { icon: "🏷️", titlu: "Insignă „Agenție”", text: "Anunțurile tale apar marcate clar, iar clienții te găsesc la filtrul „Oferit de”." },
  { icon: "🇷🇴", titlu: "Acoperire națională", text: "Toate cele 41 de județe și Bucureștiul, organizate pe orașe." },
];


export default async function PentruAgentiiPage({ searchParams }: { searchParams: Promise<{ cod?: string }> }) {
  const { cod } = await searchParams;
  const [invitatie, locuri] = await Promise.all([getInvitatieValabila(cod), locuriRamase()]);
  const inscriere = invitatie ? `/pentru-agentii/inregistrare?cod=${invitatie.cod}` : "/pentru-agentii/inregistrare";
  return (
    <>
      <section className="hero hero-anim">
        <div className="forme" aria-hidden="true"><span>🏢</span><span>🤝</span><span>🔑</span></div>
        <h1>CheiaMea pentru agenții imobiliare</h1>
        <p>Un cont dedicat agenției tale, separat de anunțurile persoanelor fizice.</p>
        {invitatie && (
          <p className="rezervat">
            🎟️ Ai o invitație valabilă până la {formatData(invitatie.expiraLa)}.
          </p>
        )}
        <div className="filtre">
          <Link href={inscriere} className="buton buton-alb">{invitatie ? "Folosește invitația" : "Creează cont de agenție"}</Link>
          <Link href="/cont/autentificare" className="buton buton-contur">Am deja cont</Link>
        </div>
      </section>

      {locuri > 0 && (
        <div className="banner-fondator">
          <p className="banner-fondator-titlu">⭐ Agenție Fondatoare: {LUNI_GRATUITE} luni gratuit, apoi 50% reducere pe viață</p>
          <p>
            Pentru primele {LOCURI_FONDATOARE} de agenții înscrise până la {formatData(TERMEN_FONDATOARE)}. Mai sunt <strong>{locuri} locuri</strong>.
            Insigna „Agenție Fondatoare” rămâne permanent pe profil și pe anunțuri, iar ofertele ți le importăm noi.
          </p>
          <Link href={inscriere} className="buton">Rezervă locul agenției</Link>
        </div>
      )}

      <h2>De ce CheiaMea</h2>
      <div className="grid">
        {AVANTAJE.map((a) => (
          <div key={a.titlu} className="card card-body avantaj">
            <div className="avantaj-icon" aria-hidden="true">{a.icon}</div>
            <h3>{a.titlu}</h3>
            <p className="muted">{a.text}</p>
          </div>
        ))}
      </div>

      <div id="abonamente" style={{ marginTop: 24 }}>
        <TabelAbonamente ofertaFondator={locuri > 0} />
      </div>

      <Distribuie url="https://cheiamea.ro/pentru-agentii" text="CheiaMea pentru agenții imobiliare: cont de agenție și anunțuri în toată țara." />
      <p className="muted" style={{ marginTop: 24 }}>
        Vezi și <Link href="/agentii">lista agențiilor de pe CheiaMea</Link>.
      </p>
    </>
  );
}
