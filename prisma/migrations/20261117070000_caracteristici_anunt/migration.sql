-- Caracteristici structurate și adresa anunțului (formularul de adăugare/editare).
-- Doar coloane noi, opționale sau cu valoare implicită: rândurile existente nu se schimbă
-- (null = necompletat; pagina folosește atunci textul descrierii). Se aplică la deploy cu `prisma migrate deploy`.
-- locatieExacta = false pentru toate: pe site apare zona aproximativă până când proprietarul bifează locația exactă.
-- AlterTable
ALTER TABLE "Anunt" ADD COLUMN     "aerConditionat" INTEGER,
ADD COLUMN     "anConstructie" INTEGER,
ADD COLUMN     "bai" INTEGER,
ADD COLUMN     "balcon" BOOLEAN,
ADD COLUMN     "balconInchis" BOOLEAN,
ADD COLUMN     "balconMp" INTEGER,
ADD COLUMN     "clasaEnergetica" TEXT,
ADD COLUMN     "compartimentare" TEXT,
ADD COLUMN     "dotari" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "etaj" INTEGER,
ADD COLUMN     "etajeTotal" INTEGER,
ADD COLUMN     "incalzire" TEXT,
ADD COLUMN     "locatieExacta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mobilare" TEXT,
ADD COLUMN     "numar" TEXT,
ADD COLUMN     "stare" TEXT,
ADD COLUMN     "strada" TEXT,
ADD COLUMN     "suprafataTotala" INTEGER;

