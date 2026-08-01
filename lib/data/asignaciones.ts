import "server-only";

import { prisma } from "@/lib/db";
import { requireProfesor } from "@/lib/auth/guards";
import { usarDemo } from "@/lib/data/alumnos";
import { iniciales, nombreCompleto } from "@/lib/utils";
import { ASIGNACIONES_DEMO } from "@/lib/mock/coach";
import type { PantallaAsignaciones } from "@/lib/data/tipos";

const MS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000;

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC", // fecha_inicio es DATE: sin UTC se corre un día.
});

export async function getAsignaciones(): Promise<PantallaAsignaciones> {
  const profesor = await requireProfesor();

  const [plantillas, asignaciones] = await Promise.all([
    prisma.rutina.findMany({
      where: { profesorId: profesor.id, activo: true, esPlantilla: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        objetivo: true,
        diasPorSemana: true,
        duracionSemanas: true,
        _count: { select: { asignaciones: true } },
      },
    }),
    prisma.asignacionRutina.findMany({
      where: { profesorId: profesor.id },
      orderBy: { fechaInicio: "desc" },
      select: {
        id: true,
        fechaInicio: true,
        estado: true,
        alumno: { select: { nombre: true, apellido: true, activo: true } },
        rutina: { select: { nombre: true, duracionSemanas: true } },
      },
    }),
  ]);

  if (usarDemo(asignaciones.length > 0 || plantillas.length > 0)) {
    return ASIGNACIONES_DEMO;
  }

  return {
    plantillas: plantillas.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      objetivo: p.objetivo,
      dias: p.diasPorSemana,
      semanas: p.duracionSemanas,
      asignadas: p._count.asignaciones,
    })),
    filas: asignaciones.map((a) => {
      const semanas = a.rutina.duracionSemanas;
      const transcurridas =
        Math.floor((Date.now() - a.fechaInicio.getTime()) / MS_POR_SEMANA) + 1;

      return {
        id: a.id,
        alumno: nombreCompleto(a.alumno.nombre, a.alumno.apellido),
        iniciales: iniciales(a.alumno.nombre, a.alumno.apellido),
        estadoAlumno: a.alumno.activo ? ("activo" as const) : ("ausente" as const),
        rutina: a.rutina.nombre,
        desde: FORMATO_FECHA.format(a.fechaInicio),
        semana: semanas ? Math.min(Math.max(1, transcurridas), semanas) : null,
        semanas,
        finalizada: a.estado !== "activa",
      };
    }),
    esDemo: false,
  };
}
