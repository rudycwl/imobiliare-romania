-- CreateTable
CREATE TABLE "Utilizator" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "parolaHash" TEXT,
    "telefon" TEXT NOT NULL,
    "judet" TEXT NOT NULL,
    "oras" TEXT NOT NULL,
    "cui" TEXT,
    "culoare" TEXT NOT NULL DEFAULT '#0b6bcb',
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilizator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anunt" (
    "id" SERIAL NOT NULL,
    "titlu" TEXT NOT NULL,
    "descriere" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "tranzactie" TEXT NOT NULL,
    "pret" INTEGER NOT NULL,
    "suprafata" INTEGER NOT NULL,
    "camere" INTEGER,
    "judet" TEXT NOT NULL,
    "oras" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "imagine" TEXT NOT NULL,
    "publicatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proprietarId" TEXT NOT NULL,

    CONSTRAINT "Anunt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesiune" (
    "id" TEXT NOT NULL,
    "utilizatorId" TEXT NOT NULL,
    "expiraLa" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sesiune_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizator_slug_key" ON "Utilizator"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Utilizator_email_key" ON "Utilizator"("email");

-- CreateIndex
CREATE INDEX "Utilizator_tip_judet_idx" ON "Utilizator"("tip", "judet");

-- CreateIndex
CREATE INDEX "Anunt_judet_oras_publicatLa_idx" ON "Anunt"("judet", "oras", "publicatLa");

-- CreateIndex
CREATE INDEX "Anunt_tranzactie_tip_pret_idx" ON "Anunt"("tranzactie", "tip", "pret");

-- CreateIndex
CREATE INDEX "Anunt_proprietarId_idx" ON "Anunt"("proprietarId");

-- CreateIndex
CREATE INDEX "Sesiune_utilizatorId_idx" ON "Sesiune"("utilizatorId");

-- AddForeignKey
ALTER TABLE "Anunt" ADD CONSTRAINT "Anunt_proprietarId_fkey" FOREIGN KEY ("proprietarId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesiune" ADD CONSTRAINT "Sesiune_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
