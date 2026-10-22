import type { Metadata } from "next";
import Link from "next/link";
import { FIRMA } from "@/lib/firma";
import { Atribuire } from "@/components/Atribuire";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheiamea.ro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "CheiaMea – anunțuri imobiliare din toată țara", template: "%s | CheiaMea" },
  description: "CheiaMea: apartamente, case, terenuri și spații comerciale de vânzare și de închiriat în toate județele și orașele României.",
  applicationName: "CheiaMea",
  openGraph: { siteName: "CheiaMea", locale: "ro_RO", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>
        <Atribuire />
        <header className="header">
          <div className="container header-inner">
            <Link href="/" className="logo">
              <svg className="logo-icon" viewBox="0 0 80 80" aria-hidden="true">
                <rect width="80" height="80" rx="20" fill="#0B2545" />
                <path d="M40 16 L64 36 V64 H16 V36 Z" fill="#F97316" stroke="#F97316" strokeWidth="4" strokeLinejoin="round" />
                <circle cx="40" cy="42" r="7" fill="#0B2545" />
                <path d="M36.5 45 h7 l2.5 12 h-12 z" fill="#0B2545" />
              </svg>
              <span>Cheia<span className="logo-accent">Mea</span></span>
            </Link>
            <nav>
              <Link href="/cautare">Caută</Link>
              <Link href="/agentii">Agenții</Link>
              <Link href="/pentru-agentii">Pentru agenții</Link>
              <Link href="/preturi">Prețuri</Link>
              <Link href="/cont/autentificare">Contul meu</Link>
              <Link href="/cont/anunt-nou" className="buton">+ Adaugă anunț</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          <div className="container muted subsol">
            <nav className="subsol-linkuri">
              <Link href="/pentru-agentii">Pentru agenții</Link>
              <Link href="/preturi">Prețuri</Link>
              <Link href="/termeni">Termeni și condiții</Link>
              <Link href="/confidentialitate">Confidențialitate și cookie-uri</Link>
              <Link href="/anulare-rambursare">Anulare și rambursare</Link>
              <Link href="/contact">Contact</Link>
            </nav>
            <div className="subsol-plati">
              <span>Plăți securizate cu cardul prin</span>
              <a href="https://netopia-payments.com" target="_blank" rel="noopener noreferrer" className="netopia">NETOPIA Payments</a>
              <span className="carduri" aria-label="Visa și Mastercard">VISA · Mastercard</span>
              <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">ANPC – SAL</a>
            </div>
            <p className="small">
              © 2026 CheiaMea · anunțuri imobiliare din toată țara · operat de {FIRMA.nume}, CUI {FIRMA.cui}, {FIRMA.regCom}, {FIRMA.sediu} ·{" "}
              <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
