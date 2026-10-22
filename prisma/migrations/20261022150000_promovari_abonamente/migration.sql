-- Promovări pe anunț și abonamente de agenție cu credite lunare.
ALTER TABLE "Anunt" ADD COLUMN "ordine" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "evidentiatPanaLa" TIMESTAMP(3),
ADD COLUMN "topPanaLa" TIMESTAMP(3),
ADD COLUMN "primaPaginaPanaLa" TIMESTAMP(3),
ADD COLUMN "reactualizariRamase" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "urmReactualizare" TIMESTAMP(3);

UPDATE "Anunt" SET "ordine" = "publicatLa";

CREATE INDEX "Anunt_judet_oras_ordine_idx" ON "Anunt"("judet", "oras", "ordine");

ALTER TABLE "Utilizator" ADD COLUMN "abonament" TEXT,
ADD COLUMN "abonamentPanaLa" TIMESTAMP(3),
ADD COLUMN "plataAnuala" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "creditReactualizari" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "creditTop" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "crediteReincarcareLa" TIMESTAMP(3);
