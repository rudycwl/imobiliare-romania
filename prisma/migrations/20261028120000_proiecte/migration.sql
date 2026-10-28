-- Paginile de proiect pentru dezvoltatori imobiliari (/proiecte), administrate din /admin/proiecte.
CREATE TABLE "Proiect" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "dezvoltator" TEXT NOT NULL,
    "descriere" TEXT NOT NULL,
    "judet" TEXT NOT NULL,
    "oras" TEXT NOT NULL,
    "zona" TEXT,
    "adresa" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "website" TEXT,
    "telefon" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "poze" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unitati" JSONB NOT NULL DEFAULT '[]',
    "termenFinalizare" TEXT,
    "activ" BOOLEAN NOT NULL DEFAULT true,
    "gratuitPanaLa" TIMESTAMP(3) NOT NULL DEFAULT (now() + '3 months'::interval),
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proiect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Proiect_slug_key" ON "Proiect"("slug");
CREATE INDEX "Proiect_activ_judet_idx" ON "Proiect"("activ", "judet");
