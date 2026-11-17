-- Postările pe rețelele sociale ale CheiaMea (Instagram, Facebook …), cu e-mail către proprietarul anunțului.
-- Doar un tabel nou: nicio coloană existentă nu se schimbă, iar tabelul pornește gol (prima postare o înregistrează Rudy).
-- CreateTable
CREATE TABLE "PostareSociala" (
    "id" SERIAL NOT NULL,
    "anuntId" INTEGER NOT NULL,
    "retea" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailTrimisLa" TIMESTAMP(3),

    CONSTRAINT "PostareSociala_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostareSociala_anuntId_creatLa_idx" ON "PostareSociala"("anuntId", "creatLa");

-- CreateIndex
CREATE UNIQUE INDEX "PostareSociala_anuntId_url_key" ON "PostareSociala"("anuntId", "url");

-- AddForeignKey
ALTER TABLE "PostareSociala" ADD CONSTRAINT "PostareSociala_anuntId_fkey" FOREIGN KEY ("anuntId") REFERENCES "Anunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
