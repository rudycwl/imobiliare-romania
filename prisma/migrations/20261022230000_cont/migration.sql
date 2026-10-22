-- AlterTable
ALTER TABLE "Anunt" ADD COLUMN     "afisariTelefon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vizualizari" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Utilizator" ADD COLUMN     "stersLa" TIMESTAMP(3);

