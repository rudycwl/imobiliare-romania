-- Anunțurile importate din link de pe site-ul agenției se actualizează singure (la 3 ore, odată cu feed-urile).
-- Doar coloane noi, cu valori implicite sau null: rândurile existente nu se schimbă (sursaLink null = fără actualizare).
-- AlterTable
ALTER TABLE "Anunt" ADD COLUMN     "sursaActiva" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sursaDisparut" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sursaLink" TEXT,
ADD COLUMN     "sursaPoze" TEXT,
ADD COLUMN     "sursaStare" TEXT,
ADD COLUMN     "sursaVerificatLa" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Poza" ADD COLUMN     "sursaUrl" TEXT;

-- CreateIndex
CREATE INDEX "Anunt_sursaLink_idx" ON "Anunt"("sursaLink");
