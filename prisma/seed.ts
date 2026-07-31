import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

// Cuando el seed corre por `prisma db seed`, prisma.config.ts ya cargó el .env.
// Si se ejecuta suelto (`npx tsx prisma/seed.ts`) hay que cargarlo acá.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // el archivo no existe: seguimos con las variables ya presentes en el entorno
  }
}

// UUID fijo: es lo que hace idempotente al upsert del gimnasio, que no tiene
// ninguna otra columna única sobre la cual hacer match.
const GIMNASIO_ID = "00000000-0000-4000-8000-000000000001";

type EjercicioSeed = {
  nombre: string;
  grupoMuscular: string;
  equipamiento: string;
};

const EJERCICIOS: EjercicioSeed[] = [
  // Pecho (10)
  { nombre: "Press de banca plano", grupoMuscular: "Pecho", equipamiento: "Barra" },
  { nombre: "Press de banca inclinado", grupoMuscular: "Pecho", equipamiento: "Barra" },
  { nombre: "Press de banca declinado", grupoMuscular: "Pecho", equipamiento: "Barra" },
  { nombre: "Press plano con mancuernas", grupoMuscular: "Pecho", equipamiento: "Mancuernas" },
  { nombre: "Press inclinado con mancuernas", grupoMuscular: "Pecho", equipamiento: "Mancuernas" },
  { nombre: "Aperturas con mancuernas", grupoMuscular: "Pecho", equipamiento: "Mancuernas" },
  { nombre: "Cruce de poleas", grupoMuscular: "Pecho", equipamiento: "Polea" },
  { nombre: "Flexiones de brazos", grupoMuscular: "Pecho", equipamiento: "Peso corporal" },
  { nombre: "Fondos en paralelas", grupoMuscular: "Pecho", equipamiento: "Peso corporal" },
  { nombre: "Press de pecho en máquina", grupoMuscular: "Pecho", equipamiento: "Máquina" },

  // Espalda (10)
  { nombre: "Dominadas", grupoMuscular: "Espalda", equipamiento: "Peso corporal" },
  { nombre: "Dominadas supinas", grupoMuscular: "Espalda", equipamiento: "Peso corporal" },
  { nombre: "Remo con barra", grupoMuscular: "Espalda", equipamiento: "Barra" },
  { nombre: "Remo con mancuerna a una mano", grupoMuscular: "Espalda", equipamiento: "Mancuernas" },
  { nombre: "Remo en polea baja", grupoMuscular: "Espalda", equipamiento: "Polea" },
  { nombre: "Jalón al pecho", grupoMuscular: "Espalda", equipamiento: "Polea" },
  { nombre: "Peso muerto convencional", grupoMuscular: "Espalda", equipamiento: "Barra" },
  { nombre: "Remo en máquina", grupoMuscular: "Espalda", equipamiento: "Máquina" },
  { nombre: "Pull-over con mancuerna", grupoMuscular: "Espalda", equipamiento: "Mancuernas" },
  { nombre: "Hiperextensiones lumbares", grupoMuscular: "Espalda", equipamiento: "Peso corporal" },

  // Hombros (8)
  { nombre: "Press militar con barra", grupoMuscular: "Hombros", equipamiento: "Barra" },
  { nombre: "Press de hombros con mancuernas", grupoMuscular: "Hombros", equipamiento: "Mancuernas" },
  { nombre: "Elevaciones laterales", grupoMuscular: "Hombros", equipamiento: "Mancuernas" },
  { nombre: "Elevaciones frontales", grupoMuscular: "Hombros", equipamiento: "Mancuernas" },
  { nombre: "Pájaros para deltoide posterior", grupoMuscular: "Hombros", equipamiento: "Mancuernas" },
  { nombre: "Remo al mentón", grupoMuscular: "Hombros", equipamiento: "Barra" },
  { nombre: "Press Arnold", grupoMuscular: "Hombros", equipamiento: "Mancuernas" },
  { nombre: "Face pull", grupoMuscular: "Hombros", equipamiento: "Polea" },

  // Bíceps (6)
  { nombre: "Curl con barra", grupoMuscular: "Bíceps", equipamiento: "Barra" },
  { nombre: "Curl con mancuernas", grupoMuscular: "Bíceps", equipamiento: "Mancuernas" },
  { nombre: "Curl martillo", grupoMuscular: "Bíceps", equipamiento: "Mancuernas" },
  { nombre: "Curl predicador", grupoMuscular: "Bíceps", equipamiento: "Barra" },
  { nombre: "Curl en polea", grupoMuscular: "Bíceps", equipamiento: "Polea" },
  { nombre: "Curl concentrado", grupoMuscular: "Bíceps", equipamiento: "Mancuernas" },

  // Tríceps (6)
  { nombre: "Extensión de tríceps en polea", grupoMuscular: "Tríceps", equipamiento: "Polea" },
  { nombre: "Press francés", grupoMuscular: "Tríceps", equipamiento: "Barra" },
  { nombre: "Extensión de tríceps sobre la cabeza", grupoMuscular: "Tríceps", equipamiento: "Mancuernas" },
  { nombre: "Fondos en banco", grupoMuscular: "Tríceps", equipamiento: "Peso corporal" },
  { nombre: "Patada de tríceps", grupoMuscular: "Tríceps", equipamiento: "Mancuernas" },
  { nombre: "Press cerrado", grupoMuscular: "Tríceps", equipamiento: "Barra" },

  // Piernas (12)
  { nombre: "Sentadilla libre", grupoMuscular: "Piernas", equipamiento: "Barra" },
  { nombre: "Sentadilla frontal", grupoMuscular: "Piernas", equipamiento: "Barra" },
  { nombre: "Prensa de piernas", grupoMuscular: "Piernas", equipamiento: "Máquina" },
  { nombre: "Zancadas", grupoMuscular: "Piernas", equipamiento: "Mancuernas" },
  { nombre: "Extensión de cuádriceps", grupoMuscular: "Piernas", equipamiento: "Máquina" },
  { nombre: "Curl femoral acostado", grupoMuscular: "Piernas", equipamiento: "Máquina" },
  { nombre: "Peso muerto rumano", grupoMuscular: "Piernas", equipamiento: "Barra" },
  { nombre: "Sentadilla búlgara", grupoMuscular: "Piernas", equipamiento: "Mancuernas" },
  { nombre: "Hack squat", grupoMuscular: "Piernas", equipamiento: "Máquina" },
  { nombre: "Sentadilla goblet", grupoMuscular: "Piernas", equipamiento: "Kettlebell" },
  { nombre: "Elevación de talones de pie", grupoMuscular: "Piernas", equipamiento: "Máquina" },
  { nombre: "Elevación de talones sentado", grupoMuscular: "Piernas", equipamiento: "Máquina" },

  // Glúteos (3)
  { nombre: "Hip thrust", grupoMuscular: "Glúteos", equipamiento: "Barra" },
  { nombre: "Patada de glúteo en polea", grupoMuscular: "Glúteos", equipamiento: "Polea" },
  { nombre: "Puente de glúteos", grupoMuscular: "Glúteos", equipamiento: "Peso corporal" },

  // Core (5)
  { nombre: "Plancha abdominal", grupoMuscular: "Core", equipamiento: "Peso corporal" },
  { nombre: "Crunch abdominal", grupoMuscular: "Core", equipamiento: "Peso corporal" },
  { nombre: "Elevación de piernas colgado", grupoMuscular: "Core", equipamiento: "Peso corporal" },
  { nombre: "Rueda abdominal", grupoMuscular: "Core", equipamiento: "Rueda abdominal" },
  { nombre: "Plancha lateral", grupoMuscular: "Core", equipamiento: "Peso corporal" },
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

async function main() {
  // El gimnasio va primero: ejercicios.gimnasio_id es FK contra gimnasios.id.
  const gimnasio = await prisma.gimnasio.upsert({
    where: { id: GIMNASIO_ID },
    update: { nombre: "Gimnasio Demo" },
    create: {
      id: GIMNASIO_ID,
      nombre: "Gimnasio Demo",
    },
  });

  console.log(`Gimnasio: ${gimnasio.nombre} (${gimnasio.id})`);

  for (const ejercicio of EJERCICIOS) {
    await prisma.ejercicio.upsert({
      // Unique compuesto uq_ejercicio_nombre_gimnasio (gimnasio_id, nombre).
      where: {
        gimnasioId_nombre: {
          gimnasioId: gimnasio.id,
          nombre: ejercicio.nombre,
        },
      },
      update: {
        grupoMuscular: ejercicio.grupoMuscular,
        equipamiento: ejercicio.equipamiento,
      },
      create: {
        gimnasioId: gimnasio.id,
        nombre: ejercicio.nombre,
        grupoMuscular: ejercicio.grupoMuscular,
        equipamiento: ejercicio.equipamiento,
        esPublico: true,
      },
    });
  }

  console.log(`Ejercicios sembrados: ${EJERCICIOS.length}`);
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
