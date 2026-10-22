-- CreateTable
CREATE TABLE "CerereRetragere" (
    "id" TEXT NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nume" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "comanda" TEXT NOT NULL,
    "mesaj" TEXT,
    "rezolvat" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CerereRetragere_pkey" PRIMARY KEY ("id")
);

