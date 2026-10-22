import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filtre } from "@/components/Filtre";
import { ListaAnunturi } from "@/components/AnuntCard";
import { cautaAnunturi, type Filtre as F } from "@/lib/anunturi";

export const metadata: Metadata = { title: "Căutare anunțuri" };

export default async function CautarePage({ searchParams }: { searchParams: Promise<F> }) {
  const sp = await searchParams;
  const { anunturi, total } = await cautaAnunturi(sp);
  return (
    <>
      <Breadcrumbs items={[{ label: "Căutare" }]} />
      <h1>Caută anunțuri în toată țara</h1>
      <Filtre valori={sp} action="/cautare" cuJudet />
      <ListaAnunturi anunturi={anunturi} total={total} />
    </>
  );
}
