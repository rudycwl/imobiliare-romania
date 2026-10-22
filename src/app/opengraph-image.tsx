import { imagineOg, OG_SIZE } from "@/lib/og";

export const alt = "CheiaMea – anunțuri imobiliare din toată țara";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return imagineOg({ titlu: "Găsește-ți casa oriunde în România", subtitlu: "Apartamente, case și terenuri în toate cele 41 de județe și București" });
}
