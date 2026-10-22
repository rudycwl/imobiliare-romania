-- AlterTable
ALTER TABLE "Utilizator" ADD COLUMN     "fondator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gratuitPanaLa" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InvitatieAgentie" (
    "cod" TEXT NOT NULL,
    "nota" TEXT,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraLa" TIMESTAMP(3) NOT NULL,
    "folositaDe" TEXT,
    "folositaLa" TIMESTAMP(3),

    CONSTRAINT "InvitatieAgentie_pkey" PRIMARY KEY ("cod")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitatieAgentie_folositaDe_key" ON "InvitatieAgentie"("folositaDe");

-- CreateIndex
CREATE INDEX "InvitatieAgentie_expiraLa_idx" ON "InvitatieAgentie"("expiraLa");

-- AddForeignKey
ALTER TABLE "InvitatieAgentie" ADD CONSTRAINT "InvitatieAgentie_folositaDe_fkey" FOREIGN KEY ("folositaDe") REFERENCES "Utilizator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

