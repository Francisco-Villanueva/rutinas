import "server-only";

import { prisma } from "@/lib/db";
import { requireAlumno } from "@/lib/auth/guards";
import { iniciales, nombreCompleto } from "@/lib/utils";

/** Datos de la pantalla de perfil del alumno: quién es y con quién entrena. */
export async function getPerfil() {
  const alumno = await requireAlumno();

  const [vinculo, asignacion, sesiones] = await Promise.all([
    prisma.profesorAlumno.findFirst({
      where: { alumnoId: alumno.id, activo: true },
      orderBy: { fechaInicio: "desc" },
      select: { profesor: { select: { nombre: true, apellido: true, email: true } } },
    }),
    prisma.asignacionRutina.findFirst({
      where: { alumnoId: alumno.id, estado: "activa" },
      orderBy: { fechaInicio: "desc" },
      select: { rutina: { select: { nombre: true, objetivo: true } } },
    }),
    prisma.sesionEntrenamiento.count({
      where: { alumnoId: alumno.id, estado: "completada" },
    }),
  ]);

  return {
    nombre: nombreCompleto(alumno.nombre, alumno.apellido),
    iniciales: iniciales(alumno.nombre, alumno.apellido),
    email: alumno.email,
    profesor: vinculo
      ? {
          nombre: nombreCompleto(
            vinculo.profesor.nombre,
            vinculo.profesor.apellido,
          ),
          email: vinculo.profesor.email,
        }
      : null,
    rutina: asignacion?.rutina.nombre ?? null,
    objetivo: asignacion?.rutina.objetivo ?? null,
    entrenamientos: sesiones,
  };
}
