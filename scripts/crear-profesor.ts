// Bootstrap del primer profesor.
//
// Al primer profesor no lo invita nadie: se crea la cuenta a mano en el
// dashboard de Clerk y después se corre esto para darle la fila en `usuarios`.
// De ahí en adelante, cada alumno lo da de alta su profesor desde la app.
//
//   npx tsx scripts/crear-profesor.ts \
//     --email profe@gimnasio.com \
//     --clerk-id user_2abc... \
//     --nombre Franco --apellido Villanueva
//
// O por posición (email, clerk-id, nombre, apellido):
//
//   npx tsx scripts/crear-profesor.ts profe@gimnasio.com user_2abc... Franco
//
// Los posicionales existen porque `npm run ... -- --email x` no es confiable:
// npm se queda con los `--flag` como config propia (avisa "Unknown cli config")
// y al script le llegan solo los valores sueltos. Por eso conviene invocarlo
// con npx directo, sin npm en el medio.
//
// Es idempotente: si ya existe la fila para ese clerk-id, la actualiza.

import { parseArgs } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

// Corre suelto con tsx, así que carga el .env por su cuenta (igual que seed.ts).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // el archivo no existe: seguimos con las variables ya presentes en el entorno
  }
}

// Mismo UUID fijo que prisma/seed.ts. Mientras haya un solo gimnasio
// hardcodeado, el profesor cuelga de este.
const GIMNASIO_ID = "00000000-0000-4000-8000-000000000001";

function abortar(mensaje: string): never {
  console.error(`\n  ${mensaje}\n`);
  console.error(
    "  Uso: npx tsx scripts/crear-profesor.ts --email <mail> --clerk-id <user_...> [--nombre <n>] [--apellido <a>]",
  );
  console.error(
    "    o: npx tsx scripts/crear-profesor.ts <mail> <user_...> [nombre] [apellido]\n",
  );
  process.exit(1);
}

// Devuelve todo ya validado y no-opcional: el narrowing de los `if` de abajo no
// sobrevive hasta main(), que está hoisteada.
function leerArgs() {
  const { values, positionals } = parseArgs({
    options: {
      email: { type: "string" },
      "clerk-id": { type: "string" },
      nombre: { type: "string" },
      apellido: { type: "string" },
    },
    // Ver el comentario de arriba: npm come los --flag y deja los valores
    // sueltos, así que aceptamos ambas formas.
    allowPositionals: true,
  });

  const [posEmail, posClerkId, posNombre, posApellido] = positionals;

  const email = (values.email ?? posEmail)?.trim().toLowerCase();
  const clerkUserId = (values["clerk-id"] ?? posClerkId)?.trim();

  if (!email) abortar("Falta el email.");
  if (!clerkUserId) abortar("Falta el clerk_user_id.");
  if (!email.includes("@")) abortar(`"${email}" no parece un email.`);
  if (!clerkUserId.startsWith("user_")) {
    abortar(
      `"${clerkUserId}" no parece un clerk_user_id: tienen que empezar con "user_".\n` +
        "  Lo sacás del dashboard de Clerk, en Users -> (el usuario) -> User ID.",
    );
  }

  return {
    email,
    clerkUserId,
    // Si no pasan nombre, usamos la parte local del mail: `nombre` es NOT NULL.
    nombre: (values.nombre ?? posNombre)?.trim() || email.split("@")[0],
    apellido: (values.apellido ?? posApellido)?.trim() || null,
  };
}

const { email, clerkUserId, nombre, apellido } = leerArgs();

// DIRECT_URL: esto es CLI, no runtime serverless. No necesita el pooler.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

async function main() {
  const gimnasio = await prisma.gimnasio.findUnique({
    where: { id: GIMNASIO_ID },
    select: { id: true, nombre: true },
  });

  if (!gimnasio) {
    abortar(
      "No existe el gimnasio del seed. Corré primero `npm run db:seed`.",
    );
  }

  // Chequeo explícito antes del upsert: `email` también es UNIQUE, así que si
  // el mail ya está tomado por OTRO clerk_user_id el upsert falla con un
  // P2002 opaco. Mejor decir qué pasó.
  const porEmail = await prisma.usuario.findUnique({
    where: { email },
    select: { clerkUserId: true, rol: true },
  });

  if (porEmail && porEmail.clerkUserId !== clerkUserId) {
    abortar(
      `El email ${email} ya está usado por otro usuario (clerk_user_id ${porEmail.clerkUserId}, rol ${porEmail.rol}).`,
    );
  }

  const profesor = await prisma.usuario.upsert({
    where: { clerkUserId },
    update: {
      email,
      nombre,
      apellido,
      rol: "profesor",
      gimnasioId: gimnasio.id,
      activo: true,
    },
    create: {
      clerkUserId,
      email,
      nombre,
      apellido,
      rol: "profesor",
      gimnasioId: gimnasio.id,
    },
  });

  console.log(`\n  Profesor listo en "${gimnasio.nombre}":`);
  console.log(`    id            ${profesor.id}`);
  console.log(`    email         ${profesor.email}`);
  console.log(`    nombre        ${profesor.nombre}${apellido ? ` ${apellido}` : ""}`);
  console.log(`    clerk_user_id ${profesor.clerkUserId}`);
  console.log(`\n  Ya podés entrar con ese usuario: te va a mandar a /dashboard.\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
