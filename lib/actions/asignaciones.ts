"use server";

// ============================================================================
// Asignaciones: qué rutina entrena cada alumno y en qué período.
//
// Es la tabla que une los dos flujos del profesor con el del alumno: de acá sale
// la pantalla "hoy te toca". Por eso las bajas son de estado y no de fila
// (ver eliminarAsignacion).
// ============================================================================

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import {
  assertEsProfesorDe,
  assertEsProfesorDeAsignacion,
  assertEsProfesorDeRutina,
} from "@/lib/auth/guards";
import { ejecutar, fallo, ok, validar } from "@/lib/actions/resultado";
import type { ResultadoAction } from "@/lib/actions/resultado";
import {
  asignarRutinaSchema,
  cambiarEstadoAsignacionSchema,
  idAsignacionSchema,
} from "@/lib/validaciones/asignaciones";

function revalidarAsignaciones(alumnoId?: string) {
  revalidatePath("/asignaciones");
  revalidatePath("/alumnos");
  revalidatePath("/dashboard");
  // La rutina del día del alumno sale de su asignación activa.
  revalidatePath("/hoy");
  if (alumnoId) revalidatePath(`/alumnos/${alumnoId}`);
}

export async function asignarRutina(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(asignarRutinaSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { rutinaId, alumnoId, ...datos } = validacion.datos;

    // Los dos guards, no uno: el profesor tiene que ser dueño de la rutina *y*
    // tener al alumno asignado. Cada uno cubre la mitad del par.
    const profesor = await assertEsProfesorDe(alumnoId);
    await assertEsProfesorDeRutina(rutinaId);

    const yaAsignada = await prisma.asignacionRutina.findFirst({
      where: { rutinaId, alumnoId, estado: "activa" },
      select: { id: true },
    });

    if (yaAsignada) {
      return fallo("Ese alumno ya tiene esta rutina activa.", {
        rutinaId: ["Ya está asignada y activa."],
      });
    }

    const asignacion = await prisma.asignacionRutina.create({
      data: { ...datos, rutinaId, alumnoId, profesorId: profesor.id },
      select: { id: true },
    });

    revalidarAsignaciones(alumnoId);

    return ok({ id: asignacion.id }, "Rutina asignada.");
  });
}

/**
 * Finaliza, cancela o reactiva una asignación.
 *
 * Al finalizarla se le pone fecha de fin si no tenía: sin eso, el mesociclo
 * queda abierto para siempre en el historial del alumno.
 */
export async function cambiarEstadoAsignacion(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(cambiarEstadoAsignacionSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id, estado } = validacion.datos;
    const { alumnoId } = await assertEsProfesorDeAsignacion(id);

    const actual = await prisma.asignacionRutina.findUniqueOrThrow({
      where: { id },
      select: { fechaFin: true },
    });

    await prisma.asignacionRutina.update({
      where: { id },
      data: {
        estado,
        fechaFin:
          estado === "activa"
            ? null
            : (actual.fechaFin ?? fechaDeHoy()),
      },
    });

    revalidarAsignaciones(alumnoId);

    return ok(
      { id },
      estado === "activa"
        ? "Asignación reactivada."
        : estado === "completada"
          ? "Asignación finalizada."
          : "Asignación cancelada.",
    );
  });
}

/**
 * Borra la asignación, pero solo si no hay sesiones colgando.
 *
 * `sesiones_entrenamiento.asignacion_id` es ON DELETE SET NULL: si el alumno ya
 * entrenó, borrar la asignación deja esas sesiones sin plan asociado y el
 * historial deja de poder responder "¿contra qué rutina fue esto?". En ese caso
 * corresponde cancelarla, no borrarla.
 */
export async function eliminarAsignacion(
  _estado: unknown,
  formData: FormData,
): Promise<ResultadoAction<{ id: string }>> {
  return ejecutar(async () => {
    const validacion = validar(idAsignacionSchema, formData);
    if (!validacion.ok) return validacion.resultado;

    const { id } = validacion.datos;
    const { alumnoId } = await assertEsProfesorDeAsignacion(id);

    const sesiones = await prisma.sesionEntrenamiento.count({
      where: { asignacionId: id },
    });

    if (sesiones > 0) {
      return fallo(
        `No se puede borrar: el alumno ya registró ${sesiones} ${
          sesiones === 1 ? "sesión" : "sesiones"
        } con esta rutina. Cancelala o finalizala para que quede en el historial.`,
      );
    }

    await prisma.asignacionRutina.delete({ where: { id } });

    revalidarAsignaciones(alumnoId);

    return ok({ id }, "Asignación eliminada.");
  });
}

/**
 * Hoy a mediodía UTC. Misma convención que `fechaSchema`: las columnas son DATE
 * y el mediodía evita que un corrimiento de zona guarde el día anterior.
 */
function fechaDeHoy() {
  const ahora = new Date();
  return new Date(
    Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 12),
  );
}
