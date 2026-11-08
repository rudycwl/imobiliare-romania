-- Feed-urile XML ale agențiilor, codul anunțului din programul agenției, istoricul de preț, cheia pentru aceeași proprietate la mai multe agenții și indicele de preț pe lună.
-- AlterTable
ALTER TABLE "Anunt" ADD COLUMN     "cheieProprietate" TEXT,
ADD COLUMN     "externId" TEXT,
ADD COLUMN     "feedId" INTEGER;

-- CreateTable
CREATE TABLE "FeedAgentie" (
    "id" SERIAL NOT NULL,
    "utilizatorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "acordLa" TIMESTAMP(3) NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaRulare" TIMESTAMP(3),
    "ultimaStare" TEXT,
    "raport" JSONB,
    "eroriLaRand" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FeedAgentie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IstoricPret" (
    "id" SERIAL NOT NULL,
    "anuntId" INTEGER NOT NULL,
    "pret" INTEGER NOT NULL,
    "la" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IstoricPret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndiceLunar" (
    "luna" TEXT NOT NULL,
    "judet" TEXT NOT NULL,
    "oras" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "pretMp" INTEGER,
    "chirie" INTEGER,
    "pretMpCase" INTEGER,
    "anunturi" INTEGER NOT NULL,
    "actualizat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndiceLunar_pkey" PRIMARY KEY ("luna","judet","oras","zona")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedAgentie_utilizatorId_url_key" ON "FeedAgentie"("utilizatorId", "url");

-- CreateIndex
CREATE INDEX "IstoricPret_anuntId_la_idx" ON "IstoricPret"("anuntId", "la");

-- CreateIndex
CREATE INDEX "IndiceLunar_judet_oras_zona_idx" ON "IndiceLunar"("judet", "oras", "zona");

-- CreateIndex
CREATE INDEX "Anunt_cheieProprietate_idx" ON "Anunt"("cheieProprietate");

-- CreateIndex
CREATE UNIQUE INDEX "Anunt_proprietarId_externId_key" ON "Anunt"("proprietarId", "externId");

-- AddForeignKey
ALTER TABLE "Anunt" ADD CONSTRAINT "Anunt_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "FeedAgentie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedAgentie" ADD CONSTRAINT "FeedAgentie_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IstoricPret" ADD CONSTRAINT "IstoricPret_anuntId_fkey" FOREIGN KEY ("anuntId") REFERENCES "Anunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prețul de pornire pentru anunțurile existente, ca istoricul să aibă de unde compara.
INSERT INTO "IstoricPret" ("anuntId", "pret", "la") SELECT "id", "pret", "publicatLa" FROM "Anunt";
