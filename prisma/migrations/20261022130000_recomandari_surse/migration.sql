-- AlterTable
ALTER TABLE "Utilizator" ADD COLUMN     "luniBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recomandatDeId" TEXT,
ADD COLUMN     "sursa" TEXT,
ADD COLUMN     "zilePromovare" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Vizita" (
    "id" SERIAL NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sursa" TEXT NOT NULL,
    "mediu" TEXT,
    "campanie" TEXT,
    "pagina" TEXT,

    CONSTRAINT "Vizita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vizita_creatLa_sursa_idx" ON "Vizita"("creatLa", "sursa");

-- AddForeignKey
ALTER TABLE "Utilizator" ADD CONSTRAINT "Utilizator_recomandatDeId_fkey" FOREIGN KEY ("recomandatDeId") REFERENCES "Utilizator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

