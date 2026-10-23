import Link from "next/link";
import type { Metadata } from "next";
import { FormularParolaNoua } from "../parola-uitata/Formular";

export const metadata: Metadata = { title: "Parolă nouă", robots: { index: false }, referrer: "no-referrer" };

export default async function ParolaNouaPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <div className="ingust">
      <h1>Alege parola nouă</h1>
      {t ? (
        <FormularParolaNoua token={t} />
      ) : (
        <p className="eroare">
          Linkul nu e complet. Deschide-l direct din email sau <Link href="/cont/parola-uitata">cere unul nou</Link>.
        </p>
      )}
    </div>
  );
}
