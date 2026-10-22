export type Oras = {
  slug: string;
  nume: string;
};

export type Judet = {
  slug: string;
  /** Indicativul auto al județului (ex. CJ, B). */
  cod: string;
  nume: string;
  orase: Oras[];
};

export type TipProprietate = "apartament" | "casa" | "teren" | "spatiu-comercial";
export type Tranzactie = "vanzare" | "inchiriere";

export type Anunt = {
  id: string;
  titlu: string;
  descriere: string;
  tip: TipProprietate;
  tranzactie: Tranzactie;
  /** Prețul în euro (pentru închiriere: pe lună). */
  pret: number;
  suprafata: number;
  camere: number | null;
  judet: string;
  oras: string;
  zona: string;
  dataPublicarii: string;
  imagine: string;
  proprietarId: string;
};

/**
 * Tipuri de cont:
 * - persoana-fizica: proprietar care își publică singur anunțurile
 * - firma: persoană juridică ce nu e agenție (dezvoltator, firmă cu imobile proprii)
 * - agentie: firmă de imobiliare, cu profil public și agenți
 */
export type TipUtilizator = "persoana-fizica" | "firma" | "agentie";

export type Utilizator = {
  id: string;
  slug: string;
  nume: string;
  tip: TipUtilizator;
  telefon: string;
  judet: string;
  oras: string;
  /** Doar pentru firme și agenții. */
  cui?: string;
  culoare: string;
};
