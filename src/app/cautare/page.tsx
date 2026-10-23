import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filtre } from "@/components/Filtre";
import { LinkHarta } from "@/components/harta/LinkHarta";
import { SalveazaCautarea } from "@/components/SalveazaCautarea";
import { curataFiltre } from "@/lib/cautari";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi, type Filtre as F } from "@/lib/anunturi";

export const metadata: Metadata = { title: "Căutare anunțuri" };

export default async function CautarePage({ searchParams }: { searchParams: Promise<F> }) {
  const sp = await searchParams;
  const { anunturi, total } = await cautaAnunturi(sp);
  return (
    <>
      <Breadcrumbs items={[{ label: "Căutare" }]} />
      <div className="titlu-cu-actiune">
        <h1>Caută anunțuri în toată țara</h1>
        <LinkHarta filtre={sp} />
      </div>
      <Filtre valori={sp} action="/cautare" cuJudet />
      <SalveazaCautarea filtre={curataFiltre(sp)} />
      <ListaAnunturi anunturi={anunturi} total={total} />
    </>
  );
}
