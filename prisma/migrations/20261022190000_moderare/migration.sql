-- AlterTable
ALTER TABLE "Anunt" ADD COLUMN "moderare" TEXT NOT NULL DEFAULT 'ok',
ADD COLUMN "motivModerare" TEXT;

-- CreateTable
CREATE TABLE "Raportare" (
    "id" SERIAL NOT NULL,
    "anuntId" INTEGER NOT NULL,
    "motiv" TEXT NOT NULL,
    "detalii" TEXT,
    "amprenta" TEXT NOT NULL,
    "rezolvat" BOOLEAN NOT NULL DEFAULT false,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Raportare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Anunt_moderare_idx" ON "Anunt"("moderare");

-- CreateIndex
CREATE INDEX "Raportare_rezolvat_idx" ON "Raportare"("rezolvat");

-- CreateIndex
CREATE UNIQUE INDEX "Raportare_anuntId_amprenta_key" ON "Raportare"("anuntId", "amprenta");

-- AddForeignKey
ALTER TABLE "Raportare" ADD CONSTRAINT "Raportare_anuntId_fkey" FOREIGN KEY ("anuntId") REFERENCES "Anunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
