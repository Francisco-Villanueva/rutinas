import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Runtime de la app: conexión POOLED de Neon (el host con -pooler).
// La conexión directa (DIRECT_URL) es solo para la CLI de Prisma; ver prisma.config.ts.
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// En dev, Next reejecuta los módulos en cada HMR: sin esto se abrirían
// conexiones nuevas hasta agotar el pool.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
