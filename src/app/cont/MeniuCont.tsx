"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { deconectare } from "./actiuni";

/** Meniul „Contul meu”: în stânga pe calculator, bandă sus pe telefon. */
export function MeniuCont({ agentie, admin }: { agentie: boolean; admin: boolean }) {
  const cale = usePathname();
  const legaturi = [
    { href: "/cont", text: "Anunțurile mele" },
    { href: "/cont/favorite", text: "♥ Favorite" },
    { href: "/cont/cautari", text: "🔔 Căutări salvate" },
    { href: "/cont/plati", text: "Plăți și facturi" },
    ...(agentie ? [{ href: "/cont/import", text: "Import anunțuri" }, { href: "/cont/abonament", text: "Abonament" }] : []),
    { href: "/cont/recomanda", text: "Recomandă CheiaMea" },
    { href: "/cont/setari", text: "Setări cont" },
    ...(admin ? [{ href: "/admin/moderare", text: "Moderare anunțuri" }] : []),
  ];
  return (
    <nav className="meniu-cont" aria-label="Contul meu">
      <Link href="/cont/anunt-nou" className="buton">+ Adaugă anunț</Link>
      {legaturi.map((l) => (
        <Link key={l.href} href={l.href} aria-current={cale === l.href ? "page" : undefined}>{l.text}</Link>
      ))}
      <form action={deconectare}>
        <button type="submit" className="link">Ieși din cont</button>
      </form>
    </nav>
  );
}
