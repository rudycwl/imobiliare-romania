-- Confirmarea adresei de email la înscriere.
ALTER TABLE "Utilizator" ADD COLUMN "emailConfirmatLa" TIMESTAMP(3);
ALTER TABLE "Utilizator" ADD COLUMN "confirmareHash" TEXT;
CREATE UNIQUE INDEX "Utilizator_confirmareHash_key" ON "Utilizator"("confirmareHash");
-- Conturile de dinainte nu primesc cererea: le considerăm confirmate.
UPDATE "Utilizator" SET "emailConfirmatLa" = "creatLa" WHERE "email" IS NOT NULL;
