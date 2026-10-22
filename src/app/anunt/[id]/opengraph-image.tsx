import { getAnunt } from "@/lib/anunturi";
import { formatPret, TIPURI } from "@/lib/etichete";
import { getJudet, getOras } from "@/lib/geo";
import { imagineOg, OG_SIZE } from "@/lib/og";

export const alt = "Anunț imobiliar pe CheiaMea";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const a = await getAnunt((await params).id);
  if (!a) return imagineOg({ titlu: "Anunț imobiliar pe CheiaMea" });
  const loc = [getOras(a.judet, a.oras)?.nume, getJudet(a.judet)?.nume].filter(Boolean).join(", ");
  return imagineOg({
    eticheta: formatPret(a),
    titlu: a.titlu.length > 90 ? a.titlu.slice(0, 87) + "…" : a.titlu,
    subtitlu: `${TIPURI[a.tip]} · ${a.suprafata} m²${a.camere ? ` · ${a.camere} camere` : ""} · ${loc}`,
  });
}
