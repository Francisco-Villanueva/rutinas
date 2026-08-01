import "server-only";

import { prisma } from "@/lib/db";
import { requireProfesor } from "@/lib/auth/guards";
import { iniciales, nombreCompleto } from "@/lib/utils";
import type { PantallaAsignaciones } from "@/lib/data/tipos";

const MS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000;

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC", // fecha_inicio es DATE: sin UTC se corre un día.
});

export async function getAsignaciones(): Promise<PantallaAsignaciones> {
  const profesor = await requireProfesor();

  const [plantillas, asignaciones, alumnos, rutinas] = await Promise.all([
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
        alumnoId: true,
        rutinaId: true,
        alumno: { select: { nombre: true, apellido: true, activo: true } },
        rutina: { select: { nombre: true, duracionSemanas: true } },
      },
    }),
    // Los alumnos vinculados y las rutinas del profesor alimentan el formulario
    // de alta. Se piden siempre: aunque las filas de abajo sean de ejemplo, el
    // profesor puede tener alumnos y rutinas reales para asignar.
    prisma.profesorAlumno.findMany({
      where: { profesorId: profesor.id, activo: true },
      orderBy: { alumno: { nombre: "asc" } },
      select: {
        alumno: { select: { id: true, nombre: true, apellido: true } },
      },
    }),
    prisma.rutina.findMany({
      where: { profesorId: profesor.id, activo: true },
      orderBy: [{ esPlantilla: "desc" }, { nombre: "asc" }],
      select: { id: true, nombre: true, esPlantilla: true },
    }),
  ]);

  const opciones = {
    alumnos: alumnos.map((v) => ({
      id: v.alumno.id,
      nombre: nombreCompleto(v.alumno.nombre, v.alumno.apellido),
    })),
    rutinas,
  };

  return {
    ...opciones,
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
        alumnoId: a.alumnoId,
        alumno: nombreCompleto(a.alumno.nombre, a.alumno.apellido),
        iniciales: iniciales(a.alumno.nombre, a.alumno.apellido),
        estadoAlumno: a.alumno.activo ? ("activo" as const) : ("ausente" as const),
        rutinaId: a.rutinaId,
        rutina: a.rutina.nombre,
        desde: FORMATO_FECHA.format(a.fechaInicio),
        semana: semanas ? Math.min(Math.max(1, transcurridas), semanas) : null,
        semanas,
        estado: a.estado,
        finalizada: a.estado !== "activa",
      };
    }),
  };
}
