import type { Metadata } from "next";
import Link from "next/link";
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
        <header className="header">
          <div className="container header-inner">
            <Link href="/" className="logo">
              🔑 Cheia<span className="logo-accent">Mea</span>
            </Link>
            <nav>
              <Link href="/cautare">Caută</Link>
              <Link href="/agentii">Agenții</Link>
              <Link href="/cont/autentificare">Contul meu</Link>
              <Link href="/cont/anunt-nou" className="buton">+ Adaugă anunț</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          <div className="container muted">© 2026 CheiaMea · anunțuri imobiliare din toată țara</div>
        </footer>
      </body>
    </html>
  );
}
