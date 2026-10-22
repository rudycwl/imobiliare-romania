import { PrismaClient } from "@prisma/client";
import { anunturiDemo, utilizatoriDemo } from "./demo";

const db = new PrismaClient();

async function main() {
  // Re-rulabil: șterge doar conturile demo (anunțurile lor se șterg în cascadă).
  await db.utilizator.deleteMany({ where: { id: { startsWith: "demo-" } } });
  const u = await db.utilizator.createMany({ data: utilizatoriDemo() });
  const a = await db.anunt.createMany({ data: anunturiDemo() });
  console.log(`Seed: ${u.count} utilizatori, ${a.count} anunțuri demo.`);
}

main().finally(() => db.$disconnect());
