import type { Judet } from "../types";

const judet: Judet = {
  slug: "iasi",
  cod: "IS",
  nume: "Iași",
  orase: [
    { slug: "iasi", nume: "Iași" },
    { slug: "pascani", nume: "Pașcani" },
    { slug: "harlau", nume: "Hârlău" },
    { slug: "targu-frumos", nume: "Târgu Frumos" },
    { slug: "podu-iloaiei", nume: "Podu Iloaiei" },
    // Comunele din jurul Iașului, unde se construiește cel mai mult (zona metropolitană).
    { slug: "valea-lupului", nume: "Valea Lupului" },
    { slug: "miroslava", nume: "Miroslava" },
    { slug: "barnova", nume: "Bârnova" },
    { slug: "ciurea", nume: "Ciurea" },
    { slug: "tomesti", nume: "Tomești" },
    { slug: "holboca", nume: "Holboca" },
    { slug: "rediu", nume: "Rediu" },
    { slug: "letcani", nume: "Lețcani" },
    { slug: "aroneanu", nume: "Aroneanu" },
    { slug: "popricani", nume: "Popricani" },
    { slug: "ungheni", nume: "Ungheni" },
    { slug: "schitu-duca", nume: "Schitu Duca" },
  ],
};

export default judet;
