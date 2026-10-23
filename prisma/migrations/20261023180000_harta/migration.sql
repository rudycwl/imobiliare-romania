-- Căutare pe hartă: coordonatele anunțurilor.
ALTER TABLE "Anunt" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "Anunt" ADD COLUMN "lng" DOUBLE PRECISION;
ALTER TABLE "Anunt" ADD COLUMN "punctProprietar" BOOLEAN NOT NULL DEFAULT false;
