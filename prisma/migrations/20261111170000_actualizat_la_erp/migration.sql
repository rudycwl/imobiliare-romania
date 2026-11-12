-- Câmpul actualizatLa pe Comanda, Factura și Utilizator, ca ERP-ul Hugetech să vadă și modificările ulterioare
-- (storno, starea e-Factura, plăți respinse, email confirmat). Rândurile existente primesc data migrării,
-- deci prima sincronizare de după migrare le retrimite pe toate o dată (volum mic).
-- AlterTable
ALTER TABLE "Comanda" ADD COLUMN     "actualizatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "actualizatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Utilizator" ADD COLUMN     "actualizatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Comanda_actualizatLa_idx" ON "Comanda"("actualizatLa");

-- CreateIndex
CREATE INDEX "Factura_actualizatLa_idx" ON "Factura"("actualizatLa");
