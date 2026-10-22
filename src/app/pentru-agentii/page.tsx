import Link from "next/link";
import type { Metadata } from "next";

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

export default function PentruAgentiiPage() {
  return (
    <>
      <section className="hero hero-anim">
        <div className="forme" aria-hidden="true"><span>🏢</span><span>🤝</span><span>🔑</span></div>
        <h1>CheiaMea pentru agenții imobiliare</h1>
        <p>Un cont dedicat agenției tale, separat de anunțurile persoanelor fizice.</p>
        <div className="filtre">
          <Link href="/pentru-agentii/inregistrare" className="buton buton-alb">Creează cont de agenție</Link>
          <Link href="/cont/autentificare" className="buton buton-contur">Am deja cont</Link>
        </div>
      </section>

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

      <p className="muted" style={{ marginTop: 24 }}>
        Vezi și <Link href="/agentii">lista agențiilor de pe CheiaMea</Link>.
      </p>
    </>
  );
}
