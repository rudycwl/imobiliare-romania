import type { Judet } from "../types";

const judet: Judet = {
  slug: "timis",
  cod: "TM",
  nume: "Timiș",
  orase: [
    { slug: "timisoara", nume: "Timișoara" },
    { slug: "lugoj", nume: "Lugoj" },
    { slug: "sannicolau-mare", nume: "Sânnicolau Mare" },
    { slug: "jimbolia", nume: "Jimbolia" },
    { slug: "dumbravita", nume: "Dumbrăvița" },
    { slug: "giroc", nume: "Giroc" },
    // Comunele din jurul Timișoarei, unde se construiește cel mai mult (zona metropolitană).
    { slug: "mosnita-noua", nume: "Moșnița Nouă" },
    { slug: "ghiroda", nume: "Ghiroda" },
    { slug: "sanmihaiu-roman", nume: "Sânmihaiu Român" },
    { slug: "sacalaz", nume: "Săcălaz" },
    { slug: "remetea-mare", nume: "Remetea Mare" },
    { slug: "dudestii-noi", nume: "Dudeștii Noi" },
    { slug: "sag", nume: "Șag" },
    { slug: "recas", nume: "Recaș" },
    { slug: "becicherecu-mic", nume: "Becicherecu Mic" },
  ],
};

export default judet;
