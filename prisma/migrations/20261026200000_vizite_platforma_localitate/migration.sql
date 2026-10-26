-- Vizite: platforma (din User-Agent) și localitatea aproximativă (din IP, care nu se salvează).
ALTER TABLE "Vizita" ADD COLUMN "dispozitiv" TEXT,
ADD COLUMN "sistem" TEXT,
ADD COLUMN "browser" TEXT,
ADD COLUMN "oras" TEXT,
ADD COLUMN "regiune" TEXT,
ADD COLUMN "tara" TEXT;
