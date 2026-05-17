import "server-only";

import { PrismaClient } from "@prisma/client";

const prismaGlobalName = "__coco_treats_prisma__";

type PrismaGlobal = typeof globalThis & {
  [prismaGlobalName]?: PrismaClient;
};

const globalForPrisma = globalThis as PrismaGlobal;

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Server-only PostgreSQL client. Do not import from client components. */
export const prisma: PrismaClient = globalForPrisma[prismaGlobalName] ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma[prismaGlobalName] = prisma;
}
