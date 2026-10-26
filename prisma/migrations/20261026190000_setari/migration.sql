-- Textele editabile din panoul de control (/admin/texte).
CREATE TABLE "Setare" (
    "cheie" TEXT NOT NULL,
    "valoare" TEXT NOT NULL,
    "actualizatLa" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setare_pkey" PRIMARY KEY ("cheie")
);
