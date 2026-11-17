-- De unde vine punctul pus automat pe hartă (adresa / zona / localitatea). Doar o coloană nouă, opțională:
-- rândurile existente rămân cu null și se recalculează o dată la pornire (src/lib/geocodare.ts → recompleteazaCoordonate).
-- AlterTable
ALTER TABLE "Anunt" ADD COLUMN     "sursaLoc" TEXT;
