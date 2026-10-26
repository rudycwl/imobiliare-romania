import Link from "next/link";
import { utilizatorCurent } from "@/lib/auth";
import { esteAdmin } from "@/lib/fondatori";
import { SECTIUNI } from "./sectiuni";

/** Meniul panoului de control, pe toate paginile /admin. Îl vede doar un administrator (ADMIN_EMAILS). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await utilizatorCurent();
  return (
    <>
      {esteAdmin(u?.email) && (
        <nav className="panou-meniu" aria-label="Panou de control">
          <Link href="/admin"><strong>Panou de control</strong></Link>
          {SECTIUNI.map((s) => (
            <Link key={s.href} href={s.href}>{s.titlu}</Link>
          ))}
        </nav>
      )}
      {children}
    </>
  );
}
