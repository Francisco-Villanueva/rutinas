import "server-only";

import { prisma } from "@/lib/db";
import { requireProfesor } from "@/lib/auth/guards";
import { iniciales, nombreCompleto } from "@/lib/utils";
import { ALUMNOS_DEMO, DETALLE_DEMO } from "@/lib/mock/coach";
import type { AlumnoDetalle, AlumnoPanel } from "@/lib/data/tipos";

// ============================================================================
// Lectura de alumnos del profesor.
//
// De la base salen: el vínculo profesor_alumno activo, el alumno y su asignación
// activa (rutina + semana del mesociclo).
//
// Pendiente de query: adherencia, racha, alertas, última sesión, 1RM, volumen e
// historial. Son agregaciones sobre sesiones_entrenamiento / registros_ejercicio
// / records_personales. Se devuelven en null y la UI las muestra como "—".
// ============================================================================

const MS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000;

/** Semana en curso del mesociclo, 1-indexada. */
function semanaEnCurso(fechaInicio: Date) {
  return Math.max(1, Math.floor((Date.now() - fechaInicio.getTime()) / MS_POR_SEMANA) + 1);
}

/**
 * El dataset del UI kit solo se sirve en dev y solo cuando no hay nada real que
 * mostrar (el seed no carga usuarios). En producción el estado vacío es el vacío.
 */
export function usarDemo(hayDatosReales: boolean) {
  return !hayDatosReales && process.env.NODE_ENV !== "production";
}

const SELECT_ASIGNACION_ACTIVA = {
  where: { estado: "activa" },
  orderBy: { fechaInicio: "desc" },
  take: 1,
  select: {
    fechaInicio: true,
    rutina: { select: { nombre: true, objetivo: true, duracionSemanas: true } },
  },
} as const;

type FilaAlumno = {
  id: string;
  nombre: string;
  apellido: string | null;
  activo: boolean;
  asignacionesComoAlumno: {
    fechaInicio: Date;
    rutina: { nombre: string; objetivo: string | null; duracionSemanas: number | null };
  }[];
};

function aAlumnoPanel(alumno: FilaAlumno): AlumnoPanel {
  const asignacion = alumno.asignacionesComoAlumno[0];

  return {
    id: alumno.id,
    nombre: nombreCompleto(alumno.nombre, alumno.apellido),
    iniciales: iniciales(alumno.nombre, alumno.apellido),
    objetivo: asignacion?.rutina.objetivo ?? null,
    estado: alumno.activo ? "activo" : "ausente",
    ultimaSesion: null,
    adherencia: null,
    racha: null,
    alerta: null,
    plan: asignacion?.rutina.nombre ?? null,
    semana: asignacion ? semanaEnCurso(asignacion.fechaInicio) : null,
    semanas: asignacion?.rutina.duracionSemanas ?? null,
  };
}

/** Los alumnos vinculados al profesor logueado, ordenados por nombre. */
export async function getAlumnos(): Promise<{ alumnos: AlumnoPanel[]; esDemo: boolean }> {
  const profesor = await requireProfesor();

  const vinculos = await prisma.profesorAlumno.findMany({
    where: { profesorId: profesor.id, activo: true },
    orderBy: { alumno: { nombre: "asc" } },
    select: {
      alumno: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          activo: true,
          asignacionesComoAlumno: SELECT_ASIGNACION_ACTIVA,
        },
      },
    },
  });

  if (usarDemo(vinculos.length > 0)) {
    return { alumnos: ALUMNOS_DEMO, esDemo: true };
  }

  return { alumnos: vinculos.map((v) => aAlumnoPanel(v.alumno)), esDemo: false };
}

/**
 * Detalle de un alumno. Devuelve null si el alumno no está vinculado a este
 * profesor: la página lo traduce a notFound() para no filtrar ni siquiera la
 * existencia del id.
 */
export async function getAlumnoDetalle(alumnoId: string): Promise<AlumnoDetalle | null> {
  const profesor = await requireProfesor();

  // Los ids "demo-*" no existen en la base: vienen del dataset del UI kit.
  if (alumnoId.startsWith("demo-")) {
    const alumno = ALUMNOS_DEMO.find((a) => a.id === alumnoId);
    if (!alumno || process.env.NODE_ENV === "production") return null;
    return { alumno, ...DETALLE_DEMO, esDemo: true };
  }

  const vinculo = await prisma.profesorAlumno.findFirst({
    where: { profesorId: profesor.id, alumnoId, activo: true },
    select: {
      alumno: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          activo: true,
          asignacionesComoAlumno: SELECT_ASIGNACION_ACTIVA,
        },
      },
    },
  });

  if (!vinculo) return null;

  return {
    alumno: aAlumnoPanel(vinculo.alumno),
    marcas: [],
    fuerza: null,
    volumenSemanal: [],
    historial: [],
    esDemo: false,
  };
}
