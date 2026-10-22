-- CreateTable
CREATE TABLE "Favorit" (
    "utilizatorId" TEXT NOT NULL,
    "anuntId" INTEGER NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorit_pkey" PRIMARY KEY ("utilizatorId","anuntId")
);

-- CreateTable
CREATE TABLE "CautareSalvata" (
    "id" SERIAL NOT NULL,
    "utilizatorId" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "filtre" JSONB NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vazutLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CautareSalvata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CautareSalvata_utilizatorId_idx" ON "CautareSalvata"("utilizatorId");

-- AddForeignKey
ALTER TABLE "Favorit" ADD CONSTRAINT "Favorit_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorit" ADD CONSTRAINT "Favorit_anuntId_fkey" FOREIGN KEY ("anuntId") REFERENCES "Anunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CautareSalvata" ADD CONSTRAINT "CautareSalvata_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

