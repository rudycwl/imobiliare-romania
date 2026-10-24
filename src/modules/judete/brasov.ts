import type { Judet } from "../types";

const judet: Judet = {
  slug: "brasov",
  cod: "BV",
  nume: "Brașov",
  orase: [
    { slug: "brasov", nume: "Brașov" },
    { slug: "fagaras", nume: "Făgăraș" },
    { slug: "sacele", nume: "Săcele" },
    { slug: "codlea", nume: "Codlea" },
    { slug: "rasnov", nume: "Râșnov" },
    { slug: "zarnesti", nume: "Zărnești" },
    // Localitățile din jurul Brașovului, unde se construiește cel mai mult (zona metropolitană).
    { slug: "ghimbav", nume: "Ghimbav" },
    { slug: "predeal", nume: "Predeal" },
    { slug: "cristian", nume: "Cristian" },
    { slug: "sanpetru", nume: "Sânpetru" },
    { slug: "harman", nume: "Hărman" },
    { slug: "halchiu", nume: "Hălchiu" },
    { slug: "bod", nume: "Bod" },
    { slug: "tarlungeni", nume: "Tărlungeni" },
    { slug: "prejmer", nume: "Prejmer" },
  ],
};

export default judet;
