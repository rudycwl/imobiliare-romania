-- Comenzi plătite cu cardul prin NETOPIA.
CREATE TABLE "Comanda" (
    "id" TEXT NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilizatorId" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "produs" TEXT NOT NULL,
    "anuntId" INTEGER,
    "anual" BOOLEAN NOT NULL DEFAULT false,
    "descriere" TEXT NOT NULL,
    "sumaBani" INTEGER NOT NULL,
    "stare" TEXT NOT NULL DEFAULT 'noua',
    "ntpID" TEXT,
    "platitaLa" TIMESTAMP(3),
    "stareNetopia" INTEGER,

    CONSTRAINT "Comanda_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Comanda_utilizatorId_creatLa_idx" ON "Comanda"("utilizatorId", "creatLa");

ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
