import type { Judet } from "../types";

const judet: Judet = {
  slug: "cluj",
  cod: "CJ",
  nume: "Cluj",
  orase: [
    { slug: "cluj-napoca", nume: "Cluj-Napoca" },
    { slug: "turda", nume: "Turda" },
    { slug: "dej", nume: "Dej" },
    { slug: "campia-turzii", nume: "Câmpia Turzii" },
    { slug: "gherla", nume: "Gherla" },
    { slug: "floresti", nume: "Florești" },
    // Comunele din jurul Clujului, unde se construiește cel mai mult (zona metropolitană).
    { slug: "baciu", nume: "Baciu" },
    { slug: "apahida", nume: "Apahida" },
    { slug: "feleacu", nume: "Feleacu" },
    { slug: "gilau", nume: "Gilău" },
    { slug: "chinteni", nume: "Chinteni" },
    { slug: "jucu", nume: "Jucu" },
  ],
};

export default judet;
