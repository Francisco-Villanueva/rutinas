import "server-only";

import { prisma } from "@/lib/db";
import { requireProfesor } from "@/lib/auth/guards";
import { usarDemo } from "@/lib/data/alumnos";
import { RUTINA_DEMO } from "@/lib/mock/coach";
import type { EjercicioDeDia, RutinaBuilder } from "@/lib/data/tipos";

/** 150 -> "2:30". null cuando la rutina no fija descanso. */
function formatoDescanso(segundos: number | null) {
  if (segundos == null) return "—";
  const min = Math.floor(segundos / 60);
  return `${min}:${String(segundos % 60).padStart(2, "0")}`;
}

/** 8 y 12 -> "8-12"; solo mínimo -> "8"; ninguno -> "—". */
function formatoReps(min: number | null, max: number | null) {
  if (min != null && max != null && min !== max) return `${min}-${max}`;
  const uno = min ?? max;
  return uno != null ? String(uno) : "—";
}

/**
 * La rutina que se está editando en el constructor. Sin `rutinaId` toma la más
 * reciente del profesor.
 *
 * Nota: rutina_ejercicios no tiene columna de RPE (el RPE se registra al
 * entrenar, en sesiones_entrenamiento). La columna existe en el diseño, así que
 * se muestra vacía hasta que el modelo la tenga.
 */
export async function getRutinaBuilder(rutinaId?: string): Promise<RutinaBuilder | null> {
  const profesor = await requireProfesor();

  const [rutina, plantillas] = await Promise.all([
    prisma.rutina.findFirst({
      where: { profesorId: profesor.id, activo: true, ...(rutinaId ? { id: rutinaId } : {}) },
      orderBy: { actualizadoEn: "desc" },
      select: {
        id: true,
        nombre: true,
        objetivo: true,
        duracionSemanas: true,
        dias: {
          orderBy: { numeroDia: "asc" },
          select: {
            id: true,
            numeroDia: true,
            nombre: true,
            ejercicios: {
              orderBy: { orden: "asc" },
              select: {
                id: true,
                series: true,
                repeticionesMin: true,
                repeticionesMax: true,
                pesoSugerido: true,
                descansoSegundos: true,
                ejercicio: { select: { nombre: true } },
              },
            },
          },
        },
      },
    }),
    prisma.rutina.findMany({
      where: { profesorId: profesor.id, activo: true, esPlantilla: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  if (usarDemo(rutina != null)) return RUTINA_DEMO;
  if (!rutina) return null;

  return {
    id: rutina.id,
    nombre: rutina.nombre,
    objetivo: rutina.objetivo,
    semanas: rutina.duracionSemanas,
    dias: rutina.dias.map((d) => ({
      id: d.id,
      dia: `Día ${d.numeroDia}`,
      foco: d.nombre,
      ejercicios: d.ejercicios.map(
        (e): EjercicioDeDia => ({
          id: e.id,
          nombre: e.ejercicio.nombre,
          series: e.series,
          reps: formatoReps(e.repeticionesMin, e.repeticionesMax),
          peso: e.pesoSugerido ? `${e.pesoSugerido.toString()} kg` : "—",
          descanso: formatoDescanso(e.descansoSegundos),
          rpe: "—",
        }),
      ),
    })),
    plantillas,
    esDemo: false,
  };
}
