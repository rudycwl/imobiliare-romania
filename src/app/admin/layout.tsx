import Link from "next/link";
import { adminPanou } from "@/lib/panou";
import { SECTIUNI } from "./sectiuni";

/** Meniul panoului de control, pe toate paginile /admin. Îl vede doar un administrator (ADMIN_EMAILS) cu panoul deschis. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await adminPanou();
  return (
    <>
      {u && (
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
