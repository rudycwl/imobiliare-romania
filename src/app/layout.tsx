import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Imobiliare România", template: "%s | Imobiliare România" },
  description: "Anunțuri imobiliare din toate județele și orașele României.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>
        <header className="header">
          <div className="container header-inner">
            <Link href="/" className="logo">
              🏠 Imobiliare România
            </Link>
            <nav>
              <Link href="/cautare">Caută</Link>
              <Link href="/agentii">Agenții</Link>
              <Link href="/cont/autentificare">Contul meu</Link>
              <Link href="/cont/inregistrare" className="buton">+ Adaugă anunț</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          <div className="container muted">© 2026 Imobiliare România · date demonstrative</div>
        </footer>
      </body>
    </html>
  );
}
