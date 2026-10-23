-- „Am uitat parola”: linkuri de resetare, valabile o oră, folosite o singură dată.
CREATE TABLE "ResetareParola" (
    "id" TEXT NOT NULL,
    "utilizatorId" TEXT NOT NULL,
    "expiraLa" TIMESTAMP(3) NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResetareParola_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ResetareParola_utilizatorId_idx" ON "ResetareParola"("utilizatorId");
ALTER TABLE "ResetareParola" ADD CONSTRAINT "ResetareParola_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Alerte pe email pentru căutările salvate.
ALTER TABLE "CautareSalvata" ADD COLUMN "alertaEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CautareSalvata" ADD COLUMN "alertaLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
