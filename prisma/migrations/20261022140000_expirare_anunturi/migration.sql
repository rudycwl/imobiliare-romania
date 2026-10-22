-- Anunțurile sunt valabile 60 de zile; cele existente primesc 60 de zile de acum.
ALTER TABLE "Anunt" ADD COLUMN "expiraLa" TIMESTAMP(3) NOT NULL DEFAULT (now() + '60 days'::interval);

DROP INDEX "Anunt_proprietarId_idx";
CREATE INDEX "Anunt_proprietarId_expiraLa_idx" ON "Anunt"("proprietarId", "expiraLa");
