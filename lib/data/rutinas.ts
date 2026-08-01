import "server-only";

import { prisma } from "@/lib/db";
import { requireProfesor } from "@/lib/auth/guards";
import { usarDemo } from "@/lib/data/alumnos";
import { RUTINA_DEMO } from "@/lib/mock/coach";
import type {
  EjercicioDeDia,
  PantallaRutinas,
  RutinaBuilder,
} from "@/lib/data/tipos";

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

const SELECT_RUTINA = {
  id: true,
  nombre: true,
  objetivo: true,
  descripcion: true,
  duracionSemanas: true,
  diasPorSemana: true,
  esPlantilla: true,
  dias: {
    orderBy: { numeroDia: "asc" },
    select: {
      id: true,
      numeroDia: true,
      nombre: true,
      notas: true,
      ejercicios: {
        orderBy: { orden: "asc" },
        select: {
          id: true,
          ejercicioId: true,
          series: true,
          repeticionesMin: true,
          repeticionesMax: true,
          pesoSugerido: true,
          descansoSegundos: true,
          notas: true,
          ejercicio: { select: { nombre: true } },
        },
      },
    },
  },
} as const;

/**
 * Todo lo que necesita el constructor: la rutina abierta, la lista para el
 * selector y la biblioteca de ejercicios para el alta de filas.
 *
 * Sin `rutinaId` abre la última rutina tocada. El id llega de la query string,
 * así que puede ser cualquier cosa: la query filtra por profesor y, si no hay
 * match, cae en la más reciente en vez de romper.
 *
 * Nota: `rutina_ejercicios` no tiene columna de RPE (el RPE se registra al
 * entrenar, en `sesiones_entrenamiento`). La columna existe en el diseño de la
 * tabla, así que se muestra vacía.
 */
export async function getPantallaRutinas(rutinaId?: string): Promise<PantallaRutinas> {
  const profesor = await requireProfesor();

  const deEsteProfesor = { profesorId: profesor.id, activo: true };

  const [rutinaPedida, rutinas, ejercicios] = await Promise.all([
    rutinaId
      ? prisma.rutina.findFirst({
          where: { ...deEsteProfesor, id: rutinaId },
          select: SELECT_RUTINA,
        })
      : null,
    prisma.rutina.findMany({
      where: deEsteProfesor,
      orderBy: { actualizadoEn: "desc" },
      select: {
        id: true,
        nombre: true,
        esPlantilla: true,
        _count: { select: { dias: true } },
      },
    }),
    prisma.ejercicio.findMany({
      where: {
        activo: true,
        OR: [{ gimnasioId: profesor.gimnasioId }, { esPublico: true }],
      },
      orderBy: [{ grupoMuscular: "asc" }, { nombre: "asc" }],
      select: { id: true, nombre: true, grupoMuscular: true },
    }),
  ]);

  const rutina =
    rutinaPedida ??
    (await prisma.rutina.findFirst({
      where: deEsteProfesor,
      orderBy: { actualizadoEn: "desc" },
      select: SELECT_RUTINA,
    }));

  return {
    rutina: rutina
      ? aRutinaBuilder(
          rutina,
          rutinas.filter((r) => r.esPlantilla && r.id !== rutina.id),
        )
      : // El dataset del UI kit solo aparece con la base vacía y en dev; el
        // constructor lo muestra en modo lectura (ver rutina-builder.tsx).
        (usarDemo(rutinas.length > 0) ? RUTINA_DEMO : null),
    rutinas: rutinas.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      esPlantilla: r.esPlantilla,
      dias: r._count.dias,
    })),
    ejercicios: ejercicios.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      grupo: e.grupoMuscular,
    })),
  };
}

type FilaRutina = {
  id: string;
  nombre: string;
  objetivo: string | null;
  descripcion: string | null;
  duracionSemanas: number | null;
  diasPorSemana: number | null;
  esPlantilla: boolean;
  dias: {
    id: string;
    numeroDia: number;
    nombre: string;
    notas: string | null;
    ejercicios: {
      id: string;
      ejercicioId: string;
      series: number;
      repeticionesMin: number | null;
      repeticionesMax: number | null;
      pesoSugerido: unknown;
      descansoSegundos: number | null;
      notas: string | null;
      ejercicio: { nombre: string };
    }[];
  }[];
};

function aRutinaBuilder(
  rutina: FilaRutina,
  plantillas: { id: string; nombre: string }[],
): RutinaBuilder {
  return {
    id: rutina.id,
    nombre: rutina.nombre,
    objetivo: rutina.objetivo,
    descripcion: rutina.descripcion,
    semanas: rutina.duracionSemanas,
    diasPorSemana: rutina.diasPorSemana,
    esPlantilla: rutina.esPlantilla,
    dias: rutina.dias.map((d) => ({
      id: d.id,
      numeroDia: d.numeroDia,
      dia: `Día ${d.numeroDia}`,
      foco: d.nombre,
      notas: d.notas,
      ejercicios: d.ejercicios.map((e): EjercicioDeDia => {
        // Decimal de Prisma: no cruza el límite servidor -> cliente como objeto,
        // hay que pasarlo a number acá.
        const peso = e.pesoSugerido == null ? null : Number(e.pesoSugerido);

        return {
          id: e.id,
          ejercicioId: e.ejercicioId,
          nombre: e.ejercicio.nombre,
          series: e.series,
          repeticionesMin: e.repeticionesMin,
          repeticionesMax: e.repeticionesMax,
          pesoSugerido: peso,
          descansoSegundos: e.descansoSegundos,
          notas: e.notas,
          reps: formatoReps(e.repeticionesMin, e.repeticionesMax),
          peso: peso == null ? "—" : `${peso} kg`,
          descanso: formatoDescanso(e.descansoSegundos),
          rpe: "—",
        };
      }),
    })),
    plantillas,
    esDemo: false,
  };
}
