import { defineConfig, env } from "prisma/config";

// Prisma 7 ya no carga archivos .env automáticamente, y nunca leyó .env.local.
// Node 22 trae loadEnvFile nativo, así que no hace falta dotenv.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // el archivo no existe: seguimos con las variables ya presentes en el entorno
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",

  // La CLI (db pull, migrate, seed) usa la conexión DIRECTA, no la pooled.
  // El runtime de la app usa DATABASE_URL (pooled) vía el adapter en lib/db.ts.
  datasource: {
    url: env("DIRECT_URL"),
  },

  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
