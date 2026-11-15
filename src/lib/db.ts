import { Prisma, PrismaClient } from "@prisma/client";

// O singură instanță, refolosită între reîncărcările din dev.
//
// Neon (planul gratuit) oprește baza după 5 minute fără cereri și o pornește la prima cerere (de obicei sub o secundă,
// uneori câteva secunde). Prisma renunță implicit după 5 s („Can't reach database server”, P1001), iar pagina dă eroare.
// De aceea: 15 s pentru conectare și pentru așteptarea unei conexiuni libere, plus o singură reîncercare după 1,5 s
// doar la erorile de conexiune. Nu ținem baza trează artificial: ar consuma orele de calcul gratuite (100 CU-ore/lună).

/** DATABASE_URL cu connect_timeout=15 și pool_timeout=15 adăugate, dacă lipsesc (valorile puse de Rudy rămân). */
export function urlCuTimeout(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    for (const k of ["connect_timeout", "pool_timeout"]) if (!u.searchParams.has(k)) u.searchParams.set(k, "15");
    return u.toString();
  } catch {
    return url;
  }
}

// P1001: serverul nu răspunde; P1002: răspunde, dar conectarea expiră. În ambele cazuri cererea nu a ajuns la bază.
const NECONECTAT = new Set(["P1001", "P1002"]);
// P1017: serverul a închis conexiunea. O scriere poate să fi ajuns totuși la bază, deci o reluăm doar pe citiri.
const INCHIS = "P1017";
const CITIRI = new Set([
  "findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy",
  "$queryRaw", "$queryRawUnsafe",
]);

/** true dacă eroarea e una de conexiune, iar operația se poate relua fără risc. */
export function deReincercat(e: unknown, operatie: string): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (NECONECTAT.has(e.code)) return true;
    if (e.code === INCHIS) return CITIRI.has(operatie);
  }
  return false;
}

export const PAUZA_REINCERCARE = 1500;

/** Rulează `fn`; la o eroare de conexiune mai încearcă o dată, după `pauza` ms. */
export async function cuReincercare<T>(fn: () => Promise<T>, operatie: string, pauza = PAUZA_REINCERCARE): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!deReincercat(e, operatie)) throw e;
    console.error(`[baza] ${operatie}: ${e instanceof Error ? e.message.split("\n").filter(Boolean).pop() : e} – reîncerc peste ${pauza} ms`);
    await new Promise((r) => setTimeout(r, pauza));
    return fn();
  }
}

function creeaza(): PrismaClient {
  const baza = new PrismaClient({ datasourceUrl: urlCuTimeout(process.env.DATABASE_URL) });
  // Extensia nu schimbă metodele clientului, doar le învelește; tipul rămâne cel al lui PrismaClient.
  return baza.$extends({
    query: { $allOperations: ({ operation, args, query }) => cuReincercare(() => query(args), operation) },
  }) as unknown as PrismaClient;
}

const global = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient = global.prisma ?? creeaza();

if (process.env.NODE_ENV !== "production") global.prisma = db;
