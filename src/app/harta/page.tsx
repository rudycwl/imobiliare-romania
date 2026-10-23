import Link from "next/link";
import type { Metadata } from "next";
import { after } from "next/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filtre } from "@/components/Filtre";
import { CautareHarta } from "@/components/harta/CautareHarta";
import { puncteHarta, type Filtre as F } from "@/lib/anunturi";
import { completeazaCoordonate } from "@/lib/geocodare";
import { curataFiltre } from "@/lib/cautari";

export const metadata: Metadata = {
  title: "Caută pe hartă",
  description: "Apartamente, case și terenuri de vânzare și de închiriat, pe harta României. Mută harta și vezi anunțurile din zona care te interesează.",
};

export default async function HartaPage({ searchParams }: { searchParams: Promise<F> }) {
  const sp = await searchParams;
  const { puncte, total } = await puncteHarta(sp);
  // Anunțurile noi, fără loc pe hartă, se pun în fundal după cartier (OpenStreetMap).
  after(() => completeazaCoordonate());
  const lista = new URLSearchParams(curataFiltre(sp) as Record<string, string>).toString();
  return (
    <>
      <Breadcrumbs items={[{ href: "/cautare", label: "Căutare" }, { label: "Pe hartă" }]} />
      <div className="titlu-cu-actiune">
        <h1>Caută pe hartă</h1>
        <Link href={`/cautare${lista ? `?${lista}` : ""}`} className="buton secundar">Vezi ca listă</Link>
      </div>
      <Filtre valori={sp} action="/harta" cuJudet />
      {total > puncte.length && (
        <p className="muted small">
          {total - puncte.length === 1
            ? "Un anunț nu are încă locul pe hartă și apare doar în listă."
            : `${total - puncte.length} anunțuri nu au încă locul pe hartă și apar doar în listă.`}
        </p>
      )}
      <CautareHarta puncte={puncte} />
    </>
  );
}
