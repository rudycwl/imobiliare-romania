-- Fotografiile anunțurilor (stocate în Cloudflare R2).
CREATE TABLE "Poza" (
    "id" SERIAL NOT NULL,
    "anuntId" INTEGER NOT NULL,
    "cheie" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poza_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Poza_cheie_key" ON "Poza"("cheie");
CREATE INDEX "Poza_anuntId_ordine_idx" ON "Poza"("anuntId", "ordine");

ALTER TABLE "Poza" ADD CONSTRAINT "Poza_anuntId_fkey" FOREIGN KEY ("anuntId") REFERENCES "Anunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
