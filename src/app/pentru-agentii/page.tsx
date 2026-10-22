import Link from "next/link";
import { Distribuie } from "@/components/Distribuie";
import type { Metadata } from "next";
import { formatData, getInvitatieValabila, locuriRamase, LOCURI_FONDATOARE, LUNI_GRATUITE } from "@/lib/fondatori";

export const metadata: Metadata = {
  title: "Pentru agenții imobiliare",
  description: "Zona CheiaMea pentru agenții imobiliare: profil public, oferte nelimitate și clienți din toate județele.",
};

const AVANTAJE = [
  { icon: "🏢", titlu: "Profil public de agenție", text: "Pagina agenției tale, cu logo, date de contact și toate ofertele într-un singur loc." },
  { icon: "📋", titlu: "Oferte nelimitate", text: "Publici tot portofoliul, în orice județ și oraș din țară." },
  { icon: "🏷️", titlu: "Insignă „Agenție”", text: "Anunțurile tale apar marcate clar, iar clienții te găsesc la filtrul „Oferit de”." },
  { icon: "🇷🇴", titlu: "Acoperire națională", text: "Toate cele 41 de județe și Bucureștiul, organizate pe orașe." },
];


export default async function PentruAgentiiPage({ searchParams }: { searchParams: Promise<{ cod?: string }> }) {
  const { cod } = await searchParams;
  const [ramase, invitatie] = await Promise.all([locuriRamase(), getInvitatieValabila(cod)]);
  const inscriere = invitatie ? `/pentru-agentii/inregistrare?cod=${invitatie.cod}` : "/pentru-agentii/inregistrare";
  return (
    <>
      <section className="hero hero-anim">
        <div className="forme" aria-hidden="true"><span>🏢</span><span>🤝</span><span>🔑</span></div>
        <h1>CheiaMea pentru agenții imobiliare</h1>
        <p>Un cont dedicat agenției tale, separat de anunțurile persoanelor fizice.</p>
        {invitatie && (
          <p className="rezervat">
            🎟️ Ai un loc de Agenție Fondatoare rezervat până la {formatData(invitatie.expiraLa)}.
          </p>
        )}
        {ramase > 0 && (
          <p className="contor">
            Au mai rămas <strong>{ramase}</strong> din {LOCURI_FONDATOARE} de locuri de Agenție Fondatoare
          </p>
        )}
        <div className="filtre">
          <Link href={inscriere} className="buton buton-alb">{invitatie ? "Activează locul rezervat" : "Creează cont de agenție"}</Link>
          <Link href="/cont/autentificare" className="buton buton-contur">Am deja cont</Link>
        </div>
      </section>

      {(ramase > 0 || invitatie) && (
        <section className="oferta">
          <h2>⭐ Oferta Agenție Fondatoare</h2>
          <ul>
            <li><strong>{LUNI_GRATUITE} luni gratuit</strong>, cu toate funcțiile pentru agenții.</li>
            <li>Apoi <strong>50% reducere permanent</strong>, cât timp rămâi abonat.</li>
            <li>Insigna <strong>„Agenție Fondatoare”</strong> pe profil și pe toate anunțurile.</li>
            <li>Valabil pentru primele {LOCURI_FONDATOARE} de agenții înscrise, până la 31 decembrie 2026.</li>
          </ul>
          <Link href={inscriere} className="buton">Vreau locul meu</Link>
        </section>
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

      <Distribuie url="https://cheiamea.ro/pentru-agentii" text="CheiaMea: 6 luni gratuit pentru primele 100 de agenții imobiliare." />
      <p className="muted" style={{ marginTop: 24 }}>
        Vezi și <Link href="/agentii">lista agențiilor de pe CheiaMea</Link>.
      </p>
    </>
  );
}
