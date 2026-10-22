import { PrismaClient } from "@prisma/client";

// O singură instanță, refolosită între reîncărcările din dev.
const global = globalThis as unknown as { prisma?: PrismaClient };

export const db = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = db;
