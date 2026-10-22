-- AlterTable
ALTER TABLE "Utilizator" ADD COLUMN     "adresa" TEXT,
ADD COLUMN     "regCom" TEXT;

-- CreateTable
CREATE TABLE "Factura" (
    "id" SERIAL NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tip" TEXT NOT NULL DEFAULT 'factura',
    "stare" TEXT NOT NULL DEFAULT 'in-asteptare',
    "plataRef" TEXT,
    "utilizatorId" TEXT,
    "cumparator" JSONB NOT NULL,
    "produse" JSONB NOT NULL,
    "totalBani" INTEGER NOT NULL,
    "cotaTva" INTEGER NOT NULL DEFAULT 0,
    "seria" TEXT,
    "numar" TEXT,
    "emisaLa" TIMESTAMP(3),
    "linkPdf" TEXT,
    "eFactura" TEXT,
    "eroare" TEXT,
    "referintaId" INTEGER,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Factura_plataRef_key" ON "Factura"("plataRef");

-- CreateIndex
CREATE INDEX "Factura_creatLa_idx" ON "Factura"("creatLa");

-- CreateIndex
CREATE INDEX "Factura_stare_idx" ON "Factura"("stare");

-- CreateIndex
CREATE INDEX "Factura_utilizatorId_idx" ON "Factura"("utilizatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_seria_numar_key" ON "Factura"("seria", "numar");

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "Utilizator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_referintaId_fkey" FOREIGN KEY ("referintaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

