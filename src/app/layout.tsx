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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap" rel="stylesheet" />
      </head>
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
              <Link href="/#proiecte">Proiecte noi</Link>
              <Link href="/legislatie">Legislație</Link>
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
              <Link href="/legislatie">Legislație</Link>
              <Link href="/termeni">Termeni și condiții</Link>
              <Link href="/confidentialitate">Confidențialitate și cookie-uri</Link>
              <Link href="/anulare-rambursare">Anulare și rambursare</Link>
              <Link href="/livrare">Livrare</Link>
              <Link href="/retragere">Retragere din contract</Link>
              <Link href="/contact">Contact</Link>
            </nav>
            <div className="subsol-plati">
              <span>Plăți securizate cu cardul prin</span>
              <a href="https://netopia-payments.com" target="_blank" rel="noopener noreferrer" className="netopia">
                {/* Sigla oficială din contul NETOPIA → Identitate vizuală (id-ul e al punctului de vânzare CheiaMea). */}
                <picture>
                  <source media="(prefers-color-scheme: dark)" srcSet="https://mny.ro/np-white-0.svg?id=170227" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://mny.ro/np-black-0.svg?id=170227" alt="NETOPIA Payments" width={160} height={32} />
                </picture>
              </a>
              <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="nofollow noopener noreferrer" className="anpc">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/anpc-sal.svg" alt="ANPC - Soluționarea alternativă a litigiilor" width={250} height={50} />
              </a>
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="nofollow noopener noreferrer" className="anpc">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/anpc-sol.svg" alt="Soluționarea online a litigiilor" width={250} height={50} />
              </a>
            </div>
            <p className="small">
              © 2026 CheiaMea · anunțuri imobiliare din toată țara · operat de {FIRMA.nume}, CUI {FIRMA.cui}, {FIRMA.regCom}, {FIRMA.sediu} ·{" "}
              <a href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>
              {FIRMA.telefon && <> · <a href={`tel:${FIRMA.telefon.replace(/\s/g, "")}`}>{FIRMA.telefon}</a></>}
            </p>
          </div>
        </footer>
        <nav className="bara-mobil" aria-label="Navigare rapidă">
          <Link href="/">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v10H3z" /></svg>Acasă
          </Link>
          <Link href="/cautare">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>Caută
          </Link>
          <Link href="/cont/anunt-nou" className="adauga">
            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span>Adaugă
          </Link>
          <Link href="/cont/favorite">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>Favorite
          </Link>
          <Link href="/cont">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>Cont
          </Link>
        </nav>
      </body>
    </html>
  );
}
