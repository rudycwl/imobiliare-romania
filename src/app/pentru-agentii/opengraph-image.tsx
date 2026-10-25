import { imagineOg, OG_SIZE } from "@/lib/og";

export const alt = "CheiaMea pentru agenții imobiliare";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return imagineOg({ eticheta: "Pentru agenții", titlu: "Zona CheiaMea pentru agenții imobiliare", subtitlu: "Cont de agenție, profil public și anunțuri în toată țara." });
}
