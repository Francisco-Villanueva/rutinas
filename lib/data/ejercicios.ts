import "server-only";

import { prisma } from "@/lib/db";
import { requireProfesor } from "@/lib/auth/guards";
import type { EjercicioBiblioteca } from "@/lib/data/tipos";

/**
 * Biblioteca de ejercicios: los del gimnasio del profesor más los públicos.
 * Esta pantalla sí sale entera de la base — el seed carga el catálogo completo.
 */
export async function getEjercicios(): Promise<{
  ejercicios: EjercicioBiblioteca[];
  grupos: string[];
}> {
  const profesor = await requireProfesor();

  const filas = await prisma.ejercicio.findMany({
    where: {
      activo: true,
      OR: [{ gimnasioId: profesor.gimnasioId }, { esPublico: true }],
    },
    orderBy: [{ grupoMuscular: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      grupoMuscular: true,
      grupoMuscularSecundario: true,
      equipamiento: true,
      _count: { select: { rutinaEjercicios: true, media: true } },
    },
  });

  const ejercicios = filas.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    grupo: e.grupoMuscular,
    equipamiento: e.equipamiento,
    patron: e.grupoMuscularSecundario,
    usos: e._count.rutinaEjercicios,
    tieneVideo: e._count.media > 0,
  }));

  const grupos = [...new Set(ejercicios.map((e) => e.grupo))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );

  return { ejercicios, grupos };
}
