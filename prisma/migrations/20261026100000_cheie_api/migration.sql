-- Cheia API cu care agențiile își trimit anunțurile direct din programul lor.
ALTER TABLE "Utilizator" ADD COLUMN "apiCheieHash" TEXT;
CREATE UNIQUE INDEX "Utilizator_apiCheieHash_key" ON "Utilizator"("apiCheieHash");
