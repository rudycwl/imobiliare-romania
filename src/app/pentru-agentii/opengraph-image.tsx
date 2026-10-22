import { imagineOg, OG_SIZE } from "@/lib/og";

export const alt = "CheiaMea pentru agenții imobiliare";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return imagineOg({ eticheta: "Agenție Fondatoare", titlu: "6 luni gratuit pentru primele 100 de agenții", subtitlu: "Apoi 50% reducere permanent. Ofertă valabilă până la 31.12.2026." });
}
